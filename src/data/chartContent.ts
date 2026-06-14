// The Chart — content & copy for Steep's master guide. Verbatim from the
// design handoff (design_handoff_chart/chart-content.jsx); copy is final.
// Voice: warm, plain, light. Factual, never motivational.
import type { Item } from './types';

export type ChartPiece = {
  icon: string;
  name: string;
  alias?: string;
  sacred?: boolean;
  what: string;
  how: string;
};
export type ChartGroup = {
  id: string;
  title: string;
  blurb: string;
  lead?: boolean;
  pieces: ChartPiece[];
};
export type WalkCrystal = { type: string; text: string; attrib?: string };
export type WalkStep = {
  tag: string;
  icon: string;
  head: string;
  body: string;
  example?: { kind: Item['kind']; text: string; meta: string };
  legend?: { k: string; label: string }[];
  crystal?: WalkCrystal;
  crystals?: WalkCrystal[];
  quote?: string;
  foot?: string;
};
export type Principle = { icon: string; title: string; body: string };
export type TempBand = { key: string; label: string; sub: string; col: string };

// ── The pieces, grouped by what they're for ─────────────────────────────
export const PIECE_GROUPS: ChartGroup[] = [
  {
    id: 'horizon',
    title: 'The horizon',
    blurb:
      'Most of Steep is about the here and now — catching, sorting, keeping. One layer looks much further out: the few big things you’re steering toward over years, not weeks. Everything nearer in lines up behind them.',
    lead: true,
    pieces: [
      {
        icon: 'compass',
        name: 'Compass',
        alias: 'bearings',
        sacred: true,
        what: 'The few far targets you’re steering by.',
        how: 'Years out, not weeks — “still racing at sixty,” “actually finish the novel,” the kind of life you’d want to look back on. Big enough to be worth the distance; distant enough that a rough week can’t dent them. Less a to-do than a picture of who you’re becoming — and anything nearer in can find a home under one.',
      },
    ],
  },
  {
    id: 'flow',
    title: 'Catch & sort',
    blurb:
      'The daily current. Getting a thought out of your head, then deciding what it is — in two separate moods, never at once.',
    pieces: [
      {
        icon: 'plus',
        name: 'Capture',
        what: 'Get it out of your head, fast.',
        how: 'Type it or say it. No folder to pick, no decision to make. It just lands.',
      },
      {
        icon: 'tide',
        name: 'The bench',
        what: 'Where raw thoughts wait.',
        how: 'Nothing here is sorted yet. It simply holds what you caught until you’re in the mood to sort.',
      },
      {
        icon: 'layers',
        name: 'Sort',
        what: 'One sitting, one key each.',
        how: 'Walk the bench and send each thing somewhere. A whole sweep takes about a minute, and nothing is final.',
      },
    ],
  },
  {
    id: 'homes',
    title: 'Where things go',
    blurb:
      'Every sorted thing finds a home. None of them is a debt — they’re just places, at different depths.',
    pieces: [
      {
        icon: 'check',
        name: 'In focus',
        what: 'The few things you’re actually carrying now.',
        how: 'Picked up from the bench. Small and current — not a master to-do list.',
      },
      {
        icon: 'shelf',
        name: 'Reflecting',
        alias: 'shelf',
        what: 'Not now, not gone.',
        how: 'Things you chose to set aside, longest-shelved first. No dates, no nagging. Browse it when the mood comes around.',
      },
      {
        icon: 'currents',
        name: 'Currents',
        alias: 'threads',
        what: 'The living topics of your life.',
        how: 'A marathon, a trip, the novel. Everything you sort can flow into one — or stay loose.',
      },
      {
        icon: 'clock',
        name: 'Driftwood',
        alias: 'aging',
        what: 'What’s drifted cold.',
        how: 'A guilt-free monthly sweep, oldest first. Most of it can go — and letting go is the win, not the failure.',
      },
    ],
  },
  {
    id: 'keep',
    title: 'What you keep',
    blurb:
      'The point of the whole thing isn’t a cleared list. It’s the handful of things you actually learned.',
    pieces: [
      {
        icon: 'gem',
        name: 'Crystals',
        sacred: true,
        what: 'A distilled, durable conclusion.',
        how: 'A principle, quote, reminder, hint, or memory — the lesson left after the noise settles. A keepsake, not a task.',
      },
      {
        icon: 'refresh',
        name: 'Worth revisiting',
        alias: 'resurfacing',
        sacred: true,
        what: 'Your own conclusions, handed back.',
        how: 'A few crystals at a time, on a gentle cadence. Still true? Revisit it? Or retire it for good.',
      },
    ],
  },
  {
    id: 'rhythm',
    title: 'Travelling a bearing',
    blurb:
      'A bearing is only a direction until something moves you along it. A cadence is that motion — the small behaviors you repeat to make the distance.',
    pieces: [
      {
        icon: 'repeat',
        name: 'Cadences',
        what: 'Repeated behaviors that carry you toward a bearing.',
        how: 'A Sunday call, eight minutes of mobility. Each is in service of a bearing, surfaced as an invitation — “do this week” — never a due date in red.',
      },
    ],
  },
  {
    id: 'lookback',
    title: 'Looking back & making sense',
    blurb:
      'Ways to see the shape of your thinking without an audit — so coming back after a gap costs almost nothing.',
    pieces: [
      {
        icon: 'eye',
        name: 'Trace',
        what: 'Go back through your thinking.',
        how: 'A current’s whole evolution, newest first. Dead ends stay visible — they were part of the work too.',
      },
      {
        icon: 'review',
        name: 'Weekly review',
        what: 'The shape of your week.',
        how: 'Read-only, a few minutes. Recognize the pattern; don’t act on every line. Eleven let-gos is the system digesting.',
      },
      {
        icon: 'note',
        name: 'Field notes',
        what: 'A current’s running synthesis.',
        how: 'Premise, what you know, open questions, sources. Some of it Claude keeps tidy; some is yours to scribble in.',
      },
      {
        icon: 'book',
        name: 'Guidebook',
        what: 'An ordered spine.',
        how: 'A reading list, a where-to-eat list. Drag to resequence — the order is the meaning.',
      },
      {
        icon: 'doc',
        name: 'Runbook',
        what: 'The same six sections, every time.',
        how: 'For things you operate — race week, a launch. Future-you always knows exactly where to look.',
      },
    ],
  },
  {
    id: 'ambient',
    title: 'Signals & company',
    blurb:
      'One ambient signal you never have to act on, and one set of hands for the hard moments.',
    pieces: [
      {
        icon: 'temp',
        name: 'Temperature',
        what: 'How fresh something is.',
        how: 'Sunlit, active, deepening, still. Shown as light and depth — never red, never a number, never a nag.',
      },
      {
        icon: 'spark',
        name: 'Claude',
        what: 'A body double at the friction points.',
        how: 'Routes what you paste, summarizes a long thread, sits with you on the dreaded full bench. There when it’s hard, quiet when it isn’t.',
      },
    ],
  },
];

// ── Temperature bands (legend + the omitted diagram gradient) ───────────
export const TEMP_BANDS: TempBand[] = [
  { key: 'fresh', label: 'Sunlit', sub: 'touched today', col: 'var(--sacred)' },
  { key: 'active', label: 'Active', sub: 'in the current', col: 'var(--action)' },
  { key: 'aging', label: 'Deepening', sub: 'going quiet', col: 'var(--fam-run)' },
  { key: 'dormant', label: 'Still', sub: 'cold, by now', col: 'var(--ink-faint)' },
];

// ── A week with Steep — common-use walkthrough (real examples) ──────────
export const WALKTHROUGH: WalkStep[] = [
  {
    tag: 'a thought arrives',
    icon: 'plus',
    head: 'Something occurs to you on a walk.',
    body: 'You don’t open the right project or decide what kind of thing it is. You just capture it:',
    example: {
      kind: 'idea',
      text: 'Negative splits for the half — bank nothing early.',
      meta: 'captured 9m ago · voice',
    },
    foot: 'It lands on the bench. You go back to your walk.',
  },
  {
    tag: 'tuesday morning',
    icon: 'layers',
    head: 'You’re in a sorting mood, so you walk the bench.',
    body: 'Eight things waited overnight. One key each — pick up, set aside, file to a current, crystallize, or let the tide take it. The whole sweep takes under a minute, and every choice is reversible.',
    legend: [
      { k: 'A', label: 'pick up' },
      { k: 'P', label: 'set aside' },
      { k: 'C', label: 'crystallize' },
      { k: 'X', label: 'let the tide take it' },
    ],
    foot: 'Forty-five seconds later the bench is clear. You didn’t file your whole life — you just sorted what arrived.',
  },
  {
    tag: 'something clicks',
    icon: 'gem',
    head: 'A pattern finally makes sense, so you keep it.',
    body: 'After two injuries you realize the cause. You crystallize it — it stops being a task and becomes a keepsake that’ll come back to you on its own:',
    crystal: {
      type: 'principle',
      text: 'I don’t get injured from running too much — I get injured from increasing too fast.',
    },
    foot: 'Weeks later it resurfaces under “Worth revisiting.” Still true? You tap yes, and it goes back to sleep.',
  },
  {
    tag: 'you disappear',
    icon: 'tide',
    head: 'Life gets loud. You don’t open Steep for two weeks.',
    body: 'Nothing breaks. Nothing turns red. When you come back, there’s no wall of debt — just a calm harbour and one small, optional invitation.',
    quote: 'Nothing’s overdue. Sweep the bench when you’re ready.',
    foot: 'The novel’s current has gone quiet and deepened in color. That’s information, not an accusation.',
  },
  {
    tag: 'sunday',
    icon: 'review',
    head: 'You glance at the shape of your week.',
    body: 'Not a scorecard — a shape. What you captured, what you kept, what you let go. Two crystals landed this week:',
    crystals: [
      { type: 'principle', text: 'The knee thing was a shoe problem, not a mileage problem.' },
      { type: 'quote', text: 'The end justifies the means only if the end is real.', attrib: 'Le Guin' },
    ],
    foot: 'You recognize the shape and close the tab. That was the whole review.',
  },
];

// ── Why it works — the principles, for the optional pop-up ──────────────
export const PRINCIPLES: Principle[] = [
  {
    icon: 'compass',
    title: 'A few far targets, above the daily tide',
    body: 'One layer of Steep looks years out, not days: the handful of big things you’re steering toward, and the person they’d make you. They’re deliberately distant — far enough that a bad week can’t shake them, big enough to be worth the journey. Currents, cadences, and the things in focus all earn their place by pointing at one. The targets are what give the everyday sorting somewhere to aim.',
  },
  {
    icon: 'tide',
    title: 'Capturing and sorting are different moods',
    body: 'Your head is for having ideas, not holding them. So capture asks nothing of you — no folder, no kind, no priority. All the deciding happens later, on the bench, when you’re actually in a sorting mood.',
  },
  {
    icon: 'moon',
    title: 'Quiet by default',
    body: 'No red, no “overdue,” no badges counting up at you. A pile of unsorted things is not a failure, and Steep never pretends it is. Staleness is just temperature — light and depth you can read at a glance and ignore.',
  },
  {
    icon: 'undo',
    title: 'Everything is reversible',
    body: 'Let go, file, retire — all of it is recoverable from search. When nothing is permanent, no single decision is heavy, and a fast sweep stops feeling risky.',
  },
  {
    icon: 'compass',
    title: 'Come in by mood, not down a funnel',
    body: 'Some days you want to sort, some days to browse, some days just to look back. Steep makes all of those equally reachable. It never assumes you arrived “to be productive.”',
  },
  {
    icon: 'gem',
    title: 'The crystal is the reward',
    body: 'Not a cleared list, not a streak — the handful of things you actually learned. The weight of the whole system leans toward what you keep, and away from throughput.',
  },
  {
    icon: 'anchor',
    title: 'Re-entry is a first-class state',
    body: 'You’re allowed to disappear. Leave for two weeks and nothing breaks; come back to a calm harbour and one low-stakes thing to do. The system expects inconsistency and works anyway.',
  },
];
