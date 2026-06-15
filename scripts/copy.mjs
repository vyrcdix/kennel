#!/usr/bin/env node
// Round-trip the UI copy resource (src/lib/copy.json).
//
//   node scripts/copy.mjs export [outfile]   dump the strings to an editable
//                                            file (default: copy.export.json)
//   node scripts/copy.mjs apply  <infile>    validate + write edits back into
//                                            src/lib/copy.json (then rebuild)
//   node scripts/copy.mjs keys               list every key
//   node scripts/copy.mjs check              validate src/lib/copy.json
//
// The same JSON shape is what an instance's runtime override file uses
// (KENNEL_COPY_FILE), so `export` also seeds a runtime override. See docs/copy.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RESOURCE = resolve(ROOT, 'src/lib/copy.json');

const die = (msg) => { console.error(`error: ${msg}`); process.exit(1); };

const load = (path) => {
  let raw;
  try { raw = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { die(`cannot parse ${path}: ${e.message}`); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) die(`${path} must be a JSON object`);
  return raw;
};

// Validate shape: { key: { workshop: string, life: string } }.
// errors block `apply` (they'd break the app); warnings are advisory — e.g.
// placeholder drift, which is sometimes intentional (a skin that omits a count).
const validate = (obj) => {
  const errors = [];
  const warnings = [];
  for (const [k, v] of Object.entries(obj)) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) { errors.push(`${k}: not an object`); continue; }
    for (const skin of ['workshop', 'life']) {
      if (typeof v[skin] !== 'string') errors.push(`${k}: missing or non-string "${skin}"`);
    }
    const ph = (s) => [...String(s ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    if (typeof v.workshop === 'string' && typeof v.life === 'string' && ph(v.workshop) !== ph(v.life)) {
      warnings.push(`${k}: placeholder drift (workshop "{${ph(v.workshop)}}" vs life "{${ph(v.life)}}")`);
    }
  }
  return { errors, warnings };
};

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'export') {
  const out = arg ?? resolve(process.cwd(), 'copy.export.json');
  const obj = load(RESOURCE);
  writeFileSync(out, JSON.stringify(obj, null, 2) + '\n');
  console.log(`exported ${Object.keys(obj).length} keys → ${out}`);
} else if (cmd === 'apply') {
  if (!arg) die('usage: copy.mjs apply <infile>');
  const obj = load(arg);
  const { errors, warnings } = validate(obj);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  if (errors.length) {
    console.error(`refusing to apply — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }
  writeFileSync(RESOURCE, JSON.stringify(obj, null, 2) + '\n');
  console.log(`applied ${Object.keys(obj).length} keys → src/lib/copy.json (rebuild to take effect)`);
} else if (cmd === 'keys') {
  for (const k of Object.keys(load(RESOURCE))) console.log(k);
} else if (cmd === 'check') {
  const { errors, warnings } = validate(load(RESOURCE));
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  if (errors.length) { errors.forEach((e) => console.error(`  • ${e}`)); process.exit(1); }
  console.log(`ok — ${Object.keys(load(RESOURCE)).length} keys, ${warnings.length} warning(s)`);
} else {
  console.error('usage: copy.mjs {export [outfile] | apply <infile> | keys | check}');
  process.exit(1);
}
