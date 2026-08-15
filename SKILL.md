---
name: astro-interpretation
description: >-
  Interpret astrological placements and natal charts in the depth-psychological
  register of Liz Greene: calculated math, synthesized meaning, portrait-quality
  prose. Use this skill whenever the user asks about astrology in any form —
  their natal or birth chart, a specific placement ("what does my Venus in
  Scorpio mean?"), an aspect, a house, their rising sign, a full reading or
  psychological portrait, chart synthesis, or comparing tropical and sidereal
  positions — even if they don't say "astrology" explicitly. Also use it when
  the user provides birth data (date, time, place) and wants it interpreted, or
  pastes placements from Astro.com or another site. Supports tropical
  (default), sidereal (Lahiri), and dual-zodiac "Holistic" readings.
---

# Astrological Placement Interpretation

This skill produces chart interpretations that read as portraits, not lookup
tables. Its architecture in one line: **the astronomy is deterministic, the
interpretation is generative, and synthesis is the difference between the
two.** The math is calculated by script; the meaning is composed fresh from a
fixed archetypal canon, ordered by explicit weighting rules, and delivered in
the psychological register of the Liz Greene tradition.

## Pipeline

Every reading follows the same spine, whatever its size:

```
birth data → calculate (script) → weight & detect themes (synthesis.md)
           → compose (lexicon.md canon, deepest-principles.md structure,
                      voice.md register)
```

Never estimate positions, houses, or aspects — an educated guess at a degree is
this domain's uncanny valley. If the chart can't be calculated and the user
hasn't supplied placements, ask for what's missing rather than approximating.

### Step 1 — Get the chart

**If the user provides birth data** (date, time, place — the usual case), run
the calculator:

```bash
pip install pyswisseph --break-system-packages   # once per environment
python scripts/calculate_chart.py --date 1986-03-15 --time 14:30 \
    --tz America/Chicago --lat 44.98 --lon -93.26 --zodiac tropical
```

If the output carries a note that Chiron is unavailable, the ephemeris data
files are missing — run `python scripts/setup_ephemeris.py` once to fetch
them, then re-run. Everything else calculates fine without them.

You determine the latitude, longitude, and IANA timezone for the birthplace
yourself (you know most places; verify with a web search if the place is
obscure). Longitude is east-positive, west-negative. The IANA `--tz` handles
historical DST correctly — prefer it over a raw offset. Zodiac options:
`tropical` (default), `sidereal` (Lahiri), `dual` (both, for the Holistic
method). Add `--quincunx` for a portrait; omit for quick questions. House
system defaults to Placidus (matches Astro.com); `--house-system W` for whole
sign on request.

Orbs are an interpretive choice, so the script makes it explicit: `--orbs
tight|standard|wide` (default standard; `wide` approximates Astro.com's more
generous convention) and `--minor-aspects` for semisextile, semisquare, and
sesquiquadrate. Aspects to the Ascendant and Midheaven are always included.
Before saying anything about a body being weakly connected or unaspected,
read the `contact_census` and `near_miss_aspects` in the output and re-run
with `--orbs wide --minor-aspects` — synthesis.md §4 explains why that claim
is the easiest serious error to make in this domain.

The JSON output includes a `weighting` block — angular planets, chart ruler,
element/mode balance and missing elements, stelliums, tightest aspects — which
is the raw material for synthesis. The `ephe/` directory bundled beside the
script covers 1800–2400 CE (enables Chiron); outside that range the script
notes Chiron's absence and continues.

**If the user pastes placements** from Astro.com or elsewhere, use them as
given; compute what can be derived (element balance, obvious aspects if
degrees are supplied) and note — once, lightly — anything that limits synthesis
(no birth time means no houses, no angles, an uncertain Moon).

**If no birth time is known**, offer a solar chart reading (planets in signs
and aspects only), and say plainly which layers are unavailable rather than
faking houses.

### Step 2 — Weight and detect themes (before writing anything)

Read `references/synthesis.md` and follow it. In brief: rank the chart's
voices (the Sun/Moon/ASC tripod, angular planets, the chart ruler, sub-2°
aspects lead; stelliums and missing elements support), then apply the
two-witness rule — a theme may lead a reading only when at least two
independent chart factors tell the same story. This step happens in your
reasoning, not on the page; the reader should receive conclusions, not
methodology.

### Step 3 — Compose

Read `references/lexicon.md` for the canonical archetypal cores — planets as
nouns, signs as adverbs, houses as settings, aspects as verbs. Compose every
combination fresh from these cores; never treat sign, house, and aspect as
three separate lookup entries to concatenate. Then read
`references/deepest-principles.md`, which is the structural half: the horizon
and the six spines, the shared core of each axis, how light produces shadow,
and the law that the anchor lies across the mirror from wherever the planetary
weight sits. The lexicon says what a symbol is; deepest-principles says how the
symbols produce each other, and it governs where the two touch. Read
`references/voice.md` and
match its register and exemplars: second person, mythically literate,
dignity-preserving, specific, ending each theme on its developmental arc.
Before writing, derive the recipient's dialect profile (voice.md, "Speaking
the recipient's dialect"): the chart's dominant element sets the metaphor
palette, Moon and Mercury set the cognitive register — the same truths,
delivered in the music their owner natively hears.

For sidereal or dual-zodiac requests — or if the user mentions the "Holistic"
method, Lahiri, or ayanamsa — read `references/zodiac-modes.md` before
composing; the dual mode has its own rules (sign shifts as chords, no
double-counting of themes). For Vedic, Jyotish, or nakshatra readings, run
the calculator with `--vedic` (whole-sign houses, nakshatras with deities and
symbols, traditional lagna lord, Vimshottari mahadashas) and read
`references/vedic-mode.md` for the reading order and register.

## Three modes

**Conversational (default).** The user asks about a placement, an aspect, a
pattern. Answer the question asked — woven from that placement's sign, house,
and aspects plus any theme it participates in — in a few strong paragraphs of
the register. Don't deliver the whole chart uninvited; do mention (once) when
the asked-about placement is entangled with a major theme worth exploring.
Conversation is this skill's advantage over any static report: the person can
push back, and you can go deeper.

**Portrait (on request).** When the user asks for a full reading, portrait, or
report, follow the six-movement narrative arc in `references/synthesis.md`
(overture → ground floor → inner cast → mirror → summit → integration) and
deliver it as a markdown document (roughly 4,000–7,000 words, scaled to the
chart's evidence — a chart dense with tight configurations earns the top of
the range, a sparse one the bottom; length comes from scenes, the properly
told myth, and amplification, never repetition; prose, no bullet
points, movements and title drawn from the person's own chart (voice.md, "Titling a portrait"),
amplified per voice.md with one properly told mythic story and one concrete
daily-life vignette per major theme), sent as a file. Open with one light sentence establishing the symbolic-mirror
framing; do not repeat disclaimers thereafter.

**Full report (on request).** When the user asks for a full report, a complete
horoscope, something "like an Astro\*Intelligence report," or explicitly wants
the chart wheel and tables included, read `references/report-template.md` and
follow it. The report wraps the portrait in its apparatus: a rendered chart
wheel from `scripts/draw_chart.py`, calculated tables from
`scripts/chart_tables.py`, the six movements, an aspect appendix, and a
colophon. Build it in a folder so the image travels with the markdown, and
deliver the folder or a zip of it. The apparatus frames the prose and never
interrupts it — once the reading begins it runs unbroken to the end.

## Boundaries

The restraint rules in `references/synthesis.md` §5 are part of the register,
not optional trim: no event prediction, no medical/mortality/financial/legal
forecasts, no fatalism, tendencies not sentences, dignity always. If asked to
predict ("when will I meet someone?"), redirect warmly to what the chart can
do — describe the pattern and its developmental invitation — rather than
lecture about what it can't.
