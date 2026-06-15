# ops/ — multi-user kit: install, deploy & use (Option A)

A step-by-step runbook for running **multiple independent Steep users — one
process per subdomain**, each with its own database, content dir, password, MCP
token, and port, behind one Caddy front door. Design + rationale:
**`docs/multi-tenant.md`**. Base single-user deploy: **`docs/deploy.md`**.

> All commands run **on the box** (root + systemd + Caddy) — not in CI. Examples
> use the domain `steep.work`; substitute yours.

| File | What it is |
|---|---|
| `kennel@.service` | systemd **template** unit — one instance per subdomain (`%i`) |
| `Caddyfile.example` | main Caddyfile — wildcard cert + `import` of per-user routes |
| `tenant.caddy.tmpl` | per-user route template (`__SUB__` / `__DOMAIN__` / `__PORT__`) |
| `provision.sh` | create a user (db, content, creds, port, unit, route, health-check) |
| `deprovision.sh` | remove a user (data retained unless `--purge`) |
| `update.sh` | pull + build the shared code once, restart the whole fleet |
| `backup.sh` | per-user SQLite-safe snapshots (local tarballs or restic) |

---

## 0. Prerequisites

The base single-user deploy from `docs/deploy.md` must be done: a `kennel`
system user, Node 24, Caddy, the repo at `/opt/kennel`, and a built `dist/`.
Then make sure the box has the kit (pull the latest code):

```sh
sudo -u kennel bash -lc 'cd /opt/kennel && git pull --ff-only && npm install && npm --prefix server install && npm run build'
```

You also need, for the wildcard certificate:
- a **Caddy build with your DNS provider's plugin**
  (e.g. `caddy add-package github.com/caddy-dns/cloudflare`), and
- that provider's **API token** available to Caddy (e.g. in `/etc/default/caddy`
  or the caddy unit's `Environment=`).

---

## 1. Install the kit (one time)

### 1a. systemd template
```sh
sudo cp /opt/kennel/ops/kennel@.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### 1b. Caddy — wildcard cert + per-user route import
```sh
sudo mkdir -p /etc/caddy/tenants
sudo cp /opt/kennel/ops/Caddyfile.example /etc/caddy/Caddyfile
#   → edit /etc/caddy/Caddyfile: set your domain + uncomment the acme_dns line
#     with your DNS provider + token. (If you already have a working single-host
#     Caddyfile you want to keep, instead just append this one line to it:
#         import /etc/caddy/tenants/*.caddy
#     — see §4 "coexisting with the existing single instance".)
sudo systemctl reload caddy
```

### 1c. DNS — one wildcard record, set once
```
*.steep.work   A   <vps-ip>
```
After this, provisioning a user never touches DNS or the Caddyfile again.

---

## 2. Provision a user

```sh
sudo /opt/kennel/ops/provision.sh alice
```

This validates the subdomain, picks the next free port (highest existing
`PORT` in `/etc/kennel/*.env` + 1, starting at `KENNEL_PORT_BASE`), creates
`/srv/kennel/alice/{,content}`, generates a password + MCP token, writes
`/etc/kennel/alice.env` (mode 600), renders the Caddy route, `enable --now`s
`kennel@alice`, reloads Caddy, health-checks it, and prints:

```
  ✅ provisioned alice
     URL:        https://alice.steep.work
     password:   <generated>
     MCP URL:    https://alice.steep.work/mcp
     MCP token:  <generated>
     port:       8421   (localhost only)
     data:       /srv/kennel/alice
     health:     ok
```

Hand the user the URL + password (changeable from **Settings → Account** after
first login). For MCP, point their Claude client at the MCP URL with the token.

**Verify:**
```sh
systemctl status kennel@alice          # active (running)
journalctl -u kennel@alice -n 20       # migrations applied, [seed] skipped, listening
curl -s -o /dev/null -w '%{http_code}\n' https://alice.steep.work/api/health   # 200
```

---

## 3. (Optional) Fold the existing single instance into the scheme

If you already run the legacy single `kennel.service` and want it managed like
the rest (as e.g. `craig.steep.work`):

```sh
systemctl stop kennel
install -d -o kennel -g kennel /srv/kennel/craig/content
mv /opt/kennel/server/kennel.db*        /srv/kennel/craig/          2>/dev/null || true
mv /opt/kennel/server/content/*         /srv/kennel/craig/content/  2>/dev/null || true
chown -R kennel:kennel /srv/kennel/craig

# Write /etc/kennel/craig.env — reuse the EXISTING MCP token so clients keep
# working, and DON'T set KENNEL_INITIAL_PASSWORD (the password is already in the
# DB). Use the port the legacy unit used (8421) to keep things stable:
sudo tee /etc/kennel/craig.env >/dev/null <<'EOF'
NODE_ENV=production
HOST=127.0.0.1
PORT=8421
KENNEL_DB=/srv/kennel/craig/kennel.db
KENNEL_CONTENT_DIR=/srv/kennel/craig/content
KENNEL_MCP_TOKEN=<paste the existing token>
KENNEL_SKIP_SEED=1
EOF
sudo chmod 600 /etc/kennel/craig.env

sudo systemctl disable --now kennel       # retire the old single unit
sudo rm -f /etc/systemd/system/kennel.service && sudo systemctl daemon-reload
sudo systemctl enable --now kennel@craig

# add its route (covered by the wildcard cert) + DNS craig.steep.work
sudo sed -e 's/__SUB__/craig/g; s/__DOMAIN__/steep.work/g; s/__PORT__/8421/g' \
  /opt/kennel/ops/tenant.caddy.tmpl | sudo tee /etc/caddy/tenants/craig.caddy >/dev/null
sudo systemctl reload caddy
```

Then re-point the MCP client at `https://craig.steep.work/mcp`.

---

## 4. Coexisting with the existing single instance (without migrating it)

If you want to keep the legacy `kennel.service` on `steep.work` as-is and just
add a parallel instance (e.g. for dogfooding), two things to know:

1. **Keep your current Caddyfile** — don't overwrite it with `Caddyfile.example`
   (that would drop the `steep.work` block). Just add the import line:
   ```sh
   grep -q 'import /etc/caddy/tenants' /etc/caddy/Caddyfile || \
     echo 'import /etc/caddy/tenants/*.caddy' | sudo tee -a /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```
2. **Avoid a port clash.** The legacy unit uses 8421 but has no
   `/etc/kennel/*.env`, so `provision.sh` can't see it and would also pick 8421.
   Give the kit a separate port band:
   ```sh
   sudo KENNEL_PORT_BASE=8431 /opt/kennel/ops/provision.sh dogfood
   ```
   (A single subdomain also works without the wildcard cert — Caddy issues a
   per-host cert on first request, as long as `dogfood.steep.work` resolves.)

---

## 5. Day-to-day

```sh
# create / remove users
sudo /opt/kennel/ops/provision.sh bob
sudo /opt/kennel/ops/deprovision.sh bob              # stop + unroute; data RETAINED
sudo /opt/kennel/ops/deprovision.sh bob --purge      # …and archive + delete data

# update everyone (pull+build once, restart the fleet; migrations apply per-DB)
sudo /opt/kennel/ops/backup.sh                       # back up first
sudo /opt/kennel/ops/update.sh

# back up every instance (local tarballs, or restic if RESTIC_REPOSITORY is set)
sudo /opt/kennel/ops/backup.sh
```

**Reset one user's data** (e.g. between dogfood runs) — back up first, then wipe
that instance's files and restart it:
```sh
systemctl stop kennel@dogfood
cp /srv/kennel/dogfood/kennel.db "/srv/kennel/dogfood/kennel.db.$(date -u +%F).bak"
rm -f /srv/kennel/dogfood/kennel.db /srv/kennel/dogfood/kennel.db-wal /srv/kennel/dogfood/kennel.db-shm
rm -rf /srv/kennel/dogfood/content/*
systemctl start kennel@dogfood
```
(Wiping the DB also resets that user's password — it re-seeds from
`KENNEL_INITIAL_PASSWORD` if present in its env file; the MCP token, being env,
persists.)

---

## 6. Configuration reference

Every script honours these (defaults shown); override by exporting before the
command. If you change a path, keep `kennel@.service` in sync.

| Var | Default | Used by |
|---|---|---|
| `KENNEL_DOMAIN` | `steep.work` | provision, deprovision |
| `KENNEL_PORT_BASE` | `8421` | provision (first instance's port) |
| `KENNEL_CODE_DIR` | `/opt/kennel` | provision, update |
| `KENNEL_DATA_ROOT` | `/srv/kennel` | provision, deprovision, backup |
| `KENNEL_ENV_DIR` | `/etc/kennel` | provision, deprovision |
| `KENNEL_CADDY_TENANT_DIR` | `/etc/caddy/tenants` | provision, deprovision |
| `KENNEL_SERVICE_USER` | `kennel` | provision, update |
| `KENNEL_ARCHIVE_DIR` | `/srv/kennel-archive` | deprovision `--purge` |
| `KENNEL_BACKUP_DIR` | `/srv/kennel-backups` | backup (when not using restic) |

Each instance ≈ 170 MB RAM (~20 fit a CX22 / 4 GB). SQLite WAL is per file, so
no cross-user contention. Env files are `chmod 600`; tokens never enter shell
history or the repo.

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| `health: NOT RESPONDING` after provision | `journalctl -u kennel@<sub> -n 40` — usually a bad path in the env file or a port already in use |
| `https://<sub>` won't get a cert | DNS must resolve to the box; for the **wildcard** confirm the `caddy-dns` plugin is installed and the API token is set; `journalctl -u caddy` |
| New instance grabbed port 8421 and clashed | a legacy single instance is on 8421 with no env file — see §4 (`KENNEL_PORT_BASE`) or migrate it (§3) |
| Route not served | `caddy validate --config /etc/caddy/Caddyfile`; ensure `import /etc/caddy/tenants/*.caddy` is present; `systemctl reload caddy` |
| MCP client can't reach a user | it must use that user's subdomain `/mcp` + that user's token (each is independent) |
