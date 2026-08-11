# Star Glass — what's actually missing

Full-repo audit, 2026-08-11. Every claim below was traced to a file and line, or
confirmed absent by search. Claims I could not verify are marked as such.

---

## The one-line diagnosis

**You have built one beautiful instrument and three separate scores, and the
trust gate only covers the part that was already trustworthy.**

Everything else in this document is a consequence of those two sentences.

---

## I. The structural gap: three instruments, no conductor

There are three separate interpretive systems in this repo. Each is good. None
of them knows the others exist.

| Instrument | Where it lives | Size | Consults |
|---|---|---|---|
| The Claude skill | `SKILL.md` + `references/*.md` + `scripts/` | 6,954 words of references | lexicon, synthesis, voice, mode files |
| The web portrait | `web/netlify/functions/interpret.ts:9-63` | 1,697 words, hand-inlined | nothing on disk |
| The Codex | `web/public/codex/*.json` | 312 entries, 63,247 words | nothing; nothing consults it |

**CONFIRMED:** `interpret.ts` contains no `fs`, no `readFile`, no import of
`references/`. It contains zero references to the Codex (grep "codex" in
`web/netlify/` → no hits). The web product — the thing a customer pays for —
runs on a restatement of roughly 24% of the skill's corpus.

What the inlined prompt lost:

- **voice.md's four calibration exemplars** — the register's main quality
  anchor. The web prompt has no exemplar of any kind.
- **synthesis.md §4, the unaspected trap** (~800 words) → one clause
  (`interpret.ts:40`). No `contact_census` check, no orb-profile re-run
  discipline — the exact error synthesis.md calls "the easiest serious error to
  make in this domain."
- **voice.md's dialect derivation** (~450 words) → one sentence
  (`interpret.ts:16`), reduced to an element→metaphor word list.
- **voice.md's titling rule** (the "deflated noun" failure) → the phrase "two
  iconic, equally weighted images."
- **vedic-mode.md** (550 words) → one sentence — *while the UI ships a Vedic
  checkbox* (`ChartForm.tsx:258`).
- **report-template.md** — entirely unused; `ReportView.tsx` reimplements it
  by hand.

And the Codex — 63k words of authored prose, 612 `see_also` edges, zero broken —
is a museum the portrait engine never visits. A Codex entry and the portrait can
say contradictory things about the same placement, and nothing would notice.

**The missing piece is not more content. It is a single source of interpretive
truth that all three read from at build time.** Today the score exists in three
handwritten copies and they have already drifted.

Related: `codex.ts:112-124` (`resolvePlacement`) pushes the in-sign entry and
the in-house entry as two separate sections. That is concatenation — precisely
what `lexicon.md:6` and `SKILL.md:101` forbid. The Codex ships the failure mode
the skill was written to prevent.

---

## II. The trust gate has a boundary, and the reader is standing outside it

The 18-test golden-chart gate in `tests/test_calculate_chart.py` is genuinely
excellent, and it worked: True Node motion, Vedic label honesty,
applying/separating, dominant-element ties, and `fmt_pos` minute-carry are all
**confirmed fixed and confirmed tested**.

The problem is that the fixes stopped at the file boundary of the test suite.

**1. `scripts/draw_chart.py:279-280` — the wheel prints wrong degrees.**
CONFIRMED. The exact bug that was fixed in `calculate_chart.py` survives
verbatim in the renderer:

```python
deg  = int(lon % 30)
mins = int(round((lon % 1) * 60)) % 60
```

| longitude | `/chart` + `/tables` | `/wheel` SVG |
|---|---|---|
| 10.9917 | 11°00′ Aries | **10°00′** |
| 29.9999 | 0°00′ Taurus | **29°00′** |
| 44.995 | 15°00′ Taurus | **14°00′** |

The wheel and the table beside it now contradict each other in the same report.
The wheel is the most-looked-at artifact in the product, and it is the one with
zero test coverage.

**2. `scripts/chart_tables.py:137` — the tie bug's surviving twin.** CONFIRMED.
`least = min(w["elements"], key=w["elements"].get)` returns the first key in
insertion order on a tie. Fire 1 / water 1 always prints "Scarcest element —
fire," silently suppressing water. Exactly the dictionary-order resolution that
was deliberately eliminated one file over.

**3. Ascendant and Midheaven are given a fabricated speed of 0.0.**
`calculate_chart.py:266-268`. The ASC actually moves ~361°/day. Every
applying/separating flag on an angle contact is computed from the wrong term,
and `chart_tables.py:90` prints "applying" next to it.

**4. Two of the existing edge-case tests are tautologies that cannot fail.**
`test_calculate_chart.py:194-199` asserts `utc_offset_applied in (-5.0, -4.0)` —
the only two offsets America/New_York has ever had. `:202-211` asserts
`len(house_cusps) == 12`, which `calculate_chart.py:234` guarantees by slicing.

**5. Silent DST fold.** `calculate_chart.py:413-416` builds the datetime with
default `fold=0` and no ambiguity check. `2021-11-07 01:30 America/New_York`
happens twice; the engine always takes UTC−4 and never says so. One hour moves
the Ascendant ~15° — routinely changing the rising sign. `BirthData` exposes no
`fold` parameter, so there is no way to ask for the other branch.

**6. Polar Placidus mislabelled.** `calculate_chart.py:450` echoes the
*requested* house system. Above the polar circles Swiss Ephemeris silently
substitutes Porphyry. A Tromsø birth gets Porphyry cusps labelled "Placidus" —
the exact ask-vs-effective bug that was correctly fixed for the Vedic preset and
left unfixed here.

**7. Silent Moshier fallback.** `calculate_chart.py:208` passes no ephemeris
flag. If `scripts/ephe/` is missing, Swiss Ephemeris quietly degrades to its
analytic model — while `chart_tables.py:54` prints "Ephemeris | Swiss Ephemeris"
unconditionally. And `/health` (`api/main.py:172-176`) returns `{"ok": true}`
without importing swisseph or computing anything, so Render reports green.

**Zero test coverage exists for:** `draw_chart.py` (nothing imports it),
`chart_tables.py` (nothing imports it), and every `api/main.py` endpoint (no
`TestClient`). All four residual bugs above live in exactly those three files.

---

## III. The glass box has a hole where the thesis lives

The product's thesis is "a portrait that shows its work." The audit apparatus is
the most original engineering in the repo. It has two specific holes.

**1. The auditors are explicitly forbidden from looking at the claims that can
hurt someone.** `interpret.ts:329`:

> "Psychological interpretation, mythic imagery, metaphors, developmental
> guidance, and emotional claims are never auditable — leave them untouched even
> if vivid."

So the gate verifies geometry. "The child in that house learned…" passes by
design.

**2. `verified: true` is stamped, not earned.** CONFIRMED, `interpret.ts:490-524`.
The publish condition is *"did the auditor attach at least one correction,"* not
*"did the auditor verify."* If a round's corrections can't be located in the text
(a smart-quote mismatch, a passage already rewritten), `applied === 0` →
`converged = true` → **break, no re-audit** → line 524 writes
`audit: { verified: true }` even though the last audit said false. The `refereed`
flag is written but the client never reads it (`interpretation.ts:59-70`
destructures only `status/phase/round/reading/error`), so no "this was refereed,
not verified" signal ever reaches the reader.

**3. Corrections are applied globally, not per movement.** `interpret.ts:154-174`
walks the entire reading object and `replaceAll`s. Six auditors run in parallel
on isolated movements. A correction raised against movement 3 rewrites identical
text in movements 1, 5, and the title — and the throughline voice *deliberately*
repeats governing images across movements (`interpret.ts:62`), so collisions are
the expected case, not the edge case.

**4. `framing` — the single sentence carrying the entire epistemic stance — is
generated with no instruction at all.** The schema requires it (minLength 40) and
it is the first thing the reader sees (`ReadingWorkspace.tsx:128`). The word
"framing" appears **zero times inside the PIPELINE prompt string**.

---

## IV. The care clause was agreed and never built

The reconciliation recorded in the audit backlog — the knife cuts as *invitation
to recognition*, not narrated biography — exists nowhere in the shipped product.

- **Hypothesis language: ABSENT.** The only nearby instruction (`interpret.ts:53`)
  protects *parents* from indictment, not the reader from assertion, and its
  neighbouring clause actively says "use tendencies **without hedging**."
- **"Doesn't fit" affordance: ABSENT.** The nearest thing is a notes-box
  placeholder (`ReadingWorkspace.tsx:372`), localStorage-only, never read back
  by anything.
- **Reader-authority framing: one line, in the wrong place.**
  `ReportView.tsx:135` — "a field guide, not a verdict" — sits in the colophon of
  the *downloadable report*, after the whole reading. The reading UI never shows
  it.
- **The Codex is the worst offender.** Measured across all 312 entries: **33
  hedge tokens in 63,247 words**, against 217 declarative "you are" and 57
  past-tense biographical assertions. Served verbatim to any stranger with that
  placement:
  - `chiron_in_gemini`: *"You learned to rehearse."*
  - `chiron_in_house_4`: *"You grew up housed and unhomed."*
  - `house_3`: *"The words handed to you early, and the sibling dramas in which
    you learned your speaking part, still operate as a hidden grammar."*

This is the gap with the largest distance between *what the project believes
about itself* and *what it does*.

---

## V. There is no subject for anything to attach to

CONFIRMED absent across the repo: any auth, accounts, identity, session, JWT,
OAuth, or user record. `DEPLOY.md:85` states the intent explicitly ("not
before"), which was right then and is the binding constraint now.

Consequences, all of them structural rather than fixable by a patch:

- A **$10–12/mo membership is not implementable** — a subscription has no subject.
- A reader cannot return to a portrait they paid for. Chart, portrait, and
  **their own handwritten notes** live in `localStorage` only
  (`App.tsx:124`, `ReadingWorkspace.tsx:99-106`). Cache clear = gone. Second
  device = invisible.
- **Phase C cannot exist.** The retention loop you designed — Cast → Read →
  Investigate ⇄ Experiment → **Notice** → return — requires a durable home for
  the noticing. localStorage is not it.
- No payments, checkout, price, entitlement or paywall code anywhere (grepped
  `stripe|checkout|paywall|entitle|subscription|billing|price`). The full
  six-movement audited portrait is currently **free and unlimited to anonymous
  visitors**.

---

## VI. Legal and licensing are at absolute zero

This is the most serious finding in the document, because it is the only category
where the exposure grows with success.

**No privacy policy, no terms, no consent, no deletion path, no support contact.**
`find` for `*privacy*`, `*terms*`, `*legal*`, `*cookie*` → zero files.
`web/public/` contains only `codex/`.

What is actually collected and where it goes:

- Exact birth **date, time to the minute, and place** — under GDPR that
  combination is directly identifying, and the derived output makes claims about
  the reader's psyche, family, and relationships.
- The birthplace string is sent **keystroke by keystroke to a third party** —
  `geocoding-api.open-meteo.com`, 350ms debounce, `ChartForm.tsx:64`. Disclosed
  nowhere.
- Full chart and full portrait POSTed to the Render engine and to an LLM
  provider.
- **`DEPLOY.md:83` says "Nothing is stored." This is now false.**
  `interpret.ts` writes every finished portrait to Netlify Blobs
  (`setJSON` at 244/289/521). `store.delete()` is never called anywhere. No TTL,
  no expiry, no deletion route. Portraits accumulate permanently and are read
  unauthenticated by id — and `interpret-status.ts:10` validates the id as
  `/^[0-9a-f-]{36}$/i`, which accepts `000000...0`.

**Swiss Ephemeris / AGPL — the decision is documented, the obligation is not
satisfied.** `docs/LICENSING-DECISION.md` correctly says you are riding the
AGPL arm until the CHF 700 professional license is bought before the first paid
portrait. But:

- **There is no LICENSE file.** `find -iname 'LICENSE*' -o -iname 'COPYING*'` →
  nothing, anywhere. A public repo with no license grant is "all rights
  reserved" by default; AGPL §5 requires the combined work to actually *carry*
  the grant. ~5 minutes of work, currently undone.
- **No §13 network offer.** Users interacting over a network must get prominent
  access to the Corresponding Source. Grepped `web/src` and `index.html` for
  `github|source|copyright|©` → no link to the repo appears anywhere in the
  deployed UI.
- Scope is wider than the doc implies: the copyleft covers the whole deployed
  service that links Swiss Ephemeris. Any future payments or customer code
  living in `api/` gets pulled in.

---

## VII. Security surface

1. **SVG injection, unescaped, on an unauthenticated wildcard-CORS endpoint.**
   CONFIRMED — grep for `escape|quoteattr|sanit` across `scripts/` and `api/`
   returns **nothing**. `title`, `subtitle`, every `palette` token and every
   theme `color` are interpolated raw into SVG (`draw_chart.py:341-349`, `:317`,
   `:179`), all typed as unvalidated `Optional[str]`/`Optional[dict]`
   (`api/main.py:99-103`). SVG served as `image/svg+xml` executes script when
   navigated to directly.

   The client-side path is real too: `wheelSvg` goes to
   `dangerouslySetInnerHTML` (`ReadingWorkspace.tsx:203`, `ReportView.tsx:77,89`),
   and the subtitle is built at `App.tsx:141` from `placeLabel` — which comes
   verbatim from the open-meteo response or from restored localStorage. `innerHTML`
   won't run `<script>`, but it fires `onerror` on an injected `<image>`.

2. **No CSP anywhere.** `netlify.toml` sets only `X-Content-Type-Options` and
   `Referrer-Policy`. No `frame-ancestors`, no HSTS, no Permissions-Policy.

3. **Palette globals race.** CONFIRMED. `draw_chart.apply_palette` writes eight
   *module-level globals*; `api/main.py:184` is a plain `def`, so FastAPI runs it
   in a 40-thread pool. Two concurrent `/wheel` calls interleave. Brand A's wheel
   comes back half in Brand B's colours — in the feature whose entire pitch is
   "a partner brand is a JSON payload, not a fork." The `try/finally` scopes the
   mutation in time, not across threads.

4. **The engine is a free-tier subprocess-per-request service with `allow_origins=["*"]`,
   no auth, and no rate limit.** `api/main.py:132-143` forks a fresh Python
   interpreter per uncached `/chart`. A loop of unique birth dates defeats the
   512-entry cache and takes it down from one laptop, free.

5. **Unhandled 500s and traceback leakage.** `api/main.py:145` returns the last
   500 bytes of Python stderr — absolute paths, library versions — to any caller.
   `subprocess.TimeoutExpired` is never caught. Caller-supplied `chart` dicts are
   bare `Optional[dict]` and go straight into `chart["angles"]["Ascendant"]`.
   `date`, `time`, `tz` have no validation at all.

6. **Prompt-injection-funded LLM proxy.** `interpret.ts:240-249` validates
   `input.chart` as `typeof === "object"` and doesn't validate `zodiac`/`essence`
   at all before interpolating them into a Sonnet prompt, whose output is then
   retrievable from the public `GET /api/interpret/:jobId`.

---

## VIII. No senses

CONFIRMED absent (grepped `sentry|datadog|posthog|plausible|mixpanel|amplitude|
gtag|analytics|otel|rollbar|uptime`): **zero** error tracking, **zero**
analytics, **zero** uptime monitoring, **zero** logging in the Python service
(`grep logging|logger` in `api/` and `scripts/` → nothing). The React app has
zero `console.*` calls, so a client crash is invisible to you.

Set that against the cost shape. One anonymous POST fans out into:

- 1 Sonnet composer call (`max_tokens: 8000`, input = long system prompt + up to
  180KB chart JSON + full ledger)
- **6 parallel Haiku audits, each re-carrying the entire ledger**
- **up to 3 repair rounds — another 6 Haiku calls each**
- optionally 1 Sonnet referee

**Worst case ≈ 26 model calls per request.** The only control is
`rateLimit: 5 per 180s aggregateBy ["ip","domain"]` (`interpret.ts:542`) = 100
portraits/hour/IP, trivially defeated by rotating IPs. There is no spend cap, no
budget alarm, no per-user quota (there is no user).

**You cannot price a product whose unit cost and conversion funnel are both
unmeasured.** That is the actual blocker on M1, not the pricing decision.

---

## IX. No front door

`App.tsx` renders `{castResult ? <ReadingWorkspace/> : <ChartForm/>}`. There is
no router. Therefore: no landing page, no about, no pricing, no examples, no FAQ,
and **no sample reading anywhere** — nothing that shows a stranger what a
six-movement portrait reads like before they hand over their exact birth time.

`web/index.html` has no Open Graph tags, no Twitter card, no favicon, no
manifest. **Every share of this link renders as a bare URL.**

Also stale: `README.md:107` and `DEPLOY.md:54` tell you to set `DEFAULT_ENGINE`
in `web/index.html`. That name exists only in those two docs — the real config
moved to `VITE_ENGINE_URL` (`web/src/api.ts:3`). Following the deploy docs as
written does nothing.

---

## X. Web-app engineering scaffolding

- **No typechecking at all.** `web/package.json` build is bare `vite build`, and
  **`typescript` is not in devDependencies** — `tsc --noEmit` cannot even be run.
  `tsconfig.json` sets `"strict": true` and is executed by nothing. It also
  scopes `"include": ["src"]`, excluding `netlify/functions/*.ts` — the two files
  with the most logic in the product. Vite strips types without checking them, so
  every type error deploys green.
- **No lint.** No eslint config anywhere, yet `App.tsx:107` carries an
  `// eslint-disable-next-line` for a linter that isn't installed.
- **No React tests, no error boundary.** `main.tsx` mounts `<App/>` bare.
  Combined with `loadSession` (`App.tsx:44-54`) validating `chart` and `meta` but
  **not the `reading` shape**: a malformed stored reading throws in
  `ReadingWorkspace.tsx:128` on every load → permanent white screen, and since
  nothing ever clears localStorage, **the user cannot recover.**
- **Nothing is ever cleared.** `removeItem` is called exactly once in the whole
  app, on `sessionStorage` (`interpretation.ts:30`). `editChart()`
  (`App.tsx:217-227`) nulls React state but never touches `SESSION_KEY`, and the
  persist effect is guarded by `if (!castResult) return`. The previous person's
  birth data and portrait survive "Edit / recast" and restore on next load.
- **Stale-portrait leak.** `App.tsx:207-210` — `composeReading(...).then(setReading)`
  with no AbortController, no generation counter. Cast A → recast to B while A
  composes → A's portrait renders beside B's wheel and apparatus, and
  `App.tsx:121-126` persists that mismatched pair.
- **Timeout mismatch.** Client deadline 12 min; server worst case ≈ 27 min;
  Netlify background functions cap at 15 min. A long job is killed mid-pipeline
  leaving the blob in `status:"working"` **forever** — no terminal error is ever
  written.
- **Resume window off-by-three.** `JOB_LIFETIME = 15min` (`interpretation.ts:16`)
  vs a 12-min resume deadline (`App.tsx:107`). Refreshing at minute 13 throws
  "still taking shape" instantly on a job that may be seconds from ready.
- **Wheel failure is indistinguishable from loading.** `ReadingWorkspace.tsx:203`
  renders "Drawing the chart…" whenever `wheelSvg` is empty — including after the
  6 retries are exhausted. Forever, with no error and no retry control.
- **Poll retry storm.** `interpretation.ts:58` — `if (!statusResponse.ok) continue;`
  A 429 from the status endpoint's own limit keeps the client polling at 3s for
  the full 12 minutes. Three tabs on one job guarantees a permanent 429 loop.
- **`ReportView` fires up to 7 concurrent wheel renders** with an empty
  `.catch(() => {})` — the user prints a report with silently missing figures.
- **React keys derived from prose content** (`key={paragraph}`,
  `key={paragraph.slice(0,48)}`) in a product whose prompt deliberately repeats
  images across movements.
- **CI does not gate deploy.** `render.yaml:22` `autoDeployTrigger: commit` and
  Netlify build on push. A red workflow stops neither. Push *is* deploy, via a
  double-clickable `.command` file, with no staging and no rollback procedure.

Accessibility deserves separate mention: the *intent* is unusually good — skip
link, `role="dialog"`, `aria-label` on every icon button, reduced-motion
respected in six places. But `grep -rn "onKeyDown"` across `web/src` returns
**zero hits**: the tablist has no arrow keys, the radiogroups have no roving
tabindex, neither modal traps or restores focus, and movement changes announce
nothing. There is real craft here and no automated gate to protect it.

---

## Corrections to earlier claims

Three items in the standing backlog are **fixed and I verified them**: True Node
retrograde derives from speed and is tested across 120 days; Vedic mode records
`coerced_settings` and the frontend reads `chart.input.effective`; planet-planet
applying/separating is mathematically correct and tested; dominant-element ties
are reported and broken by Sun→Moon→ASC; `fmt_pos` carries correctly.

Two claims are **wrong**: the `/chart` cache is bounded (512 entries, FIFO,
`api/main.py:123-149`), not unbounded. And `web/pnpm-lock.yaml` **does exist and
is tracked in git** — builds are reproducible.

---

## What I'd actually do, in order

**Before anything else (hours, not days):**

1. Add a `LICENSE` file (AGPL-3.0) and a source link in the app footer. Your own
   licensing decision depends on both and neither exists.
2. Fix `draw_chart.py:279-280`. The wheel is lying about degrees in every report
   you have ever shown anyone.
3. Escape `title`, `subtitle`, and palette tokens in `draw_chart.py`; validate
   colours by regex.
4. Correct `DEPLOY.md:83`. "Nothing is stored" is no longer true.

**The gate before charging (the real one):**

5. **Privacy policy + terms + deletion path + third-party disclosure.** You are
   taking exact birth time and place and sending the place keystroke-by-keystroke
   to a third party with no notice, and storing portraits forever with no erasure
   path. This is not a launch checkbox; it is the thing that makes charging
   lawful.
6. **Auth.** Not for features — because membership, saved readings, saved notes,
   entitlement, per-user quotas, and the entire Phase C noticing loop all need a
   subject, and none of them can be built until one exists.
7. **Error tracking + analytics + a spend cap.** Ship these *before* the paywall,
   not after, so you know your unit cost before you set a price.
8. Buy the Swiss Ephemeris professional license (CHF 700) before the first paid
   portrait, as your own decision record says.

**The structural work that makes the product durable:**

9. **Collapse three instruments into one.** Generate `interpret.ts`'s prompt
   from `references/*.md` at build time. Give the portrait engine access to the
   Codex. Make the drift impossible rather than watched.
10. **Extend the trust gate past its current boundary** — tests for
    `draw_chart.py`, `chart_tables.py`, and the API endpoints; replace the two
    tautological tests; add `typescript` and `tsc --noEmit` to the web build.
11. **Build the care clause.** Hypothesis language in the PIPELINE prompt, an
    instruction for `framing`, the Resonates / Partly / Doesn't-fit control in
    the reading UI, and a hedging pass over the 312 Codex entries. Then make the
    publish gate stop stamping `verified: true` when the last audit said false,
    and surface `refereed` to the reader. The glass box is the thesis; right now
    it is glass everywhere except the one wall people can be hurt by.
