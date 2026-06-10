// Shared persona content — pulled straight from persona-life-guide.md so both
// direction boards render the same real life: the Thursday bench, the marathon
// runbook, the Kyoto trip, the novel.

// Crystals due to resurface ("Worth revisiting" / the hearth)
const RESURFACING = [
  { type: 'reminder',  text: 'Book flights on the 11-week mark, not the 2-week panic.', thread: 'japan-2027', tint: 'dusk', kept: 4, due: 'due today' },
  { type: 'principle', text: "I don't get injured from running too much — I get injured from increasing too fast.", thread: 'marathon-2027', tint: 'sage', kept: 6, due: 'due 2 days ago' },
  { type: 'hint',      text: 'Drafting goes better at the library — no kitchen to clean.', thread: 'novel', tint: 'plum', kept: 2, due: 'due today' },
];

// Crystals that landed this week
const THIS_WEEK = [
  { type: 'principle', text: 'The knee thing was a shoe problem, not a mileage problem.', thread: 'marathon-2027', tint: 'sage' },
  { type: 'quote',     text: 'The end justifies the means only if the end is real.', attrib: 'Le Guin', thread: 'reading', tint: 'stone' },
];

// In focus — a flat set of active items, each carrying BOTH frames:
// what it serves (meaning) and its horizon (urgency). The UI groups by
// whichever lens the person chooses; neither order is imposed.
//   horizon: 'this-week' | 'soon' | 'no-rush'
const FOCUS = [
  { kind: 'action', text: 'Renew passport BEFORE booking the ryokan',      thread: 'japan-2027',    tint: 'dusk',  serves: 'Kyoto, two weeks in April',   servesType: 'idea',      horizon: 'this-week', when: 'this week · blocks booking', blocks: true },
  { kind: 'action', text: 'Lock in the 18-week base plan',                 thread: 'marathon-2027', tint: 'sage',  serves: 'Run Chicago 2027 under 4:00', servesType: 'principle', horizon: 'this-week', when: 'this week' },
  { kind: 'action', text: 'Book Kyoto flights — it’s 12 weeks out',        thread: 'japan-2027',    tint: 'dusk',  serves: 'Kyoto, two weeks in April',   servesType: 'idea',      horizon: 'soon',      when: 'within ~2 weeks' },
  { kind: 'action', text: 'Replace the worn pair before the long runs ramp', thread: 'marathon-2027', tint: 'sage', serves: 'Run Chicago 2027 under 4:00', servesType: 'principle', horizon: 'soon',      when: 'before mileage ramps' },
  { kind: 'action', text: 'Call about the dishwasher noise',               thread: 'household',     tint: 'slate', serves: null,                          servesType: null,        horizon: 'no-rush',   when: 'whenever' },
];

// horizon band metadata for the "by when" lens — kind, never alarm: no reds.
const HORIZONS = [
  { id: 'this-week', label: 'This week',         sub: 'time-sensitive',  tone: 'var(--action)' },
  { id: 'soon',      label: 'Soon',              sub: 'has a clock on it', tone: 'var(--fam-guide)' },
  { id: 'no-rush',   label: 'When it comes around', sub: 'no clock',      tone: 'var(--ink-faint)' },
];

// helper: group FOCUS by a key, preserving array order of first appearance
function groupFocus(by) {
  const out = [];
  FOCUS.forEach((it) => {
    const key = by === 'serves' ? (it.serves || '__loose') : it.horizon;
    let g = out.find((x) => x.key === key);
    if (!g) { g = { key, items: [] }; out.push(g); }
    g.items.push(it);
  });
  return out;
}

// Pinned, alive threads
const THREADS = [
  { slug: 'marathon-2027', name: 'Marathon 2027', tint: 'sage', icon: 'run',   temp: 'fresh',  focus: 3, reflect: 2, last: 'Tue — the knee held, 2nd good run' },
  { slug: 'japan-2027',    name: 'Japan trip',    tint: 'dusk', icon: 'plane', temp: 'fresh',  focus: 2, reflect: 4, last: 'pasted the Kyoto email from Sam' },
  { slug: 'reading',       name: 'Reading',       tint: 'stone',icon: 'book',  temp: 'active', focus: 0, reflect: 3, last: 'finished The Dispossessed' },
  { slug: 'novel',         name: 'The novel',     tint: 'plum', icon: 'spark', temp: 'aging',  focus: 0, reflect: 6, last: 'ch. 3 doc — 18 days quiet' },
];

// The Reflecting shelf — longest-shelved first, no dates, no nag
const REFLECTING = [
  { kind: 'idea',     text: 'Audiobooks for long runs — does fiction work above 90 minutes?', thread: 'marathon-2027', tint: 'sage',  shelved: 'set aside 6 weeks ago' },
  { kind: 'idea',     text: 'A supper club for the building — once a season, potluck.',        thread: 'household',     tint: 'slate', shelved: 'set aside 5 weeks ago' },
  { kind: 'question', text: 'Is my left-knee thing a shoe problem or a mileage problem?',      thread: 'marathon-2027', tint: 'sage',  shelved: 'watching · 2 more runs', resolved: true },
  { kind: 'idea',     text: 'Novel: what if chapter 3 is from the sister’s POV?',              thread: 'novel',         tint: 'plum',  shelved: 'set aside 3 weeks ago' },
  { kind: 'ref',      text: 'The tiny tempura counter — book exactly 30 days out.',            thread: 'japan-2027',    tint: 'dusk',  shelved: 'set aside 2 weeks ago', tag: 'where-to-eat' },
  { kind: 'idea',     text: 'The seed-saving book — Mara mentioned wanting it.',               thread: 'reading',       tint: 'stone', shelved: 'set aside 12 days ago', tag: 'gift-ideas' },
  { kind: 'note',     text: 'Le Guin essays next, once the novel mood comes back around.',     thread: 'reading',       tint: 'stone', shelved: 'set aside 9 days ago' },
];

// Recent Smart-Routing / chat activity
const RECENT = [
  { who: 'Claude', text: 'Routed Sam’s Kyoto email → 3 refs in Japan trip', when: '2h' },
  { who: 'you',    text: 'Pasted the marathon pacing forum thread → Run section', when: 'Tue' },
];

// thread label hues — neutral-quiet, never compete with sacred or action
const TINT = { stone: '#8C8275', sage: '#79876F', dusk: '#6C7A8C', plum: '#87697C', slate: '#5A6066', teal: '#5E807A' };

// crystal type label
const CTYPE = { principle: 'principle', quote: 'quote', reminder: 'reminder', hint: 'hint', memory: 'memory' };

// theme-aware thread hue — resolves to the right value in day or night
const tintVar = (k) => `var(--tint-${k})`;

// ── The bench (Sort / Triage queue) — raw captures, newest at top ──────
const BENCH = [
  { id: 'b1', kind: 'idea',     text: 'Negative splits for the half — bank nothing early.', meta: 'captured 9m ago · voice', body: 'Came to me on the cooldown walk. The Tuesday run felt easy because I went out slow. Worth making it a rule.', suggest: { thread: 'marathon-2027', tint: 'sage', kind: 'principle' } },
  { id: 'b2', kind: 'ref',      text: 'kyoto-ryokan-list.pdf — Sam’s recommendations', meta: 'captured 2h ago · paste', body: 'Three ryokan near Higashiyama, one with the tempura counter. Sam booked the middle one in 2024 and loved it.', suggest: { thread: 'japan-2027', tint: 'dusk', kind: 'ref' } },
  { id: 'b3', kind: 'action',   text: 'Email coach about the calf tightness', meta: 'captured this morning', body: '', suggest: { thread: 'marathon-2027', tint: 'sage', kind: 'action' } },
  { id: 'b4', kind: 'question', text: 'Does the novel need the framing device at all?', meta: 'captured yesterday', body: 'Re-reading ch.1 — the present-day frame might be slowing the entry. Park it and watch.', suggest: { thread: 'novel', tint: 'plum', kind: 'question' } },
  { id: 'b5', kind: 'note',     text: 'Mara’s birthday is the 14th — seed-saving book', meta: 'captured yesterday', body: '', suggest: { thread: 'reading', tint: 'stone', kind: 'note' } },
  { id: 'b6', kind: 'idea',     text: 'Long-run fuel: try the rice cakes instead of gels', meta: 'captured 2 days ago', body: '', suggest: { thread: 'marathon-2027', tint: 'sage', kind: 'idea' } },
  { id: 'b7', kind: 'note',     text: 'Dishwasher: it’s the spray arm, not the pump (looked it up)', meta: 'captured 2 days ago', body: '', suggest: { thread: 'household', tint: 'slate', kind: 'note' } },
  { id: 'b8', kind: 'idea',     text: 'A standing Sunday call with Dad', meta: 'captured 3 days ago', body: 'Keep meaning to. Same time each week so neither of us has to decide.', suggest: { thread: null, tint: null, kind: 'idea' } },
];

// ── Project landing (marathon-2027) ────────────────────────────────────
const PROJECT = {
  slug: 'marathon-2027', name: 'Marathon 2027', tint: 'sage', icon: 'run', temp: 'fresh',
  blurb: 'Chicago, October. Sub-4:00. Build the base without breaking.',
  stats: { focus: 3, reflect: 2, crystals: 4, docs: 3 },
  focus: [
    { kind: 'action', text: 'Lock in the 18-week base plan', when: 'this week', serves: 'Run Chicago 2027 under 4:00' },
    { kind: 'action', text: 'Replace the worn pair before the long runs ramp', when: 'soon', serves: 'Run Chicago 2027 under 4:00' },
    { kind: 'idea',   text: 'Try rice cakes instead of gels on long runs', when: null, serves: null },
  ],
  crystals: [
    { type: 'principle', text: "I don't get injured from running too much — I get injured from increasing too fast.", kept: 6 },
    { type: 'principle', text: 'The knee thing was a shoe problem, not a mileage problem.', kept: 1 },
    { type: 'hint',      text: 'Easy days truly easy — that’s where the base is built.', kept: 3 },
    { type: 'reminder',  text: 'Deload every fourth week, no heroics.', kept: 2 },
  ],
  docs: [
    { kind: 'runbook',   name: 'Race-week runbook', meta: '6 sections · rev 4' },
    { kind: 'guidebook', name: 'Base-building plan', meta: '18 entries · ordered' },
    { kind: 'doc',       name: 'Pacing notes', meta: 'edited Tue 7:02' },
  ],
  sorted: [
    { kind: 'principle', text: 'The knee thing was a shoe problem', when: 'Tue' },
    { kind: 'ref',       text: 'Pacing forum thread', when: 'Tue' },
    { kind: 'action',    text: 'Book the gait analysis', when: 'Mon' },
  ],
  chats: [
    { who: 'Claude', text: 'Summarised the pacing thread into 3 takeaways', when: 'Tue' },
    { who: 'you',    text: 'Asked how to structure a deload week', when: 'Mon' },
  ],
};

// ── Crystal detail (the load-bearing principle) ────────────────────────
const CRYSTAL = {
  type: 'principle',
  text: "I don't get injured from running too much — I get injured from increasing too fast.",
  thread: 'marathon-2027', tint: 'sage',
  kept: 6, born: 'crystallized 14 weeks ago', lastTrue: 'confirmed still true 3 days ago',
  note: 'Two injuries, same cause: a sudden jump in weekly mileage after a good week. The good week is the trap, not the reward.',
  builtOn: [
    { kind: 'question', text: 'Why does every training block end with a niggle?', when: '14 wks ago' },
    { kind: 'note',     text: 'Both injuries followed a week I’d felt great and added miles', when: '14 wks ago' },
    { kind: 'ref',      text: 'The 10% rule — and why it’s a ceiling, not a target', when: '13 wks ago' },
  ],
  serves: [
    { text: 'Run Chicago 2027 under 4:00' },
  ],
};

// ── Weekly review ──────────────────────────────────────────────────────
const REVIEW = {
  range: 'Mon 2 – Sun 8 June',
  summary: { captured: 31, kept: 2, letGo: 8, sorted: 19, stillBench: 8 },
  crystallized: [
    { type: 'principle', text: 'The knee thing was a shoe problem, not a mileage problem.', thread: 'marathon-2027', tint: 'sage' },
    { type: 'quote',     text: 'The end justifies the means only if the end is real.', attrib: 'Le Guin', thread: 'reading', tint: 'stone' },
  ],
  activity: [
    { verb: 'Sorted', n: 19, detail: 'mostly Tuesday morning, in one sitting' },
    { verb: 'Let go', n: 8,  detail: 'and nothing’s come back to bite you' },
    { verb: 'Picked back up', n: 2, detail: 'the supper-club idea, the Le Guin essays' },
    { verb: 'Filed', n: 5,  detail: 'references into Japan trip' },
  ],
  stillAging: [
    { kind: 'idea', text: 'A supper club for the building', thread: 'household', tint: 'slate', aged: '5 weeks' },
    { kind: 'idea', text: 'Novel: chapter 3 from the sister’s POV', thread: 'novel', tint: 'plum', aged: '3 weeks' },
  ],
};

// ── Global search (one query, grouped results) ─────────────────────────
const SEARCH = {
  q: 'knee',
  groups: [
    { label: 'Crystals', n: 1, rows: [{ kind: 'principle', text: 'The knee thing was a shoe problem, not a mileage problem.', thread: 'marathon-2027', tint: 'sage' }] },
    { label: 'On the shelf', n: 1, rows: [{ kind: 'question', text: 'Is my left-knee thing a shoe problem or a mileage problem?', thread: 'marathon-2027', tint: 'sage' }] },
    { label: 'In docs', n: 1, rows: [{ kind: 'doc', text: '…the knee held through the second long run; shoes felt right…', thread: 'marathon-2027', tint: 'sage' }] },
  ],
};

Object.assign(window, { RESURFACING, THIS_WEEK, FOCUS, HORIZONS, groupFocus, THREADS, REFLECTING, RECENT, TINT, CTYPE, tintVar, BENCH, PROJECT, CRYSTAL, REVIEW, SEARCH });

// ── Doc editor (markdown source / preview / rail) ──────────────────────
const DOC = {
  title: 'Pacing notes', thread: 'marathon-2027', tint: 'sage', rev: 7, saved: '7:02',
  md: `# Pacing notes\n\nThe Tuesday run proved it: **go out slow**. Felt easy the whole way\nbecause I banked nothing early.\n\n## The plan\n\n- First 5k at *conversation pace* — if I can't talk, I'm too fast\n- Middle settles into goal pace on its own\n- Negative split the back half\n\n> The good week is the trap, not the reward.\n\nSee also the base-building plan for the weekly ramp.`,
  tags: ['pacing', 'long-runs'],
  connections: [
    { kind: 'principle', text: "Injured from increasing too fast, not running too much" },
    { kind: 'idea', text: 'Negative splits for the half — bank nothing early' },
  ],
  comments: [
    { who: 'Claude', text: 'Want me to turn “conversation pace” into a heart-rate range from your last runs?', when: 'Tue' },
  ],
};

// ── Trace (timeline) ───────────────────────────────────────────────────
const TRACE = [
  { day: 'Tuesday', entries: [
    { type: 'crystal', text: 'The knee thing was a shoe problem, not a mileage problem.', tag: 'principle' },
    { type: 'chat', who: 'Claude', text: 'Summarised the pacing forum thread into 3 takeaways.' },
    { type: 'capture', text: 'Negative splits for the half — bank nothing early.' },
  ]},
  { day: 'Monday', entries: [
    { type: 'sorted', text: 'Pacing forum thread → filed as reference' },
    { type: 'discard', text: 'Buy the carbon-plate shoes now' },
    { type: 'capture', text: 'Email coach about the calf tightness' },
  ]},
  { day: 'Last week', entries: [
    { type: 'crystal', text: 'Easy days truly easy — that’s where the base is built.', tag: 'hint' },
    { type: 'discard', text: 'Add a sixth running day' },
    { type: 'chat', who: 'you', text: 'Asked how to structure a deload week.' },
  ]},
];

// ── Field notes (five sections, scratchpad vs managed) ─────────────────
const FIELDNOTES = {
  thread: 'marathon-2027', tint: 'sage',
  sections: [
    { name: 'What’s working', managed: true,  body: 'Slow easy days. The new shoes. Tuesday/Thursday/Saturday rhythm — leaves Sunday for the long run without guilt.' },
    { name: 'Open questions', managed: true,  body: 'Fuel above 90 minutes — gels or rice cakes? Does the calf thing need a physio or just easier easy days?' },
    { name: 'People',          managed: false, body: 'Coach Dana — replies fastest by text. Sam ran Chicago in ’24, good for course intel.' },
    { name: 'Resources',       managed: false, body: 'The pacing forum thread (filed). Dana’s base-building template. Gait analysis place on 5th.' },
    { name: 'Scratch',         managed: false, body: 'maybe a B-goal of 4:05 so a bad day doesn’t feel like failure?' },
  ],
};

// ── Runbook (six fixed sections, labeled URLs, revision) ───────────────
const RUNBOOK = {
  title: 'Race-week runbook', thread: 'marathon-2027', tint: 'sage', rev: 4, updated: 'updated 6 days ago',
  sections: [
    { name: 'The week before', body: 'Drop mileage 40%. Sleep is the real taper. Lay everything out Thursday.' },
    { name: 'Gear', body: 'The broken-in pair (not the new ones). Anti-chafe everywhere. Throwaway layer for the corral.', links: [{ label: 'Packing checklist', url: 'docs/packing' }] },
    { name: 'Fuel', body: 'Gel every 45 min from 0:45. Two extra. Nothing new on race day.', links: [{ label: 'Fuel timing sheet', url: 'docs/fuel' }] },
    { name: 'Pacing', body: 'First 5k at conversation pace. Trust the negative split.', links: [{ label: 'Pacing notes', url: 'doc/pacing' }] },
    { name: 'Mantras', body: '“The good week is the trap.” “Smooth is fast.” “You did the work.”' },
    { name: 'Contacts', body: 'Dana (coach). Sam at mile 18. Hotel front desk for late checkout.' },
  ],
};

// ── Guidebook (ordered entry spine) ────────────────────────────────────
const GUIDEBOOK = {
  title: 'Base-building plan', thread: 'marathon-2027', tint: 'sage',
  entries: [
    { n: 1, text: 'Weeks 1–4: establish the rhythm. Easy miles only, no workouts.', tags: ['base'] },
    { n: 2, text: 'Cap weekly increase at 10%. The 10% is a ceiling, not a target.', tags: ['base', 'injury'] },
    { n: 3, text: 'Every 4th week is a deload — 30% down, no heroics.', tags: ['recovery'] },
    { n: 4, text: 'Add one workout/week only after week 5, once easy pace feels easy.', tags: ['workouts'] },
    { n: 5, text: 'Long run grows last, and never more than 2 miles at a time.', tags: ['long-runs'] },
  ],
};

Object.assign(window, { DOC, TRACE, FIELDNOTES, RUNBOOK, GUIDEBOOK });
