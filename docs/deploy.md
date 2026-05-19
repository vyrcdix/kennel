# Deploying Kennel

Kennel is single-user. This doc gives you the recommended path
(Hetzner + Tailscale + Caddy) plus alternates and rollback notes.

> **TL;DR.** A ~€5/month box, Tailscale for network, a systemd unit
> that runs the Node server, and Caddy fronting it on the Tailscale
> interface only. End-to-end deploy is ~45–60 minutes of your time
> once accounts are signed up.

---

## Architecture at a glance

```
   ┌─ phone / claude.ai / laptop ─┐
   │       (Tailscale client)     │
   └───────────────┬──────────────┘
                   │  HTTPS via Tailscale
                   ▼
   ┌──────────────────────────────────────┐
   │  kennel.<your-tailnet>.ts.net        │
   │  ┌──────── Caddy (443) ──────────┐   │
   │  │  reverse_proxy → 127.0.0.1:8421 │ │
   │  └────────────────┬─────────────┘   │
   │                   │                  │
   │  ┌─── systemd: kennel.service ──┐    │
   │  │  npm --prefix server start     │  │
   │  │  /opt/kennel/server/kennel.db  │  │
   │  │  /opt/kennel/server/content/   │  │
   │  └────────────────────────────────┘  │
   │   Hetzner CX22 · Debian 12 · 4 GB    │
   └──────────────────────────────────────┘
```

---

## Requirements

- A Linux VPS with **persistent disk** and a public IP (any 1 vCPU /
  1 GB RAM / 20 GB disk works — Kennel uses < 200 MB RAM at idle).
- A **Tailscale** account (free tier is plenty).
- **Node.js 22 LTS or 24** (Kennel is tested on 24). `better-sqlite3`
  has prebuilds for both — no native compile needed.
- **Caddy** or another reverse proxy (we use Caddy for HTTPS).
- **`KENNEL_MCP_TOKEN`** — a long random string for bearer auth. Even
  on Tailscale, set this so a misconfigured device doesn't bypass it.
- **Backups.** SQLite + a markdown directory. Trivial to back up,
  catastrophic to lose.

---

## Path A — Hetzner + Tailscale + Caddy (recommended)

### 1. Provision the VPS

1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud).
   Verify your ID — Hetzner sometimes takes ~24 hours.
2. Create a new project.
3. Click **Add Server**:
   - **Location**: nearest to you.
   - **Image**: Debian 12.
   - **Type**: CX22 (~€4.50/mo, 2 vCPU / 4 GB / 40 GB SSD).
   - **SSH key**: paste your public key (generate one with
     `ssh-keygen -t ed25519` if you don't have one).
   - **Name**: `kennel-prod`.
4. Note the IPv4 address Hetzner gives you. SSH in:
   ```sh
   ssh root@<ip-address>
   ```

### 2. Bootstrap script

SSH'd in as root, paste this once. It installs Node, Caddy, Tailscale,
and a non-root user.

```sh
# System update
apt update && apt upgrade -y
apt install -y curl git ufw build-essential

# Non-root user for the service
adduser --disabled-password --gecos "" kennel
usermod -aG sudo kennel

# Node.js 24 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Caddy (official repo)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Firewall — allow SSH only from anywhere; Caddy will only listen on the
# Tailscale interface so we don't need to open 443 publicly.
ufw allow OpenSSH
ufw --force enable

# Bring up Tailscale; this prints a URL you open in a browser to
# authenticate the machine into your tailnet.
tailscale up --ssh --hostname kennel-prod
```

When `tailscale up` prints `https://login.tailscale.com/a/…`, open it
in your laptop's browser and approve the machine. Your tailnet should
now show `kennel-prod` as a device.

### 3. Deploy the code

Switch to the `kennel` user and pull the repo:

```sh
su - kennel
cd /opt
sudo mkdir -p /opt/kennel && sudo chown kennel:kennel /opt/kennel
git clone https://github.com/vyrcdix/kennel.git /opt/kennel
cd /opt/kennel
npm install
npm --prefix server install
npm run build                # produces dist/ for the frontend
```

### 4. Build a long token

On your laptop:

```sh
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output (call it `KENNEL_MCP_TOKEN`) in your password manager.

### 5. systemd unit

Back as root on the VPS:

```sh
cat >/etc/systemd/system/kennel.service <<'EOF'
[Unit]
Description=Kennel server (Express + MCP)
After=network.target tailscaled.service

[Service]
Type=simple
User=kennel
WorkingDirectory=/opt/kennel
Environment=NODE_ENV=production
Environment=KENNEL_DB=/opt/kennel/server/kennel.db
Environment=KENNEL_MCP_TOKEN=PASTE_TOKEN_HERE
ExecStart=/usr/bin/npm --prefix server start
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/kennel

[Install]
WantedBy=multi-user.target
EOF

# paste your token in
sed -i "s/PASTE_TOKEN_HERE/$YOUR_TOKEN/" /etc/systemd/system/kennel.service

systemctl daemon-reload
systemctl enable --now kennel
systemctl status kennel    # should show 'active (running)'
journalctl -u kennel -n 30 # check the boot log
```

You should see `[kennel] listening on http://127.0.0.1:8421` and a
single `[db] applied migration: …` line per migration that hasn't run
yet.

### 6. Caddy on the Tailscale interface

Find your tailnet hostname:

```sh
tailscale status --json | grep -i "DNSName"
# e.g. "DNSName":"kennel-prod.tailnet-abc123.ts.net."
```

Write the Caddyfile:

```sh
cat >/etc/caddy/Caddyfile <<'EOF'
kennel-prod.tailnet-abc123.ts.net {
    # Tailscale issues + renews the cert for this hostname.
    tls {
        get_certificate tailscale
    }
    # Only respond on the tailscale0 interface; the public IP stays quiet.
    bind tailscale/kennel-prod

    reverse_proxy 127.0.0.1:8421 {
        flush_interval -1   # required for SSE (the /api/events stream)
    }
}
EOF

systemctl reload caddy
```

The `flush_interval -1` line is important — Kennel streams server-sent
events on `/api/events` for live sync, and Caddy's default buffering
breaks SSE.

Visit `https://kennel-prod.tailnet-abc123.ts.net/` from a device on
your tailnet. You should see the Vite-built UI.

### 7. Register the MCP server with Claude

In **Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kennel": {
      "url": "https://kennel-prod.tailnet-abc123.ts.net/mcp",
      "headers": {
        "Authorization": "Bearer PASTE_TOKEN_HERE"
      }
    }
  }
}
```

In **Claude Code** (`.claude/settings.json` or via `claude mcp add`):

```sh
claude mcp add kennel \
  --url https://kennel-prod.tailnet-abc123.ts.net/mcp \
  --header "Authorization=Bearer PASTE_TOKEN_HERE"
```

Restart the Claude client. In a chat: *"What's in my kennel inbox?"*
— Claude should call `list_queue`.

### 8. Backups

Pick one:

**(a) restic to Backblaze B2** — durable, encrypted, ~$0.10/mo for
this much data.

```sh
apt install -y restic
# Set up a B2 bucket first; export your key id + key.
export B2_ACCOUNT_ID=...
export B2_ACCOUNT_KEY=...
export RESTIC_REPOSITORY=b2:kennel-backups:/
export RESTIC_PASSWORD=...  # long random string, save in 1Password

restic init   # first time only

cat >/etc/cron.daily/kennel-backup <<'EOF'
#!/bin/sh
set -e
export B2_ACCOUNT_ID=... B2_ACCOUNT_KEY=...
export RESTIC_REPOSITORY=b2:kennel-backups:/
export RESTIC_PASSWORD=...
# SQLite-safe online backup
sqlite3 /opt/kennel/server/kennel.db ".backup /tmp/kennel.snapshot"
restic backup /tmp/kennel.snapshot /opt/kennel/server/content
rm -f /tmp/kennel.snapshot
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
EOF
chmod +x /etc/cron.daily/kennel-backup
```

**(b) rsync to your laptop** — simplest, you control the storage.

```sh
# From your laptop, run nightly via cron or systemd timer:
rsync -avz --delete kennel@<host>:/opt/kennel/server/kennel.db \
                    ~/backups/kennel/
rsync -avz --delete kennel@<host>:/opt/kennel/server/content/ \
                    ~/backups/kennel/content/
```

Test the restore path once before you trust it: copy the backup to a
new directory and start a second `kennel.service` against it.

### 9. Updating

```sh
ssh kennel-prod
cd /opt/kennel
git pull
npm install
npm --prefix server install
npm run build
sudo systemctl restart kennel
sudo journalctl -u kennel -f   # watch the migration log
```

Migrations apply automatically on boot (`applyMigrations` in
`server/src/db.ts`). If a new migration fails, the server won't start —
fix it locally, push a hotfix, redeploy.

---

## Path B — Public domain + Caddy

Identical to Path A except:

1. Skip the Tailscale `bind`. Caddy listens on `:443`.
2. Open the firewall:
   ```sh
   ufw allow 80
   ufw allow 443
   ```
3. Point a DNS `A` record (`kennel.your-domain.com`) at the VPS IP.
4. Use a public Caddyfile:
   ```caddy
   kennel.your-domain.com {
       reverse_proxy 127.0.0.1:8421 {
           flush_interval -1
       }
   }
   ```
5. Set a long `KENNEL_MCP_TOKEN` — it's the only thing between the
   public internet and your data.

Domains: $12/yr at Cloudflare Registrar or Porkbun.

---

## Path C — Fly.io

```sh
# In the repo root:
fly launch --no-deploy
# Edit fly.toml:
#  - one region only
#  - one instance only (auto_stop_machines = "off", min_machines_running = 1)
#  - mount a volume at /data
fly volumes create kennel_data --size 3
fly secrets set KENNEL_MCP_TOKEN=<...> KENNEL_DB=/data/kennel.db
fly deploy
```

Caveats:
- **Pin to one VM.** SQLite + multi-VM = silent split-brain.
- Volumes are zonal; if the host machine dies you restore from a
  snapshot — set `[vm] snapshot_retention = 14` or higher.
- SSE works; no Caddy needed (Fly handles HTTPS).

---

## Smoke tests after deploy

```sh
# From a Tailscale-connected device:
curl https://kennel-prod.tailnet-abc123.ts.net/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# SSE liveness:
curl -N https://kennel-prod.tailnet-abc123.ts.net/api/events \
  -H "Authorization: Bearer $TOKEN"
# Should print 'event: hello' then sit waiting; Ctrl-C when satisfied.

# MCP handshake (see docs/mcp-setup.md for the full sequence)
```

In Claude Desktop: *"List my kennel projects"* should round-trip a
`list_projects` tool call.

---

## Rollback

Two-line revert if a deploy breaks something:

```sh
ssh kennel-prod
cd /opt/kennel
git reset --hard HEAD~1   # or to a known-good SHA
npm install && npm --prefix server install && npm run build
sudo systemctl restart kennel
```

If a migration broke the DB:

```sh
sudo systemctl stop kennel
sudo cp /opt/kennel/server/kennel.db.bak /opt/kennel/server/kennel.db
git checkout <last-good-sha>
npm install && npm --prefix server install && npm run build
sudo systemctl start kennel
```

`kennel.db.bak` is written automatically before each atomic doc write
(see `server/src/content.ts`).

---

## Monitoring

The minimum useful set:

- `systemctl status kennel` — service is up
- `journalctl -u kennel --since "1 hour ago" | grep -i error` — log
  sweep
- Disk space: `df -h /opt` — watch the content/ markdown grow
- (Optional) Uptime Kuma or Better Stack pinging
  `https://kennel-prod.tailnet-abc123.ts.net/api/projects` once a
  minute with your token

No metrics endpoint yet — Kennel is small enough that journal + disk
is enough.

---

## Cost summary

| Item | Provider | Monthly |
|---|---|---|
| VPS | Hetzner CX22 | €4.50 |
| Backups | Backblaze B2 (~1 GB) | ~$0.10 |
| Tailscale | free tier | $0 |
| Domain (Path B only) | Porkbun | ~$1 |
| **Total (Path A)** | | **~€5** |

---

## What's not included yet

- **OAuth / multi-user.** Kennel is single-user; the token model is
  enough.
- **CDN.** Frontend bundle is tiny (~250 KB gzipped); served from the
  same box without a CDN is fine.
- **Read replicas.** Single-instance by design.
- **CI/CD.** A `git pull && restart` deploy is fine for this scale.
  GitHub Actions deploy + a SSH key on the box is a half-day addition
  when you want it.

When you outgrow this — multiple users, sharing with a team — Path B
+ Postgres is the next step, but you'll be rewriting a fair amount of
SQLite-specific code. For now: don't.
