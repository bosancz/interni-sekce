STATUS_SCHEMA="${DB_SCHEMA:-public}"

status_sql() {
	local output
	if ! output="$(psql -X -q -A -t -v ON_ERROR_STOP=1 -v schema="$STATUS_SCHEMA" "$@" 2>&1)"; then
		echo "Could not record backup status: $output" >&2
		return 1
	fi
	printf '%s' "$output"
}

record_run_start() {
	status_sql -v type="$1" <<'SQL'
INSERT INTO :"schema".backup_runs (type) VALUES (:'type') RETURNING id;
SQL
}

record_run_finish() {
	local id=$1 status=$2 info=$3 error=$4 file_name="" bytes="" files_transferred="" files_removed="" key value
	[ -n "$id" ] || return 0
	if [ -f "$info" ]; then
		while IFS="=" read -r key value; do
			case $key in
			file_name) file_name=$value ;;
			bytes) bytes=$value ;;
			files_transferred) files_transferred=$value ;;
			files_removed) files_removed=$value ;;
			esac
		done <"$info"
	fi
	status_sql -v id="$id" -v status="$status" -v file_name="$file_name" -v bytes="$bytes" \
		-v files_transferred="$files_transferred" -v files_removed="$files_removed" -v error="$error" <<'SQL' >/dev/null
UPDATE :"schema".backup_runs SET
	status = :'status',
	finished_at = now(),
	file_name = NULLIF(:'file_name', ''),
	bytes = NULLIF(:'bytes', '')::bigint,
	files_transferred = NULLIF(:'files_transferred', '')::int,
	files_removed = NULLIF(:'files_removed', '')::int,
	error = NULLIF(:'error', '')
WHERE id = :'id';
SQL
}

record_run_progress() {
	[ -n "$1" ] || return 0
	status_sql -v id="$1" -v progress="$2" <<'SQL' >/dev/null
UPDATE :"schema".backup_runs SET progress = :'progress'::jsonb || jsonb_build_object('updatedAt', now())
WHERE id = :'id' AND status = 'running';
SQL
}

record_interrupted_runs() {
	status_sql <<'SQL' >/dev/null
UPDATE :"schema".backup_runs SET status = 'error', finished_at = now(), error = 'Přerušeno restartem zálohování.'
WHERE status = 'running';
SQL
}

record_schedule() {
	local next=""
	[ -n "${3:-}" ] && next="$(date -d "@$3" --iso-8601=seconds)"
	status_sql -v cron="$1" -v timezone="$2" -v next="$next" <<'SQL' >/dev/null
INSERT INTO :"schema".backup_schedule (id, cron, timezone, next_run_at, updated_at)
VALUES (1, NULLIF(:'cron', ''), NULLIF(:'timezone', ''), NULLIF(:'next', '')::timestamptz, now())
ON CONFLICT (id) DO UPDATE SET
	cron = EXCLUDED.cron,
	timezone = EXCLUDED.timezone,
	next_run_at = EXCLUDED.next_run_at,
	updated_at = EXCLUDED.updated_at;
SQL
}
