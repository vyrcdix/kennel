#!/usr/bin/env bash
# Provision a new Steep user: its own database, content dir, password, MCP
# token, port, systemd instance, and Caddy route. See docs/multi-tenant.md.
#
# Usage:  sudo ops/provision.sh <subdomain>
# Example: sudo ops/provision.sh alice   →   https://alice.steep.work
set -euo pipefail

# ── config (override via env; must match ops/kennel@.service paths) ──────
DOMAIN="${KENNEL_DOMAIN:-steep.work}"
PORT_BASE="${KENNEL_PORT_BASE:-8421}"
CODE_DIR="${KENNEL_CODE_DIR:-/opt/kennel}"
ENV_DIR="${KENNEL_ENV_DIR:-/etc/kennel}"
DATA_ROOT="${KENNEL_DATA_ROOT:-/srv/kennel}"
CADDY_TENANT_DIR="${KENNEL_CADDY_TENANT_DIR:-/etc/caddy/tenants}"
SERVICE_USER="${KENNEL_SERVICE_USER:-kennel}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() { echo "error: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "must run as root (sudo)"
[[ $# -eq 1 ]] || die "usage: $0 <subdomain>"
sub="$1"
[[ "$sub" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || die "invalid subdomain '$sub' (use a-z, 0-9, -)"
id "$SERVICE_USER" >/dev/null 2>&1 || die "service user '$SERVICE_USER' does not exist"
[[ -d "$CODE_DIR" ]] || die "code dir $CODE_DIR not found (deploy first; see docs/deploy.md)"
[[ -f "$SCRIPT_DIR/tenant.caddy.tmpl" ]] || die "missing $SCRIPT_DIR/tenant.caddy.tmpl"

env_file="$ENV_DIR/$sub.env"
data_dir="$DATA_ROOT/$sub"
caddy_route="$CADDY_TENANT_DIR/$sub.caddy"
[[ -e "$env_file" ]] && die "$sub already provisioned ($env_file)"

# ── next free port: highest existing PORT + 1, else PORT_BASE ───────────
maxport="$(grep -hoP '^PORT=\K[0-9]+' "$ENV_DIR"/*.env 2>/dev/null | sort -n | tail -1 || true)"
port=$(( ${maxport:-$((PORT_BASE - 1))} + 1 ))

# ── data dirs (owned by the service user) ───────────────────────────────
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" "$data_dir" "$data_dir/content"
install -d -m 755 "$ENV_DIR"
install -d -m 755 "$CADDY_TENANT_DIR"

# ── credentials ─────────────────────────────────────────────────────────
pass="$(openssl rand -base64 12)"
token="$(openssl rand -hex 32)"

umask 077
cat >"$env_file" <<EOF
# Steep instance — $sub.$DOMAIN  (generated $(date -u +%FT%TZ))
NODE_ENV=production
HOST=127.0.0.1
PORT=$port
KENNEL_DB=$data_dir/kennel.db
KENNEL_CONTENT_DIR=$data_dir/content
KENNEL_INITIAL_PASSWORD=$pass
KENNEL_MCP_TOKEN=$token
KENNEL_SKIP_SEED=1
EOF
chmod 600 "$env_file"

# ── Caddy route ─────────────────────────────────────────────────────────
sed -e "s/__SUB__/$sub/g" -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$port/g" \
	"$SCRIPT_DIR/tenant.caddy.tmpl" >"$caddy_route"

# ── start the instance + publish the route ──────────────────────────────
systemctl enable --now "kennel@$sub"
if systemctl reload caddy 2>/dev/null; then :; else
	echo "warning: 'systemctl reload caddy' failed — reload Caddy manually" >&2
fi

# ── verify it came up ───────────────────────────────────────────────────
sleep 2
if curl -sf "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
	health="ok"
else
	health="NOT RESPONDING — check: journalctl -u kennel@$sub -n 30"
fi

cat <<EOF

  ✅ provisioned $sub
     URL:        https://$sub.$DOMAIN
     password:   $pass
     MCP URL:    https://$sub.$DOMAIN/mcp
     MCP token:  $token
     port:       $port   (localhost only)
     data:       $data_dir
     health:     $health

  The password is changeable from Settings → Account after first login.
EOF
