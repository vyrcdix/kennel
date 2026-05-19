# Registering the Steep MCP server with Claude

> Internal codename: `kennel`. The repo, env vars (`KENNEL_MCP_TOKEN`),
> and DB file (`kennel.db`) all keep that name. **Steep** is the brand
> the user sees: the in-app wordmark, the public URL
> (`steep.work`), and the language in this doc.

Steep exposes a Model Context Protocol server at
`http://127.0.0.1:8421/mcp` over the **Streamable HTTP** transport. Any
Claude client that speaks MCP can connect: Claude Desktop, Claude Code,
Claude Mobile.

The MCP server runs inside the same process as the HTTP API — start
the server once with `npm --prefix server run dev` (or `npm start` in
production) and both surfaces are available.

## Tools exposed (v0.3 — 37 tools)

**Projects** — `list_projects`, `get_project`, `create_project`,
`update_project`, `close_out_project`.

**Items / sort** — `create_item`, `transition_item`, `touch_item`,
`crystallize_item`, `file_item`, `convert_item`, `list_queue`,
`list_next_up`, `list_aging`, `list_crystallizations`.
`transition_item` accepts old state names (`parked`, `done`,
`archived`) as soft aliases for backward compatibility; output uses
the v0.3 vocabulary (`reflecting`, `crystallized`, `filed`).
`convert_item` flips an item's kind in place (idea/note/action/ref/
question) or promotes it to a new doc/reference and dismisses the
source.

**Docs** — `read_doc`, `write_doc`.

**Runbooks** — `get_runbook`, `upsert_runbook`.

**Field notes** — `read_field_notes`, `write_field_notes`.

**Chats** — `list_chats`, `register_chat`, `update_chat_tagline`.

**Skills** — `list_skills`, `get_skill`, `sync_skill`,
`propose_skill_update`.

**References / tags / comments** — `create_reference`, `list_tags`,
`apply_tag`, `remove_tag`, `add_comment`.

**Settings** — `get_settings`, `update_settings`.

**Activity / search** — `recent_activity`, `search`.

## Claude Desktop config

Add this to `claude_desktop_config.json` (location varies by OS — see
the Claude Desktop docs):

```json
{
  "mcpServers": {
    "kennel": {
      "url": "http://127.0.0.1:8421/mcp"
    }
  }
}
```

Restart Claude Desktop. In a chat, type **"what projects are in
kennel?"** — Claude should invoke `list_projects` and read back the
list.

## Claude Code config

In your project's `.claude/settings.json` (or the global
`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "kennel": {
      "url": "http://127.0.0.1:8421/mcp"
    }
  }
}
```

Or via the CLI:

```bash
claude mcp add kennel --url http://127.0.0.1:8421/mcp
```

## Production / remote use

When deploying Kennel to a VPS behind Tailscale (per §2.3 of the
data model), enable bearer-token auth:

```bash
export KENNEL_MCP_TOKEN=knl_sk_<long-random-string>
npm --prefix server start
```

Clients then pass the token in their config:

```json
{
  "mcpServers": {
    "kennel": {
      "url": "https://steep.work/mcp",
      "headers": {
        "Authorization": "Bearer knl_sk_<long-random-string>"
      }
    }
  }
}
```

If `KENNEL_MCP_TOKEN` is unset (the dev default), no auth is required.
This is fine for `127.0.0.1` only; never expose the unauthed port to
a public interface.

## Sanity-checking the connection

The tiny smoke test that doesn't need a Claude client:

```bash
# 1. Initialize a session and capture the session id
INIT=$(curl -s -i -X POST http://127.0.0.1:8421/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2024-11-05",
        "capabilities":{},
        "clientInfo":{"name":"smoke","version":"0"}}}')
SID=$(echo "$INIT" | grep -i 'mcp-session-id:' | awk '{print $2}' | tr -d '\r\n')

# 2. Acknowledge initialization (required by spec)
curl -s -X POST http://127.0.0.1:8421/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# 3. List tools — should return all 37
curl -s -X POST http://127.0.0.1:8421/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 4. Call one
curl -s -X POST http://127.0.0.1:8421/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{
        "name":"list_projects","arguments":{}}}'
```

## What's deferred

- **MCP resources / prompts.** Tools cover the read/write surface;
  resources/prompts can come later — e.g. exposing the markdown
  content directory as a browsable resource tree.
- **MCP stdio transport.** All target clients support HTTP; a stdio
  wrapper is a half-day if a future client needs it.
