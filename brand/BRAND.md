# Pacecraft Brand Guide

## Aesthetic

Worn enamel pin, not Lululemon. Stencil, stamped, field-manual. Trail dust,
not polished fitness-tech. The aesthetic should feel slightly dirtbag — social,
fun, demanding — without being hardcore-intimidating or corporate-wellness.

The brand must work equally well on a race bib, a trucker-hat patch, a
sticker slapped on a hydration vest, a terminal app header, and a laptop
sticker next to a Rainier Beer can.

## Color system

Six colors. Never introduce new colors without a specific reason.

| Name   | Hex       | Use                                                    |
|--------|-----------|--------------------------------------------------------|
| Dust   | `#C9A87C` | Secondary mountain range, muted accents, weathered fills |
| Moss   | `#5C7A3E` | Enamel pin body, collar, alternate badge                |
| Ember  | `#D9622C` | Sun, Lily's body, accent color, aid station sign       |
| Slate  | `#3A3F45` | Primary mountain range, nose/eyes/paws, wordmark type  |
| Bone   | `#F2EDE0` | Backgrounds, snow, light-mode canvas, text on dark      |
| Blaze  | `#E8B547` | Tiny accents only — collar tag, badge stars            |

Supporting shades (derived, used sparingly):

| Name        | Hex       | Use                                               |
|-------------|-----------|---------------------------------------------------|
| Ember dark  | `#A84919` | Lily's shadows, muzzle plane, underbody           |
| Slate dark  | `#2A2E33` | Dark-mode surfaces, moody favicon background     |
| Ember deep  | `#8A3A14` | Brow furrow lines, ear inner highlights           |
| Ember depth | `#6B2E10` | Whisker spots, deepest ear detail                 |

### Palette rules

- Ember and Blaze should never appear side-by-side at equal weight. Ember is
  the hero warm, Blaze is a punctuation mark.
- Never dark-on-dark. If the background is slate, the mascot/graphics use
  ember or bone. If the background is moss, slate or bone work.
- Dust is almost always background-range or soft accent — never foreground.
- Avoid gradients. All fills are flat.

## Typography

- **Display**: Oswald, weight 500, letter-spacing 0.02em — for logotype,
  headlines, badge text. Condensed, stencil-adjacent feel.
- **Sans body**: Inter, weights 400 and 500 — for all body copy, UI, labels.
- **Mono**: JetBrains Mono — for data, numbers, pace splits, timestamps,
  coordinates. The "technical tool" register.

### Typography rules

- Tagline and small labels always letter-spaced (0.15–0.25em, uppercase).
- Never mix Display and Sans in the same size at the same weight.
- Numbers that matter (paces, times, elevations) go in mono.

## Logo system

### Primary mark (`pacecraft-mark.svg`)

Horizontal lockup. Mountain + sun glyph on the left, wordmark on the right,
tagline beneath. **Use this in the app header, document headers, and most
UI contexts.**

Minimum width: 160px. Below that, use the glyph alone.

### Glyph only (`pacecraft-glyph.svg`)

The mountain + sun construction without the wordmark. Use as favicon, app
icon, social avatar, and anywhere the name is already established.

### Wordmark only (`pacecraft-wordmark.svg`)

Just the typography. Use when paired with other graphics that carry the
brand identity (e.g., next to the pin, or under a large Lily illustration).

### Enamel pin (`pacecraft-pin.svg`)

Marketing identity. Use for website hero, merch, stickers, social cards.
Moss body, ember sun, slate-dark mountains, bone wordmark with ember CRAFT.

### Lockup with Lily (`pacecraft-lily-lockup.svg`)

Special edition. Lily silhouette perched on the ridge. Use sparingly — splash
screens, onboarding, annual recaps, special marketing moments. Not the
everyday mark.

### Contrast rules for logos

- Primary mark must sit on bone or a color that's at least 70% different in
  luminance from slate. Never place the mark on ember — the sun disappears.
- The pin can sit on bone, slate, dust, or photographic backgrounds. Not
  on moss (body clash) or ember (sun clash).
- For the moody dark favicon (`favicon-32.svg`), use bone or blaze for the
  sun against the slate-dark background.

## Mascot: Lily

Lily is a Hungarian Vizsla. She is the brand's heart. She appears in
illustrative contexts to add warmth, personality, and continuity. She does
not appear in data-dense screens (race simulation, segment analysis) where
her presence would compete with information.

### Canonical proportions

- Ember body, ember-dark shadows/underside/inner-ear.
- Subtle stop between forehead and snout (gentle concave inflection, not
  a hard step).
- Long draped ears reaching below the jawline.
- Semi-docked tail, held up and slightly forward.
- Almond-shaped eyes in slate with a tiny bone highlight.
- Three whisker spots on the muzzle (small, ember-depth color).
- Moss collar with a blaze tag dot.
- Slight dewlap shadow under the jaw.

### Pose usage

| Pose           | File                     | Use where                                              |
|----------------|--------------------------|--------------------------------------------------------|
| Sitting alert  | `lily-sitting.svg`       | Default/empty states, onboarding, calm moments         |
| Head tilt      | `lily-headtilt.svg`      | Tooltips, help, "what does this mean", confirmations   |
| Standing proud | `lily-standing.svg`      | Finish screens, PRs, achievements, podium moments      |
| Running        | `lily-running.svg`       | Loading, race-in-progress header, active simulation    |
| Aid station    | `lily-aidstation.svg`    | Aid segment headers, fueling screens, checkpoint UI    |
| Curled         | `lily-curled.svg`        | Rest days, DNF gently, 404s, "nothing scheduled"       |
| Badge (ember)  | `lily-badge.svg`         | Default achievement unlocks, finish badges             |
| Badge (moss)   | `lily-badge-moss.svg`    | Pages already heavy with ember, cooler alt            |
| Ridge          | `lily-ridge.svg`         | Splash screens, chapter dividers, default sentinel     |
| Ridge dramatic | `lily-ridge-dramatic.svg`| Big marketing moments, 100-miler completions          |

### Mascot rules

- Never modify Lily's proportions or colors. If you need a new pose, ask.
- Never place Lily on a surface the same color family as her body (no ember
  Lily on ember, no slate Lily on slate).
- Lily does not appear alongside real photography of other dogs.
- Lily does not talk. No speech bubbles. Emotion comes from pose.
- The running pose's tongue-out detail is required — not optional.
- The "GOOD DOG" badge text is reserved for badge contexts only. Don't
  use the phrase as general UI copy.

## Application contexts

### Where the mascot goes

- Splash / onboarding (ridge or sitting)
- Empty states (curled or sitting)
- Success/finish screens (standing or badge)
- Aid station segment UI (aid station pose)
- Tooltips (head tilt, small)
- Achievement unlocks (badge)
- 404 / error pages (curled)

### Where the mascot does NOT go

- Main app header (logo only)
- Race simulation screens (would compete with data)
- Serious warnings (injury, DNF with medical concern)
- Settings, account, billing (too transactional)
- Alongside the logo in the same fixed position (one or the other)

## Tone of voice

When writing copy near brand assets:

- **Voice**: capable but not precious. Honest about difficulty. Warm
  without being saccharine. Confident without being cocky.
- **Never**: hustle culture, toxic positivity, "crush it", "beast mode",
  "rise and grind".
- **Often**: direct, specific, slightly dry. A little self-aware. Willing
  to acknowledge that ultrarunning is kind of absurd and that's part of
  the fun.
- **Example finish copy**: "That's a finish. Go eat a sandwich." — not —
  "CONQUEST UNLOCKED! You are unstoppable!"
