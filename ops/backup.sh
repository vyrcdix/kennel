#!/usr/bin/env bash
# Per-user backup: a SQLite-safe online snapshot of every instance's DB plus its
# content dir. Defaults to local tarballs under $BACKUP_DIR; if RESTIC_REPOSITORY
# is set, backs up to restic instead (tagged per user). See docs/multi-tenant.md.
#
# Usage:  sudo ops/backup.sh
set -euo pipefail

DATA_ROOT="${KENNEL_DATA_ROOT:-/srv/kennel}"
BACKUP_DIR="${KENNEL_BACKUP_DIR:-/srv/kennel-backups}"

die() { echo "error: $*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "must run as root (sudo)"
command -v sqlite3 >/dev/null || die "sqlite3 not installed (apt install sqlite3)"
shopt -s nullglob

stamp="$(date -u +%F)"
for d in "$DATA_ROOT"/*/; do
	sub="$(basename "$d")"
	db="$d/kennel.db"
	[[ -f "$db" ]] || continue
	snap="$(mktemp /tmp/"$sub".XXXXXX.snapshot)"
	sqlite3 "$db" ".backup '$snap'"
	if [[ -n "${RESTIC_REPOSITORY:-}" ]]; then
		restic backup "$snap" "$d/content" --tag "$sub"
	else
		install -d "$BACKUP_DIR/$sub"
		tar czf "$BACKUP_DIR/$sub/$sub-$stamp.tgz" -C "$(dirname "$snap")" "$(basename "$snap")" \
			-C "$d" content 2>/dev/null || \
			tar czf "$BACKUP_DIR/$sub/$sub-$stamp.tgz" -C "$d" .
		echo "backed up $sub → $BACKUP_DIR/$sub/$sub-$stamp.tgz"
	fi
	rm -f "$snap"
done
echo "✅ backup complete"
