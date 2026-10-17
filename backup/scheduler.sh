#!/usr/bin/env bash
set -uo pipefail

TIME="${BACKUP_TIME:-04:00}"
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/backup}"

mkdir -p "$STATE_DIR"
touch "$STATE_DIR/started"

echo "Backups to Google Drive scheduled daily at $TIME ($TZ)"

while true; do
	now=$(date +%s)
	next=$(date -d "today $TIME" +%s)
	[ "$next" -le "$now" ] && next=$(date -d "tomorrow $TIME" +%s)
	sleep $((next - now))

	backup all || echo "Backup finished with errors"
done
