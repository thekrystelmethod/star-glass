# The StarGlass Codex — compiled interpretation graph

The Codex is StarGlass's click-deeper layer: a compiled knowledge graph of
interpretation entries, authored once at build time in the house register
(lexicon.md → nouns/adverbs/settings, voice.md → voice), reviewed, versioned
in git, and served as static JSON. At runtime nothing generates — the frontend
only retrieves and walks edges. Hallucination is structurally impossible
because no model is present when the user clicks.

## Design in one line

AstroClick's determinism, Greene's register, and graph edges to do the
contextual work concatenation never could.

## Files (served from `web/public/codex/`)

- `index.json` — manifest: version, entry counts, point list, file map.
- `<point>.json` — one file per point (`sun.json` … `north-node.json`),
  containing the point's canon plus its 12 in-sign and 12 in-house entries.
- `risings.json` — the 12 Ascendant entries.
- `houses.json` — the 12 house-setting essays.
- `canon.json` — short canonical cores for points, signs, and aspects
  (adapted from `references/lexicon.md`) used as panel headers and for
  future layers.

## Node ID convention

Stable, lowercase, underscore-joined:

- `chiron_in_gemini` (point in sign)
- `chiron_in_house_4` (point in house)
- `leo_rising` (Ascendant)
- `house_4` (house essay)
- `canon:chiron`, `canon:gemini`, `canon:square` (canon cores)

Future layers reserve `moon_square_saturn` (aspect entries) and
`ruler_of_1_in_10` (derived placements). IDs never change once shipped; the
frontend and any future agent address content only by ID.

## Entry shape

```json
{
  "id": "chiron_in_gemini",
  "title": "The Stammer and the Silver Tongue",
  "body": ["paragraph…", "paragraph…"],
  "invitation": "One sentence: the developmental arc this placement is for.",
  "edges": {
    "point": "chiron",
    "sign": "gemini",
    "see_also": ["canon:mercury", "house_3"]
  }
}
```

`body` is 2–3 paragraphs (~180–280 words), conversational-mode register:
second person, present tense, mythically literate, dignity-preserving,
specific ("specificity is the kindness"), no prediction, no fatalism, no
mechanics on stage, ending on the arc. Each entry is composed fresh from the
lexicon cores — planet as noun, sign as adverb, house as setting — never
assembled by concatenation. Entries are chart-agnostic (canonical); the
frontend supplies this-chart context by walking edges (the point's house,
its aspects when that layer ships).

## Edge semantics

- `point` / `sign` / `house` — the entry's own coordinates (typed, resolvable
  to canon nodes).
- `see_also` — curated resonances: a point's in-sign entry points to the
  sign's ruler (`canon:mercury` for Gemini) and the sign's natural house
  (`house_3`); an in-house entry points to the house essay and the house's
  natural sign ruler. Risings point to the ruling point (the chart ruler
  doorway) and `house_1`.

## Runtime assembly (pure retrieval)

Click a planet row → panel shows: canon core (one line) → in-sign entry →
in-house entry → see-also chips (each chip navigates to that node). Click the
Ascendant → rising entry + house_1. All deterministic; lazy-loaded per point
file (~40–60 KB each).

## Provenance rule

Every word served by the Codex was authored at build time and lives in this
repo. Any future "weave" step (grounded composition across retrieved nodes)
must quote only Codex nodes as source material and ships as a separate,
optional layer.
