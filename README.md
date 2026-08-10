# astro-interpretation

A generative-grammar skill for astrological chart interpretation in the
depth-psychological tradition of Liz Greene — deterministic astronomy,
generative meaning.

**Architecture in one line:** the math is calculated (Swiss Ephemeris), the
interpretation is composed fresh from a fixed archetypal canon, and an
explicit synthesis methodology (weighting + theme detection) is what turns
placements into a portrait instead of a lookup table.

## Contents

```
SKILL.md                     Orchestration: modes, pipeline, when to load what
scripts/calculate_chart.py   Swiss Ephemeris: positions, houses, aspects, orbs,
                             weighting data; tropical / sidereal / dual / --vedic
scripts/setup_ephemeris.py   One-time fetch of Swiss Ephemeris data files
scripts/ephe/                Ephemeris data lands here (gitignored, not redistributed)
references/lexicon.md        The archetypal canon (~42 entries)
references/synthesis.md      Weighting, two-witness theme detection, narrative arc,
                             restraint rules
references/voice.md          The register, recipient-dialect rules, exemplars
references/zodiac-modes.md   Tropical / sidereal / dual-zodiac "Holistic" rules
references/vedic-mode.md     Jyotish mode: nakshatras, lagna lord, dashas
evals/evals.json             Test prompts + assertions
```

## Setup

```bash
pip install pyswisseph
python scripts/setup_ephemeris.py    # one-time; downloads 3 data files (~2 MB)
```

Python 3.9+; no other dependencies, and no network needed after setup. The
calculator runs without the data files too (pyswisseph falls back to its
built-in Moshier ephemeris) — you just lose Chiron and a little precision.

## Quick start (calculator only)

```bash
python scripts/calculate_chart.py \
  --date 1986-03-15 --time 14:30 --tz America/Chicago \
  --lat 44.98 --lon -93.26 --zodiac tropical --quincunx
```

Add `--vedic` for sidereal + whole-sign houses + nakshatras (deity and symbol
per placement) + traditional lagna lord + Vimshottari mahadasha timeline.
`--zodiac dual` returns both zodiacs plus the list of placements that shift
sign between them.

## Using the skill with an LLM

The skill is a plain-file protocol, portable to any harness that can read
files and run Python (Claude Code, the Claude API with tools, or any agent
runtime):

1. Load `SKILL.md` as the operating instructions.
2. The model runs `calculate_chart.py` for the math and reads the reference
   files it is directed to (`lexicon.md` always; `synthesis.md` before any
   weighting; `voice.md` before composing; mode files as needed).
3. Output is either a conversational reading or a full six-movement portrait.

The interpretive quality lives in three places: the canon (lexicon), the
synthesis rules (weighting + the two-witness rule), and the voice guide
(register, recipient-dialect derivation, exemplars). Edit those to retune the
instrument; the script never needs to change for stylistic evolution.

## Design notes

- **Grammar, not corpus.** No pre-written interpretation paragraphs exist
  anywhere in this repo. Planets are nouns, signs adverbs, houses settings,
  aspects verbs; every combination is composed at read time.
- **Recipient dialect.** The chart's dominant element selects the metaphor
  palette; Moon and Mercury set the cognitive register. Same truths,
  different music.
- **Restraint rules are load-bearing.** No event prediction, no fatalism, no
  medical/financial forecasts; hard aspects are developmental tasks. These
  are part of the register, not appended disclaimers.
## Ephemeris data and licensing

The `.se1` data files and the pyswisseph library come from the Swiss
Ephemeris (Astrodienst) and are **not redistributed in this repository** —
`setup_ephemeris.py` downloads them from Astrodienst's own public repo at
setup time, which keeps this repository free of third-party data and leaves
its licensing options open.

Swiss Ephemeris is dual-licensed. Under **AGPL-3.0** it is free, but the
license is network-copyleft: running it on a server that users reach over a
network counts as distribution, so a hosted API built on it must publish its
source. The **professional license** is a one-time CHF 700 fee (valid 99
years, unlimited projects for one licensee) and permits closed-source
distribution, servers, and APIs with no source disclosure. Personal and
open-source use needs nothing. Any commercial productization of this skill
should budget for the professional license. Not legal advice — read the
contract at astro.com/swisseph before shipping.

## The ephemeris API (Phase 1)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/thekrystelmethod/star-glass)

One click hosts the engine in the cloud: the button reads `render.yaml` (the
deployment spec in this repo), builds from `api/Dockerfile`, and gives the
engine a public address. Sign in with GitHub, click **Apply**, done — see
`DEPLOY.md` for the friendly walkthrough. After deploying, paste the address
into `DEFAULT_ENGINE` at the top of `web/index.html`.

`api/main.py` exposes the deterministic core over HTTP — no LLM in this
service; everything is a pure, cached function of birth data:

```bash
pip install -r api/requirements.txt
uvicorn api.main:app --port 8000
# or: docker build -f api/Dockerfile -t ephemeris . && docker run -p 8000:8000 ephemeris
```

`POST /chart` (birth data → chart JSON, the system's API contract),
`POST /wheel` (SVG; accepts `highlight`, `themes`, and a `palette` object of
white-label design tokens — a partner brand is a JSON payload, not a fork),
`POST /tables` (markdown apparatus blocks), `GET /health`. Wheel and tables
accept either raw birth data or a prior `/chart` response, so downstream
services never recompute.

The interpretation pipeline (Phase 2) is a client of this API, as is any
frontend. Headless by design.

## Roadmap sketches

Transits and synastry (new reference files against the same engine), a
readings repository with feedback learning, API deployment as a service
endpoint, and a research mode for statistical work over many charts.

## Repo map (updated 2026-08-10)

- `SKILL.md` + `references/` — the Claude astro-interpretation skill
- `web/` — the Star Glass web app (Vite + React); functions in `web/netlify/functions/`
- `scripts/` — Python chart-math engine + Swiss Ephemeris setup
- `api/` — Python API service (Dockerfile; deploys via `render.yaml`)
- `starglass-codex-v1/` — interpretation content (JSON codex + authoring docs)
- `docs/qa/` — design-QA screenshots (gitignored by design)
- `_archive-*/`, `_to_delete/` — local quarantine for caches/stale files; safe to Trash, never committed
- Push with the double-click script `Push Star Glass to GitHub.command`
