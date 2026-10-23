#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_DRIVE_FOLDER_ID:?BACKUP_DRIVE_FOLDER_ID is not set}"

source "${BACKUP_LIB_DIR:-$(dirname "$0")}/status.sh"

REMOTE="gdrive:"
DB_PREFIX="interni-sekce-db-"
KEEP_DAYS="${BACKUP_DB_KEEP_DAYS:-}"
KEEP_MONTHS="${BACKUP_DB_KEEP_MONTHS:-}"
KEEP_DELETED_DAYS="${BACKUP_FILES_KEEP_DELETED_DAYS:-}"
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/backup}"
DATA_DIR="${DATA_DIR:-/data}"
read -r -a EXCLUDE_DIRS <<<"${BACKUP_EXCLUDE_DIRS-thumbs thumbnails}"
read -r -a EXCLUDE_TABLE_DATA <<<"${BACKUP_EXCLUDE_TABLE_DATA-photo_embeddings}"

export RCLONE_CONFIG=""
export RCLONE_RETRIES=1
export RCLONE_CONFIG_GDRIVE_TYPE="${RCLONE_CONFIG_GDRIVE_TYPE:-drive}"
export RCLONE_CONFIG_GDRIVE_SCOPE=drive
export RCLONE_CONFIG_GDRIVE_SERVICE_ACCOUNT_FILE="${GOOGLE_KEY_FILE:-/keys/google.json}"
export RCLONE_CONFIG_GDRIVE_IMPERSONATE="${GOOGLE_IMPERSONATE:-interni@bosan.cz}"
export RCLONE_CONFIG_GDRIVE_ROOT_FOLDER_ID="$BACKUP_DRIVE_FOLDER_ID"
export RCLONE_CONFIG_GDRIVE_TEAM_DRIVE="${BACKUP_DRIVE_SHARED_DRIVE_ID:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

run_info() { [ -n "${RUN_INFO:-}" ] && echo "$1=$2" >>"$RUN_INFO" || true; }

format_rclone_log() {
	jq -R -r --unbuffered 'fromjson? // {msg: .} | select(.object == null or .level != "info") | (.msg | rtrimstr("\n") | gsub("^ +"; "")) as $msg | if .time then "[\(.time[0:19] | sub("T"; " "))] \($msg)" else $msg end'
}

backup_database() {
	local name
	name="${DB_PREFIX}$(date +%Y-%m-%d-%H%M)"
	tmp="$(mktemp -d)"
	trap 'rm -rf "$tmp"' EXIT

	local args=(--no-owner --no-privileges --file "$tmp/$name.sql")
	for table in "${EXCLUDE_TABLE_DATA[@]}"; do args+=("--exclude-table-data=$table"); done

	log "Dumping database ${PGDATABASE:-}"
	pg_dump "${args[@]}"
	(cd "$tmp" && zip -q -9 -m "$name.zip" "$name.sql")
	log "Database dumped to $name.zip ($(numfmt --to=iec --suffix=B "$(stat -c %s "$tmp/$name.zip")"))"
	run_info file_name "$name.zip"
	run_info bytes "$(stat -c %s "$tmp/$name.zip")"

	rclone copyto "$tmp/$name.zip" "${REMOTE}databaze/denni/$name.zip"
	if ! rclone lsf "${REMOTE}databaze/mesicni" --include "${DB_PREFIX}$(date +%Y-%m)-*" 2>/dev/null | grep -q .; then
		rclone copyto "$tmp/$name.zip" "${REMOTE}databaze/mesicni/$name.zip"
		log "Uploaded $name.zip as this month's backup"
	fi
	log "Uploaded $name.zip"

	if [ -n "$KEEP_DAYS" ]; then
		rclone delete "${REMOTE}databaze/denni" --min-age "${KEEP_DAYS}d" --include "${DB_PREFIX}*" --drive-use-trash=false
	fi
	if [ -n "$KEEP_MONTHS" ]; then
		rclone delete "${REMOTE}databaze/mesicni" --min-age "$((KEEP_MONTHS * 31))d" --include "${DB_PREFIX}*" --drive-use-trash=false
	fi

	touch "$STATE_DIR/database-ok"
}

backup_files() {
	log "Syncing $DATA_DIR"
	local status=0 excludes=() rclone_log stats
	for dir in "${EXCLUDE_DIRS[@]}"; do excludes+=(--exclude "/$dir/**"); done
	rclone_log="$(mktemp)"
	set +e
	rclone sync "$DATA_DIR" "${REMOTE}soubory" \
		"${excludes[@]}" \
		--backup-dir "${REMOTE}smazane/$(date +%Y-%m-%d)" \
		--tpslimit 5 \
		--use-json-log --stats 10m --stats-one-line --stats-log-level NOTICE -v \
		2>&1 | tee "$rclone_log" | format_rclone_log
	status=${PIPESTATUS[0]}
	set -e

	stats="$(jq -R -s -c '[split("\n")[] | fromjson? | select(.stats)] | last | .stats // {}' "$rclone_log")"
	run_info bytes "$(jq -R -r 'fromjson? | select(.level == "info" and (.msg | startswith("Copied")) and .object) | .object' "$rclone_log" |
		while IFS= read -r object; do stat -c %s "$DATA_DIR/$object" 2>/dev/null || true; done |
		awk '{ sum += $1 } END { print sum + 0 }')"
	run_info files_transferred "$(jq -r '.transfers // empty' <<<"$stats")"
	run_info files_removed "$(jq -r '.renames // empty' <<<"$stats")"
	if [ -n "${RUN_INFO:-}" ]; then
		jq -R -r 'fromjson? | select(.level == "error") | .msg | rtrimstr("\n")' "$rclone_log" | awk '!seen[$0]++' | tail -n 5 >"$RUN_INFO.errors" || true
	fi
	rm -f "$rclone_log"

	if [ -n "$KEEP_DELETED_DAYS" ]; then
		local cutoff
		cutoff="$(date -d "-${KEEP_DELETED_DAYS} days" +%Y-%m-%d)"
		rclone lsf "${REMOTE}smazane" --dirs-only 2>/dev/null | while read -r dir; do
			dir="${dir%/}"
			if [[ "$dir" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ && "$dir" < "$cutoff" ]]; then
				rclone purge "${REMOTE}smazane/$dir" --drive-use-trash=false
				log "Deleted files removed before $dir"
			fi
		done
	fi

	if [ "$status" -ne 0 ]; then
		log "File sync stopped with code $status, the next run continues where it ended"
		return "$status"
	fi

	log "Files synced"
	touch "$STATE_DIR/files-ok"
}

mkdir -p "$STATE_DIR"

run_step() {
	local type=$1 id status log error
	exec 9>"$STATE_DIR/$type.lock"
	if ! flock -n 9; then
		log "The $type backup is already running, skipping"
		return 0
	fi
	log="$(mktemp)"
	export RUN_INFO
	RUN_INFO="$(mktemp)"
	id="$(record_run_start "$type")" || id=""

	set +e
	"$0" "run-$type" 2>&1 | tee "$log"
	status=${PIPESTATUS[0]}
	set -e

	error=""
	if [ "$status" -ne 0 ]; then
		if [ -s "$RUN_INFO.errors" ]; then
			error="$(cat "$RUN_INFO.errors")"
		else
			error="$(tail -n 20 "$log")"
		fi
	fi
	record_run_finish "$id" "$([ "$status" -eq 0 ] && echo ok || echo error)" "$RUN_INFO" "$error" || true
	rm -f "$log" "$RUN_INFO" "$RUN_INFO.errors"
	return "$status"
}

case "${1:-all}" in
	database | files) run_step "$1" ;;
	run-database) backup_database ;;
	run-files) backup_files ;;
	all)
		status=0
		"$0" database || status=$?
		"$0" files || status=$?
		exit "$status"
		;;
	*)
		echo "Usage: backup [all|database|files]" >&2
		exit 2
		;;
esac
