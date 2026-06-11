# Deploying the Tidewater test instance

A **parallel** instance of Steep running the `skin-life-tidewater` branch,
alongside prod on the same Hetzner box, behind its own subdomain, with its own
server port, its own SQLite file, and **fresh test data from scratch** (the
demo seed) — so the Life skin can be dogfooded without touching prod.

This mirrors prod's public model (`docs/deploy.md` Path B): **Caddy serves the
built SPA from `dist/` and reverse-proxies `/api` + `/mcp` to the Node
server.** Only the ports, paths, hostname, and DB differ.

```
   tide.steep.work ──► Caddy ──┬─ /api/*, /mcp ─► 127.0.0.1:8422 (kennel-tide.service)
                               └─ everything else ─► file_server /opt/kennel-tide/dist
   steep.work      ──► Caddy ──┬─ /api/*, /mcp ─► 127.0.0.1:8421 (kennel.service, prod)
                               └─ everything else ─► file_server /opt/kennel/dist
```

| | prod | tidewater test |
|---|---|---|
| checkout | `/opt/kennel` (main) | `/opt/kennel-tide` (`skin-life-tidewater`) |
| server port | 8421 | **8422** |
| SQLite | `/opt/kennel/server/kennel.db` | `/opt/kennel-tide/server/tide.db` |
| hostname | `steep.work` | `tide.steep.work` |
| data | real | **fresh demo seed** |

---

## 1. Second checkout + build

```sh
# as the kennel service user
git clone <repo> /opt/kennel-tide
cd /opt/kennel-tide
git checkout skin-life-tidewater
npm ci
npm --prefix server ci
npm run build            # → /opt/kennel-tide/dist  (the built SPA)
```

Re-deploying later is `git pull && npm ci && npm run build && systemctl restart
kennel-tide`.

## 2. systemd unit — the test server on 8422

`/etc/systemd/system/kennel-tide.service`:

```ini
[Unit]
Description=Kennel server — Tidewater test instance
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=kennel
WorkingDirectory=/opt/kennel-tide
Environment=NODE_ENV=production
Environment=PORT=8422
Environment=HOST=127.0.0.1
Environment=KENNEL_DB=/opt/kennel-tide/server/tide.db
# Fresh test data: the server seeds the demo fixtures on first boot when the DB
# is empty (runSeedIfEmpty). Do NOT set KENNEL_SKIP_SEED here — we *want* the seed.
# Optional shared password for the test UI (≥ 8 chars); omit to leave it open
# on the tailnet, set it if tide.steep.work is publicly reachable.
# Environment=KENNEL_INITIAL_PASSWORD=PASTE_PASSWORD_HERE
# Separate MCP token from prod if you expose /mcp on the test box.
# Environment=KENNEL_MCP_TOKEN=PASTE_A_DIFFERENT_TOKEN
ExecStart=/usr/bin/npm --prefix server start
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```sh
systemctl daemon-reload
systemctl enable --now kennel-tide
journalctl -u kennel-tide -f      # expect "[seed] empty DB → seeding…" then "listening on …:8422"
```

## 3. Caddy route for the subdomain

Add a block to `/etc/caddy/Caddyfile` (public Path-B style — file_server over
`dist/`, backend paths proxied; `flush_interval -1` keeps the `/api/events` SSE
stream unbuffered):

```
tide.steep.work {
    encode zstd gzip
    root * /opt/kennel-tide/dist

    @backend path /api/* /mcp /mcp/*
    handle @backend {
        reverse_proxy 127.0.0.1:8422 {
            flush_interval -1
        }
    }
    handle {
        try_files {path} /index.html   # SPA fallback for client routes
        file_server
    }
}
```

```sh
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

(On the private tailnet model, instead give the block a `*.ts.net` hostname +
`tls { get_certificate tailscale }` + `bind tailscale/<host>`, exactly like
prod's Path A — but keep the `file_server`/`@backend` split above, since the
Node server does not serve the SPA itself.)

## 4. Fresh test data + reset

First boot seeds the demo fixtures automatically (empty DB → `runSeedIfEmpty`).
To wipe and re-seed:

```sh
systemctl stop kennel-tide
rm -f /opt/kennel-tide/server/tide.db /opt/kennel-tide/server/tide.db-wal /opt/kennel-tide/server/tide.db-shm
systemctl start kennel-tide      # re-seeds on the now-empty DB
```

---

## Local dev / dry-run of this model

Ports are env-driven (`vite.config.ts`), so the whole thing runs locally:

```sh
# 1. test server on 8422 with a throwaway DB (seeds itself)
KENNEL_DB=/tmp/tide.db PORT=8422 npm --prefix server start &

# 2a. live dev (HMR) against it:
KENNEL_API_PORT=8422 KENNEL_DEV_PORT=5180 npx vite

# 2b. OR exercise the *prod* model — built client served + /api proxied —
#     which is what Caddy does on the box:
npm run build
KENNEL_API_PORT=8422 KENNEL_PREVIEW_PORT=4180 npx vite preview
```

`vite preview` is the local stand-in for Caddy: it serves `dist/` and proxies
`/api` + `/mcp` to `127.0.0.1:8422`. This is the dry-run run before merge — see
`docs/tidewater-qa.md` for the QA gate.
