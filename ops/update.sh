#!/usr/bin/env bash
# Update all Steep instances: pull + build the shared code once, then restart
# the fleet. Each instance applies any pending migrations to its OWN database on
# boot, independently. Run a backup first (ops/backup.sh). See docs/multi-tenant.md.
#
# Usage:  sudo ops/update.sh
set -euo pipefail

CODE_DIR="${KENNEL_CODE_DIR:-/opt/kennel}"
SERVICE_USER="${KENNEL_SERVICE_USER:-kennel}"

die() { echo "error: $*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "must run as root (sudo)"
[[ -d "$CODE_DIR" ]] || die "code dir $CODE_DIR not found"

echo "→ pull + build (as $SERVICE_USER)…"
sudo -u "$SERVICE_USER" bash -lc "cd '$CODE_DIR' && git pull --ff-only && npm install && npm --prefix server install && npm run build"

echo "→ restarting all kennel@ instances…"
systemctl restart 'kennel@*'

echo "→ recent boot logs (migrations / listening / errors):"
sleep 2
journalctl -u 'kennel@*' --since "1 min ago" --no-pager | grep -E "applied migration|listening|Error|error" || true
echo "✅ update complete"
