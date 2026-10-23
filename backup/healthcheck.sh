#!/usr/bin/env bash
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/backup}"
MAX_AGE_MIN="${BACKUP_HEALTHCHECK_MAX_AGE_MIN:-2160}"

[ -z "${BACKUP_CRON:-}" ] && exit 0

for file in "$STATE_DIR/database-ok" "$STATE_DIR/started"; do
	[ -f "$file" ] && [ -z "$(find "$file" -mmin +"$MAX_AGE_MIN")" ] && exit 0
done

echo "No successful database backup in the last $MAX_AGE_MIN minutes"
exit 1
