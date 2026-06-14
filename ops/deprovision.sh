#!/usr/bin/env bash
# Deprovision a Steep user: stop its instance and remove its route + env.
# Data is RETAINED by default — pass --purge to archive then delete it.
#
# Usage:  sudo ops/deprovision.sh <subdomain> [--purge]
set -euo pipefail

DOMAIN="${KENNEL_DOMAIN:-steep.work}"
ENV_DIR="${KENNEL_ENV_DIR:-/etc/kennel}"
DATA_ROOT="${KENNEL_DATA_ROOT:-/srv/kennel}"
CADDY_TENANT_DIR="${KENNEL_CADDY_TENANT_DIR:-/etc/caddy/tenants}"
ARCHIVE_DIR="${KENNEL_ARCHIVE_DIR:-/srv/kennel-archive}"

die() { echo "error: $*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "must run as root (sudo)"
[[ $# -ge 1 ]] || die "usage: $0 <subdomain> [--purge]"
sub="$1"; purge="${2:-}"
[[ "$sub" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || die "invalid subdomain '$sub'"

data_dir="$DATA_ROOT/$sub"

systemctl disable --now "kennel@$sub" 2>/dev/null || true
rm -f "$CADDY_TENANT_DIR/$sub.caddy" "$ENV_DIR/$sub.env"
systemctl reload caddy 2>/dev/null || echo "warning: reload Caddy manually" >&2

if [[ "$purge" == "--purge" ]]; then
	if [[ -d "$data_dir" ]]; then
		install -d "$ARCHIVE_DIR"
		archive="$ARCHIVE_DIR/$sub-$(date -u +%F).tgz"
		tar czf "$archive" -C "$DATA_ROOT" "$sub"
		rm -rf "$data_dir"
		echo "deprovisioned $sub — data archived to $archive and removed"
	else
		echo "deprovisioned $sub — no data dir to purge"
	fi
else
	echo "deprovisioned $sub — data RETAINED at $data_dir"
	echo "  (archive + remove later, or re-run with --purge)"
fi
