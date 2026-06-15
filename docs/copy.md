# Editing Steep's UI copy

All skin-keyed UI strings live in one editable resource — **`src/lib/copy.json`**
— one entry per dotted key with a `workshop` and a `life` value. Components read
them with `copy('key')` (`src/lib/copy.ts`), which resolves against the active
skin at call time. There are two ways to change copy:

## A. Build-time (the bundled defaults)

Edit `src/lib/copy.json` directly, or round-trip it through a file:

```sh
node scripts/copy.mjs export edits.json   # dump all keys to an editable file
#   …edit edits.json…
node scripts/copy.mjs apply  edits.json   # validate + write back into copy.json
npm run build                             # rebuild to take effect
```

- `apply` **blocks** on real errors (a missing/non-string `workshop`/`life`) and
  **warns** on placeholder drift (e.g. `{n}` in one skin but not the other —
  which is sometimes intentional).
- `node scripts/copy.mjs check` validates the resource; `keys` lists every key.
- Shape: `{ "nav.dashboard": { "workshop": "Dashboard", "life": "Harbour" }, … }`.
- Interpolation: `{n}`, `{kept}`, etc. are filled at call time
  (`copy('compass.ahead', { n: 682 })`).

## B. Runtime (per-instance override — no rebuild)

Each instance can carry a `copy.json` that **overrides the bundled defaults
per-field**. It's read on the server and shipped in `/api/bootstrap`, so editing
the file and reloading the page re-applies copy with no rebuild — and each
multi-tenant instance can have its own voice.

```sh
# default location is <content dir>/copy.json; override with KENNEL_COPY_FILE.
# seed it with the current full set, then trim to just what you want to change:
node scripts/copy.mjs export /srv/kennel/<sub>/content/copy.json
#   …edit it — keep only the keys/skins you're overriding, e.g.:
#   { "nav.dashboard": { "life": "Home Port" } }
# then just reload the page.
```

- Overrides merge **per-field**: an entry may set one key, or one skin of one
  key; everything else falls through to the bundled defaults.
- Malformed or missing file → no overrides (safe; never breaks boot).
- Unknown keys are ignored; a key with no matching default simply isn't shown.

## How it fits together

```
src/lib/copy.json   ─ bundled defaults (in the build)
        ⊕
<instance>/copy.json ─ optional per-instance overrides (KENNEL_COPY_FILE)
        ↓  /api/bootstrap → hydrate → setCopyOverrides()
   copy('key')  ─ defaults ⊕ overrides, resolved for the active skin
```

> **Scope today:** `copy.json` holds the strings that have been migrated onto
> the `copy()` key system (the skin-divergent voice + the surfaces done so far).
> Most other UI text is still inline in components; migrate a screen's strings
> into `copy.json` keys to bring them under this same edit/override workflow.
