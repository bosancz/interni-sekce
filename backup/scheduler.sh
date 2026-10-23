#!/usr/bin/env bash
set -uo pipefail

CRON="${BACKUP_CRON:-}"
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/backup}"

source "${BACKUP_LIB_DIR:-$(dirname "$0")}/status.sh"

if [ -z "$CRON" ]; then
	[ "${1:-}" = "--next" ] && echo "Scheduled backups are disabled" && exit 0
	echo "BACKUP_CRON is not set, scheduled backups are disabled; run them with: backup [database|files]"
	record_interrupted_runs || true
	until record_schedule "" "" ""; do sleep 300; done
	exec sleep infinity
fi

read -r -a fields <<<"$CRON"
if [ "${#fields[@]}" -ne 5 ]; then
	echo "BACKUP_CRON must have 5 fields (minute hour day month weekday), got: $CRON" >&2
	exit 1
fi

match_field() {
	local value=$1 spec=$2 min=$3 max=$4 item range step from to
	IFS=, read -r -a items <<<"$spec"
	for item in "${items[@]}"; do
		range=${item%%/*}
		step=1
		[ "$range" != "$item" ] && step=${item#*/}
		case $range in
		"*") from=$min to=$max ;;
		*-*) from=${range%-*} to=${range#*-} ;;
		*)
			from=$range
			to=$range
			[ "$step" -ne 1 ] && to=$max
			;;
		esac
		if [ "$((10#$value))" -ge "$((10#$from))" ] && [ "$((10#$value))" -le "$((10#$to))" ] &&
			[ $(((10#$value - 10#$from) % step)) -eq 0 ]; then
			return 0
		fi
	done
	return 1
}

match_weekday() {
	match_field "$1" "$2" 0 7 || { [ "$1" -eq 0 ] && match_field 7 "$2" 0 7; }
}

day_matches() {
	local day month weekday
	read -r day month weekday <<<"$(date -d "@$1" '+%d %m %w')"
	match_field "$month" "${fields[3]}" 1 12 || return 1
	if [ "${fields[2]}" != "*" ] && [ "${fields[4]}" != "*" ]; then
		match_field "$day" "${fields[2]}" 1 31 || match_weekday "$weekday" "${fields[4]}"
	else
		match_field "$day" "${fields[2]}" 1 31 && match_weekday "$weekday" "${fields[4]}"
	fi
}

next_run() {
	local time=$((($(date +%s) / 60 + 1) * 60)) end minute hour
	end=$((time + 4 * 366 * 24 * 3600))
	while [ "$time" -lt "$end" ]; do
		if ! day_matches "$time"; then
			time=$(date -d "$(date -d "@$time" +%F) +1 day" +%s)
			continue
		fi
		read -r minute hour <<<"$(date -d "@$time" '+%M %H')"
		if ! match_field "$hour" "${fields[1]}" 0 23; then
			time=$(((time / 3600 + 1) * 3600))
			continue
		fi
		if match_field "$minute" "${fields[0]}" 0 59; then
			echo "$time"
			return 0
		fi
		time=$((time + 60))
	done
	return 1
}

if [ "${1:-}" = "--next" ]; then
	next=$(next_run) || exit 1
	date -d "@$next"
	exit 0
fi

mkdir -p "$STATE_DIR"
touch "$STATE_DIR/started"
record_interrupted_runs || true

echo "Backups to Google Drive scheduled by cron \"$CRON\" ($TZ)"

while true; do
	if ! next=$(next_run); then
		echo "BACKUP_CRON \"$CRON\" never matches within four years" >&2
		exit 1
	fi
	echo "Next backup at $(date -d "@$next" '+%Y-%m-%d %H:%M')"
	recorded=""
	while [ "$(date +%s)" -lt "$next" ]; do
		if [ -z "$recorded" ] && record_schedule "$CRON" "${TZ:-}" "$next"; then recorded=1; fi
		wait_s=$((next - $(date +%s)))
		[ -z "$recorded" ] && [ "$wait_s" -gt 300 ] && wait_s=300
		[ "$wait_s" -gt 0 ] && sleep "$wait_s"
	done

	backup database || echo "Database backup finished with errors"
	(backup files || echo "File backup finished with errors") &
done
