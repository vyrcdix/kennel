# ops/ — multi-user provisioning kit (Option A)

One Steep process per user, one per subdomain — each with its own database,
content dir, password, MCP token, and port, all behind one Caddy front door.
Design + rationale: **`docs/multi-tenant.md`**. Single-user deploy:
**`docs/deploy.md`**.

| File | What it is |
|---|---|
| `kennel@.service` | systemd **template** unit — one instance per subdomain (`%i`) |
| `Caddyfile.example` | main Caddyfile — wildcard cert + `import` of per-user routes |
| `tenant.caddy.tmpl` | per-user route template (`__SUB__` / `__DOMAIN__` / `__PORT__`) |
| `provision.sh` | create a user (db, content, creds, port, unit, route) |
| `deprovision.sh` | remove a user (data retained unless `--purge`) |
| `update.sh` | pull + build the shared code once, restart the whole fleet |
| `backup.sh` | per-user SQLite-safe snapshots (local tarballs or restic) |

## One-time host setup

Assumes the single-user deploy from `docs/deploy.md` is done (a `kennel` user,
Node, Caddy, the repo at `/opt/kennel`, built `dist/`).

```sh
# 1. systemd template
sudo cp /opt/kennel/ops/kennel@.service /etc/systemd/system/
sudo systemctl daemon-reload

# 2. Caddy: wildcard cert + per-user route import
sudo cp /opt/kennel/ops/Caddyfile.example /etc/caddy/Caddyfile
sudo mkdir -p /etc/caddy/tenants
#   → edit /etc/caddy/Caddyfile: set your domain + DNS provider for the wildcard
#     cert (needs a caddy-dns plugin build + API token), then:
sudo systemctl reload caddy

# 3. DNS: one wildcard A record, set once
#     *.steep.work  A  <vps-ip>
```

Defaults (override via env on any script): `KENNEL_DOMAIN=steep.work`,
`KENNEL_PORT_BASE=8421`, `KENNEL_CODE_DIR=/opt/kennel`,
`KENNEL_DATA_ROOT=/srv/kennel`, `KENNEL_ENV_DIR=/etc/kennel`,
`KENNEL_CADDY_TENANT_DIR=/etc/caddy/tenants`, `KENNEL_SERVICE_USER=kennel`.
If you change paths, keep `kennel@.service` in sync.

## Usage

```sh
sudo /opt/kennel/ops/provision.sh alice      # → https://alice.steep.work (+ creds)
sudo /opt/kennel/ops/deprovision.sh alice    # stop + unroute; data retained
sudo /opt/kennel/ops/deprovision.sh alice --purge   # …and archive + delete data
sudo /opt/kennel/ops/update.sh               # update + restart every instance
sudo /opt/kennel/ops/backup.sh               # snapshot every instance
```

`provision.sh` prints the URL, password, and MCP token, picks the next free
port, and health-checks the new instance. The password is changeable from
Settings → Account after first login (the env value is inert thereafter).

## Notes

- **Migrating the existing single instance** into this scheme (as e.g.
  `craig.steep.work`) — see the step list in `docs/multi-tenant.md`.
- Each instance is ~170 MB RAM; ~20 fit a CX22 (4 GB). SQLite WAL is per-file,
  so no cross-user contention.
- Env files are `chmod 600`; tokens never enter shell history or the repo.
- These scripts need root + systemd + Caddy; run them **on the box**, not in CI.
