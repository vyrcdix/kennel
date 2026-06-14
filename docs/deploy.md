# Deploying Steep

> **Brand vs. codename.** The repo, env vars (`KENNEL_MCP_TOKEN`),
> systemd unit (`kennel.service`), and DB file (`kennel.db`) keep the
> internal codename `kennel`. **Steep** is the user-facing brand: the
> in-app wordmark, the public domain `steep.work`, and the language
> in this doc.

Steep is single-user. This doc gives you the recommended path
(Hetzner + Tailscale + Caddy at `steep.work`) plus alternates and
rollback notes.

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
                   │  HTTPS
                   ▼
   ┌──────────────────────────────────────┐
   │           steep.work                 │
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
- **`KENNEL_MCP_TOKEN`** — a long random string. Bearer auth for the
  `/mcp` endpoint (how Claude clients authenticate).
- **`KENNEL_INITIAL_PASSWORD`** — the shared password for the web UI /
  API. Seeded on first boot; after that, change it from Settings →
  Account. Without it set, app auth is **disabled** (dev default) and
  `/api` is open — so on a public box, set it.
- **Backups.** SQLite + a markdown directory. Trivial to back up,
  catastrophic to lose.

---

## Path A — Hetzner + Tailscale + Caddy (private)

> **If you have `steep.work` (or any domain) registered, skip to
> [Path B](#path-b--public-domain--caddy).** Path B uses the real
> domain end-to-end and is the simplest path when you already have
> DNS. Path A here stays private to your tailnet — useful when you
> want to keep the server off the public internet entirely.

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

First (still as root) create the install directory and hand it to the
`kennel` user. The bootstrap created `kennel` with
`--disabled-password`, so it cannot `sudo` — keep ownership operations
on the root side.

```sh
# Still as root
mkdir -p /opt/kennel
chown kennel:kennel /opt/kennel
```

Then switch to the `kennel` user (root can `su` without a password) and
pull the repo:

```sh
su - kennel
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
Environment=KENNEL_INITIAL_PASSWORD=PASTE_PASSWORD_HERE
Environment=KENNEL_SKIP_SEED=1
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
```

Now paste your secrets into the file. The simplest, history-safe way is
`nano`:

```sh
nano /etc/systemd/system/kennel.service
# Environment=KENNEL_MCP_TOKEN=PASTE_TOKEN_HERE
#   → replace with a long random string (openssl rand -hex 32)
# Environment=KENNEL_INITIAL_PASSWORD=PASTE_PASSWORD_HERE
#   → replace with the shared web-UI password (≥ 8 chars)
# Ctrl+O, Enter, Ctrl+X
```

`KENNEL_INITIAL_PASSWORD` is only read on **first boot**, to seed the
password when none is set. Once seeded it's inert — change the password
from Settings → Account, not by editing this file. (You can delete the
line after first boot if you like; leaving it is harmless.)

Or if you'd rather scripts (token will live in bash_history — fine if
that's your own shell, not fine on a shared box):

```sh
YOUR_TOKEN=<paste-it-here>
sed -i "s/PASTE_TOKEN_HERE/$YOUR_TOKEN/" /etc/systemd/system/kennel.service
unset YOUR_TOKEN
```

Then enable and start:

```sh
systemctl daemon-reload
systemctl enable --now kennel
systemctl status kennel    # should show 'active (running)'
journalctl -u kennel -n 30 # check the boot log
```

You should see `[kennel] listening on http://127.0.0.1:8421` and a
single `[db] applied migration: …` line per migration that hasn't run
yet.

`KENNEL_SKIP_SEED=1` in the unit means a fresh/empty DB stays empty —
no demo fixtures. The log will say `[seed] skipped — KENNEL_SKIP_SEED
set`. Leave it set on production. (Dev — local, no env var — still
seeds fixtures, which is what you want there.)

### Starting from a clean slate (wiping demo data)

If the server was seeded with the demo fixtures (it would have been on
any boot before `KENNEL_SKIP_SEED` was set) and you want it genuinely
empty for your real data:

```sh
systemctl stop kennel
rm -f /opt/kennel/server/kennel.db /opt/kennel/server/kennel.db-wal /opt/kennel/server/kennel.db-shm
rm -rf /opt/kennel/server/content/*
# confirm KENNEL_SKIP_SEED=1 is in the unit (see above), then:
systemctl start kennel
journalctl -u kennel -n 10 --no-pager
```

The log should show the migrations re-applying on the new empty DB and
`[seed] skipped`. Steep boots with zero projects — the dashboard shows
the "No projects" state; create your real threads from there.

> This is destructive — it deletes **everything**, not just the demo
> data. Only do it before you've added real data, or take a backup
> first (`cp kennel.db kennel.db.before-wipe`).

### Resetting a live instance (wipe your own data, e.g. between dogfood runs)

Same idea as the clean slate above, but for an instance that already holds
**real data** — so it **backs up first** (reversible) and confirms the paths
rather than assuming them.

```sh
# 0. Confirm the paths THIS instance uses (don't assume the defaults).
systemctl show kennel -p Environment --no-pager
#    note KENNEL_DB=…  and KENNEL_CONTENT_DIR=…  (unset content → /opt/kennel/server/content)

# 1. Stop, then back up (reversible).
systemctl stop kennel
ts=$(date -u +%Y%m%d-%H%M%S)
cp /opt/kennel/server/kennel.db "/opt/kennel/server/kennel.db.$ts.bak"
tar czf "/opt/kennel/server/content-$ts.tgz" -C /opt/kennel/server content

# 2. Wipe the DB (+ WAL/SHM) and content.
rm -f /opt/kennel/server/kennel.db /opt/kennel/server/kennel.db-wal /opt/kennel/server/kennel.db-shm
rm -rf /opt/kennel/server/content/*

# 3. Start — fresh empty DB, migrations re-apply, no demo seed.
systemctl start kennel
journalctl -u kennel -n 20 --no-pager
```

**Resets:** all data **and the login password** (the hash lives in the DB) — it
re-seeds from `KENNEL_INITIAL_PASSWORD` on the fresh boot if that's still in the
unit (otherwise auth is disabled until you set one). **Persists:**
`KENNEL_MCP_TOKEN` (it's env, not in the DB), so MCP clients keep working.

**Restore** from the backup if you regret it:

```sh
systemctl stop kennel
cp "/opt/kennel/server/kennel.db.$ts.bak" /opt/kennel/server/kennel.db
rm -f /opt/kennel/server/kennel.db-wal /opt/kennel/server/kennel.db-shm
rm -rf /opt/kennel/server/content/* && tar xzf "/opt/kennel/server/content-$ts.tgz" -C /opt/kennel/server
systemctl start kennel
```

> **Non-destructive alternative:** instead of wiping, dogfood on a **parallel
> instance** and leave this one alone — `ops/provision.sh dogfood` (see
> `docs/multi-tenant.md`) gives a clean empty `dogfood.steep.work` with its own
> DB; `deprovision.sh dogfood --purge` removes it when you're done.

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

Use this when you have a real domain (e.g. `steep.work`). Same VPS,
same systemd unit, same backups as Path A — only the network layer
changes.

1. Skip the Tailscale `bind`. Caddy listens on `:443`.
2. Open the firewall:
   ```sh
   ufw allow 80
   ufw allow 443
   ```
3. Point a DNS `A` record (`steep.work`) at the VPS IP. (At Porkbun:
   Domain Management → DNS Records → add `A · @ · <your-ip>`. Set TTL
   to 600 while you're iterating, raise to 3600 once stable.)
4. Use a public Caddyfile. Caddy serves the built SPA from `dist/`
   directly and only proxies the API + MCP to Node — Node never
   handles a frontend asset request:
   ```caddy
   steep.work {
       encode gzip

       # API + MCP → the Node backend. flush_interval -1 keeps the
       # /api/events SSE stream unbuffered.
       @backend path /api/* /mcp /mcp/*
       handle @backend {
           reverse_proxy 127.0.0.1:8421 {
               flush_interval -1
           }
       }

       # Everything else → the built SPA, with client-side-routing
       # fallback so /aging, /project/x, etc. resolve to index.html.
       handle {
           root * /opt/kennel/dist
           try_files {path} /index.html
           file_server
       }
   }
   ```
   Caddy issues the Let's Encrypt cert automatically on first request.
   `/opt/kennel/dist` is world-readable (755) so the `caddy` user can
   serve it without ownership changes.

   > **Auth is handled by the app, not Caddy.** Steep has a login
   > screen and session cookies — do **not** add `basic_auth` to this
   > Caddyfile. If you applied a Caddy `basic_auth` stopgap during an
   > earlier deploy, remove it: revert to the Caddyfile above and
   > `systemctl reload caddy`. The app's session gate replaces it.
5. Set `KENNEL_MCP_TOKEN` (guards `/mcp`) and
   `KENNEL_INITIAL_PASSWORD` (seeds the web-UI login). Between them
   nothing on the public box is unauthenticated.

Test from off-network:
```sh
curl -s -o /dev/null -w "%{http_code}\n" https://steep.work/          # SPA → 200
curl -s -o /dev/null -w "%{http_code}\n" https://steep.work/api/projects  # API → 200
```

Then point Claude Desktop / Code at `https://steep.work/mcp` with the
bearer header, and open `https://steep.work/` in a browser for the UI.

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
