# StarGlass — ordered verification and implementation backlog

**Prepared:** 2026-08-11  
**Source:** `STARGLASS-GAP-AUDIT-2026-08-11.md` and repository inspection at commit `3151193` (`main`)  
**Purpose:** Convert Claude Fable's audit into a release-gated backlog that Krystel, Claude Fable, and Codex can verify and implement without losing the product thesis.

---

## 1. Executive decision

StarGlass is **not ready for paid launch or broad public acquisition**. The immediate blockers are not missing marketing pages or a missing checkout. They are:

1. an unresolved Swiss Ephemeris licensing posture for an already public service;
2. known chart-output contradictions and untested renderer/API surfaces;
3. an injectable SVG endpoint and an unauthenticated, cost-bearing generation path;
4. undisclosed third-party processing and indefinite server-side portrait storage;
5. a trust gate that verifies calculations but can still publish unverified or psychologically over-assertive prose;
6. no identity, authorization, retention, deletion, observability, or unit-cost foundation for membership.

**Recommended operating posture:** keep development and controlled testing moving, but do not charge, advertise broadly, or invite unrestricted generation until Release Gate A is satisfied. If the production endpoints are currently public, use an environment-controlled invite/maintenance gate while the P0 items are completed.

---

## 2. What was verified during backlog preparation

### Confirmed in the repository

- The interpretive skill/reference corpus, the inlined web prompt, and the static Codex are separate sources that can drift.
- The web composer does not import the reference files or Codex content.
- The Codex UI concatenates in-sign and in-house essays rather than synthesizing them.
- The wheel renderer contains the minute-carry defect already fixed in `calculate_chart.py`.
- `chart_tables.py` still resolves a scarcest-element tie by dictionary order.
- Ascendant and Midheaven aspects use fabricated `0.0` speeds.
- Ambiguous/nonexistent local times have no explicit product or API treatment.
- Requested house system is reported as effective without detecting polar fallback.
- Ephemeris fallback is neither forced, detected, nor truthfully surfaced by health/apparatus output.
- SVG text and palette values are interpolated without escaping/strict validation; palette state is global and mutable.
- Completed readings are written to Netlify Blobs without an expiration or deletion path.
- The interpretation status endpoint is bearer-by-ID with no user ownership or expiry.
- The audit correction function performs global replacement across the whole reading.
- A correction that cannot be applied can reach a fixed point and publish with `verified: true`.
- `refereed` is stored but not represented in the frontend result type or reader UI.
- The composer prompt does not explicitly instruct the required `framing` field.
- The reader-authority/care clause is not implemented at the point of reading.
- Auth, accounts, authorization, entitlements, billing, and durable notes/readings are absent.
- Legal/privacy/support pages, a source link, CSP/HSTS/Permissions-Policy, analytics, error tracking, and service logging are absent.
- The app begins directly at birth-data collection; there is no pre-data landing/sample/trust layer.
- The web build does not typecheck, lint, or run React/API tests; Netlify functions are outside the current TypeScript scope.
- The local session can retain old birth data/readings, restore malformed reading data, and accept stale async results.
- Accessibility intent is present, but tab/radio keyboard behavior, modal focus management, and movement announcements have no implementation or automated gate.

### Baseline checks run

- Production Vite bundle: **passes**.
- Interpretation pipeline smoke scenarios: **all pass**, including the 26-call referee path. This confirms the current behavior; it does not make the behavior acceptable.
- Python test suite: **not run in this environment** because `pytest` is not installed. This is an environment gap, not a passing signal.
- Current entry screen: **visually inspected**. It immediately asks for birth data and offers no privacy, retention, source, sample-reading, pricing, or reader-authority context before collection.

### Claims that need nuance before becoming requirements

1. **Licensing trigger:** Astrodienst's current materials say a license model must be chosen before a public service is activated, not merely before the first paid portrait. The existing “buy before first payment” decision is therefore not the complete gate. Legal review should confirm either present AGPL compliance or acquisition of the professional license.
2. **Privacy classification:** exact birth date/time/place is highly identifying in combination and can be personal data when it relates to an identifiable person, but “directly identifying in every case” is too absolute. Build for the higher-risk case and have counsel confirm scope, lawful basis, geography, and whether the generated portrait is profiling.
3. **Membership subject:** a payment processor can technically create a customer without app auth, but the intended StarGlass membership—saved readings, notes, entitlements, quotas, deletion, and cross-device return—cannot be operated safely without durable application identity and authorization.
4. **Job IDs:** permissive UUID syntax is worth fixing, but the deeper issue is bearer-only access with no ownership, expiry, or deletion. Random UUIDs reduce guessability; they do not supply authorization.
5. **Codex hedge count:** the content is plainly over-assertive in places, but the quoted “33 hedge tokens” is not a reproducible quality metric until the team defines a linguistic rubric. Use a content classifier plus human review, not a raw word count.
6. **Single source does not mean a 63k-word prompt:** compile one versioned interpretive source into purpose-specific artifacts. The UI may retrieve static entries; the composer should retrieve only relevant canonical fragments plus the complete synthesis/voice rules.

---

## 3. Ownership model

The labels below name a suggested driver, not a silo.

| Label | Suggested driver | Accountable contribution |
|---|---|---|
| **KR** | Krystel | Product policy, reader promise, legal/vendor decisions, final release approval |
| **CF** | Claude Fable | Interpretive canon, voice, care language, content migration, qualitative evaluation |
| **CX** | Codex | Architecture, implementation, automated verification, security/reliability instrumentation |
| **ALL** | All three | Scope decisions, acceptance review, release-gate sign-off |
| **EXT** | External specialist | Legal advice, privacy review, independent security/accessibility validation when required |

Sizing is relative: **XS** hours, **S** up to a few days, **M** roughly a sprint, **L** multiple sprints, **XL** program-level.

---

## 4. Ordered backlog

### Wave 0 — contain current exposure and establish facts

These items are sequentially first even when another feature feels more visible.

#### SG-000 — Confirm production exposure and choose the temporary launch posture

- **Status (2026-08-11):** current primary Netlify deploy is gated and its HTTP matrix is verified; retirement or independent protection of 27 pre-gate deploy artifacts, traffic, Blobs, AI usage/spend, Render dashboard facts, and live generation-toggle proof remain pending. See `docs/SG-000-PRIVATE-PREVIEW-POSTURE-2026-08-11.md`.
- **Priority / size / driver:** P0 / S / KR + CX
- **Depends on:** none
- **Outcome:** know what is actually live and prevent the open risks from growing during remediation.
- **Verify first:** production URLs; whether Netlify and Render are serving `main`; current traffic; Blobs object count/age; AI Gateway usage and spend; active environment variables; deploy-branch rules; whether any real customer data is present.
- **Implement:** an environment-controlled `PUBLIC_GENERATION_ENABLED` or invite-access gate; a clear maintenance state; no secret embedded client-side; after Krystel explicitly approves destructive deploy-history cleanup, delete ready Netlify artifacts lacking an Edge function while retaining the four verified gated rollback deploys.
- **Acceptance:** the team has a dated exposure inventory and can disable new generation without redeploying code or losing already-authorized recovery access.
- **Evidence:** screenshot/export of provider settings and a synthetic request proving enabled/disabled behavior.

#### SG-001 — Make a legally reviewed Swiss Ephemeris license election now

- **Decision owner (2026-08-11):** Krystel will confirm the applicable licensing requirement and timing; election and evidence remain pending.
- **Priority / size / driver:** P0 / S + external review / KR + EXT
- **Depends on:** SG-000
- **Outcome:** the currently public service has a defensible license posture.
- **Verify first:** deployed package/version; exact code linked to `pyswisseph`; public-repository status; whether the deployed source matches the published source; applicable Astrodienst contract/version.
- **Implement, AGPL path:** repository license grant, copyright/legal notices, complete corresponding-source access, prominent source link, and a release check that deployed code matches the offered source.
- **Implement, professional path:** execute and record the license outside the public repo, then update the decision record and notices to match the signed terms.
- **Acceptance:** counsel/owner records the chosen path and every required notice/source obligation is testable in the deployed product.
- **Important:** adding `LICENSE` alone is not legal sign-off.

#### SG-002 — Produce the data-flow and processor inventory

- **Priority / size / driver:** P0 / S / KR + CX + EXT
- **Depends on:** SG-000
- **Outcome:** one accurate description of what is collected, transmitted, stored, logged, retained, and deleted.
- **Verify first:** browser → Open-Meteo geocoding; browser → Render chart engine; browser → Netlify function; Netlify → LLM/AI Gateway; Blobs; Netlify/Render/function logs; analytics if added; local/session storage.
- **Record for each field:** purpose, lawful basis candidate, processor, region, encryption, retention, access, deletion mechanism, and whether raw birth data is necessary after chart calculation.
- **Acceptance:** every data path has an owner and retention rule; `DEPLOY.md`, privacy copy, and implementation use the same inventory.

#### SG-003 — Stop indefinite, ownerless portrait storage

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-002
- **Outcome:** anonymous jobs expire and can be erased before account identity exists.
- **Verify first:** object count, oldest object, actual Blobs retention behavior, and whether failed/working jobs accumulate.
- **Implement:** strict UUID parsing; a separate high-entropy retrieval/deletion capability or signed token; `createdAt`, `expiresAt`, and terminal status; expiry enforcement on read; scheduled or lazy deletion; explicit delete endpoint; tombstoning of abandoned `working` jobs.
- **Acceptance:** expired/erased jobs cannot be retrieved; deletion is idempotent; queued/working/error/ready records all expire; no public list operation exists.
- **Tests:** create/read/delete/expired/forged-token/foreign-token/abandoned-job cases.

#### SG-004 — Eliminate SVG injection and unsafe renderer inputs

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** none
- **Outcome:** `/wheel` returns inert, valid SVG for all accepted inputs.
- **Verify first:** demonstrate current injection with title, subtitle, theme color, palette color, and font values in both direct SVG response and React insertion.
- **Implement:** XML-escape all text; serialize attributes through one safe helper; allow only normalized hex/rgb(a) colors or an intentionally narrow token grammar; remove caller-controlled font strings or use an allowlist; constrain title/subtitle/theme lengths and character sets; consider server-side sanitization as defense in depth.
- **Acceptance:** event handlers, tags, scripts, external URLs, CSS escapes, and malformed attributes cannot enter output; CSP is not the only control.
- **Tests:** malicious payload corpus plus XML parser/snapshot checks.

#### SG-005 — Correct degree/minute carry in the wheel

- **Priority / size / driver:** P0 / XS / CX
- **Depends on:** none
- **Outcome:** wheel, tables, API JSON, screen, and report show the same position.
- **Implement:** reuse one formatting primitive based on total rounded arc minutes rather than duplicating the old calculation in `draw_chart.py`.
- **Acceptance:** `10.9917 → 11°00′ Aries`, `29.9999 → 0°00′ Taurus`, and `359.9999 → 0°00′ Aries` everywhere.
- **Tests:** renderer assertions for within-degree, sign-boundary, and zodiac-wrap carry.

#### SG-006 — Correct public documentation immediately

- **Priority / size / driver:** P0 / XS / KR + CX
- **Depends on:** SG-002
- **Outcome:** setup and data claims are not materially false.
- **Implement:** replace `DEFAULT_ENGINE` instructions with `VITE_ENGINE_URL`; replace “Nothing is stored” with current Blobs behavior and temporary retention; accurately distinguish the stateless chart engine from the stateful portrait service; link legal/source pages.
- **Acceptance:** a clean deploy following only `README.md` and `DEPLOY.md` uses the intended engine, and every storage statement matches production.

#### SG-007 — Add a hard spend/abuse kill switch

- **Priority / size / driver:** P0 / S / KR + CX
- **Depends on:** SG-000
- **Outcome:** no traffic pattern can create uncontrolled inference spend while identity and quotas are absent.
- **Verify first:** provider-side budgets, alerts, current function rate-limit enforcement in deploy logs, and maximum concurrent background jobs.
- **Implement:** provider budget alert/cap where supported; environment kill switch checked before job creation; conservative domain/IP limit; maximum in-flight work; generic rejection response; operational runbook.
- **Acceptance:** the team can prove generation stops at the configured threshold and receives an alert before the hard stop.

#### SG-008 — Establish a reproducible baseline gate

- **Priority / size / driver:** P0 / S / CX
- **Depends on:** none
- **Outcome:** all later fixes start from a runnable, pinned local/CI baseline.
- **Implement:** add `pytest` to a pinned dev/test dependency set; document one command for Python, web build, TypeScript, and interpretation smoke tests; capture expected versions.
- **Acceptance:** a clean checkout runs the baseline without global packages or network-dependent package-manager self-repair.

---

### Wave 1 — make deterministic output, APIs, and delivery trustworthy

#### SG-100 — Replace fabricated angle speeds

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-008
- **Outcome:** applying/separating labels for angle contacts are mathematically supportable.
- **Verify first:** select authoritative numerical method and tolerance for instantaneous ASC/MC motion, including wraparound and high latitudes.
- **Implement:** calculate angle motion via a documented finite-difference or supported ephemeris method; alternatively suppress applying/separating for angles until valid motion exists.
- **Acceptance:** no angle receives a synthetic `0.0`; planet-planet behavior remains unchanged; golden cases agree with independent calculations.
- **Tests:** applying, separating, stationary-looking, wraparound, DST-adjacent, and polar cases.

#### SG-101 — Make civil-time ambiguity explicit

- **Priority / size / driver:** P0 / M / KR + CX
- **Depends on:** SG-008
- **Outcome:** the reader knows which real instant was used.
- **Implement:** validate IANA time zones; detect nonexistent spring-forward times and reject with a corrective message; detect repeated fall-back times and require `fold`/first-or-second occurrence; persist both local input and effective UTC offset/instant.
- **Acceptance:** `2021-11-07 01:30 America/New_York` cannot calculate without a branch choice; the two choices yield distinct UTC instants and charts; nonexistent times never silently normalize.
- **Tests:** multiple zones, historical offsets, half-hour zones, folds, gaps, and raw-offset mode.

#### SG-102 — Report the effective house system at polar latitudes

- **Priority / size / driver:** P0 / S / CX
- **Depends on:** SG-008
- **Outcome:** labels describe the house calculation actually used.
- **Implement:** explicitly detect unsupported/degenerate requested systems before or after the Swiss call; either fail clearly or record `requested`, `effective`, and `coerced_settings` exactly as Vedic mode does.
- **Acceptance:** Tromsø/Placidus cannot return Porphyry geometry labelled Placidus; UI and apparatus derive from effective settings.
- **Tests:** northern/southern polar examples and normal-latitude non-regression.

#### SG-103 — Make ephemeris provenance and health truthful

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-008
- **Outcome:** precision mode and degraded operation are observable.
- **Implement:** request the intended Swiss Ephemeris flag; inspect the returned flag/source for each body; decide fail-closed versus explicit Moshier degradation; include engine/library/data versions in chart metadata; make `/health` import and calculate a known fixture and fail when required data are absent.
- **Acceptance:** a missing/corrupt ephemeris cannot produce `ok: true` plus an unconditional “Swiss Ephemeris” label; Chiron behavior remains explicit.
- **Tests:** data present, data missing, corrupt file, unsupported date range, and known-position smoke check.

#### SG-104 — Fix scarcest-element ties in report tables

- **Priority / size / driver:** P1 / XS / CX
- **Depends on:** SG-008
- **Outcome:** apparatus preserves all tied elements.
- **Implement:** return/display `scarcest_elements` as a set/list, or apply and disclose a domain-approved tie rule.
- **Acceptance:** fire 1 / water 1 reports both; ordering is deterministic.

#### SG-105 — Strictly validate API inputs and fail safely

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-004, SG-008
- **Outcome:** malformed input produces bounded 4xx responses, never trace/path leakage or uncontrolled work.
- **Implement:** strict chart schemas; reject unknown/oversized structures; validate date, time, time zone, chart block, body names, theme names, sections, and nested palette values; catch timeouts and JSON/parser errors; map internal failures to stable public error codes; log sanitized correlation IDs server-side.
- **Acceptance:** no stderr, absolute path, package version, stack trace, or secret appears in a client response.
- **Tests:** fuzzed/oversized payloads, timeout simulation, missing nested keys, invalid chart block, and unsupported settings.

#### SG-106 — Remove mutable global palette state

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-004
- **Outcome:** concurrent wheels cannot mix brands.
- **Implement:** construct an immutable renderer theme per request and pass it through rendering functions; do not mutate module globals. A lock is acceptable only as a short-term containment measure.
- **Acceptance:** high-concurrency tests return byte-consistent palettes with no cross-request tokens.

#### SG-107 — Harden the public engine boundary

- **Policy decision (2026-08-11):** approved by Krystel—production Render calculation endpoints should be consumable only through Star Glass, not as an unauthenticated public API.
- **Status (2026-08-11):** complete and production-verified. Browser traffic is same-origin, Netlify holds the service credential, Render denies unauthenticated calculations before body parsing, wildcard CORS is absent, and synthetic chart/wheel requests passed through the gated proxy. See `docs/SG-107-ENGINE-BOUNDARY-2026-08-11.md`.
- **Sprint / priority / size / driver:** next sprint / P0 / M / CX; KR approves the intended access policy
- **Depends on:** SG-000 for immediate containment; SG-105 for durable boundary completion
- **Original exposure (before remediation):** the browser defaulted to `https://star-glass-engine.onrender.com`; Render was contacted directly, allowed wildcard browser origins, and had no caller authentication for `/chart`, `/wheel`, or `/tables`. The Netlify preview phrase did not cover that hostname.
- **Data crossing the boundary:** birth date, local birth time, time zone, latitude, longitude, zodiac/house settings, and—on renderer calls—calculated chart content plus caller-controlled titles, subtitles, body highlights, and palette values.
- **Why we care:**
  - a visitor can bypass the private-preview UI, its notices, and its access gate and send birth data directly to Render;
  - third parties can consume compute, force free-tier wakeups, enumerate behavior, and create avoidable latency, outage, log volume, or future cost;
  - unique-input bursts can evade a naive cache and drive repeated subprocess work before identity, quotas, and operational alerts exist;
  - a public calculation endpoint weakens the claim that this is a wholly private test and makes the timing of the Swiss Ephemeris licensing decision a current question, not merely a checkout question;
  - wildcard CORS lets any website call the engine from a visitor's browser, but changing CORS alone is **not** access control—scripts, servers, and command-line clients do not obey browser CORS policy;
  - birth details may appear in provider request logs or diagnostics even though repository application code does not persist them.
- **Recommended containment architecture:** make the browser call same-origin Netlify routes such as `/api/engine/chart`, `/api/engine/wheel`, and `/api/engine/tables`; have the Netlify server attach a separate high-entropy service credential; require and verify that credential on Render before parsing request bodies or starting calculation; remove the Render hostname from the production browser bundle. Keep the credential out of all `VITE_*` variables and client responses. Decide separately whether `/health` remains public and information-minimal.
- **Hardening delivered with containment:** route-specific method/content-type/body-size limits; explicit timeouts and concurrency ceilings; gateway rate limiting; sanitized correlation-only logs; disabled API documentation; and minimal health.
- **Remaining durable work:** SG-105 must finish strict nested chart/render schemas and stable public error codes; add the cache strategy and operational telemetry needed to prove high-cardinality traffic cannot turn into subprocess exhaustion; profile whether calculation should ultimately move in-process or onto a private network service.
- **Acceptance:**
  - production browser code contains no Render hostname or service credential;
  - a gated tester can cast a chart and render a wheel through the same-origin proxy;
  - anonymous Netlify requests are stopped by the preview gate;
  - direct Render calls to `/chart`, `/wheel`, and `/tables` without the service credential return `401` or `403` before body parsing or subprocess work;
  - wildcard CORS is absent in production, and the accepted origin/method/header policy is tested;
  - oversized, slow, high-concurrency, and high-cardinality requests are bounded before expensive work;
  - neither the service credential nor raw birth payloads appear in application logs or client-visible errors.
- **Evidence:** bundle search for the Render hostname/credential; automated proxy/auth/CORS/limit tests; paired synthetic requests proving same-origin success and direct-origin denial; Render/Netlify log excerpts showing denial before calculation; traffic, latency, restart, and resource graphs before/after containment.
- **Rollback:** retain the previous Render URL only as a private operator value, never as a client fallback. If the proxy fails, pause chart creation with a clear maintenance state rather than silently restoring public direct access.

#### SG-108 — Expand deterministic tests across every shipped surface

- **Priority / size / driver:** P0 / L / CX
- **Depends on:** SG-100–SG-107
- **Outcome:** the trust gate covers what readers actually see.
- **Implement:** tests for `draw_chart.py`, `chart_tables.py`, and every FastAPI endpoint; replace tautological DST/polar tests with expected outcomes; add cross-surface contract fixtures asserting JSON/table/SVG agreement.
- **Acceptance:** each corrected production defect has a failing-before/passing-after regression test; API tests use `TestClient`; renderer tests parse SVG rather than string-search only.

#### SG-109 — Add TypeScript, lint, component, and function checks

- **Priority / size / driver:** P1 / M / CX
- **Depends on:** SG-008
- **Outcome:** Vite's successful transpilation is no longer mistaken for correctness.
- **Implement:** pin TypeScript; include `src` and `netlify/functions`; add `tsc --noEmit`; ESLint; component/unit tests; interpretation/status function tests; one build/check command.
- **Acceptance:** intentionally introduced type, hook, and schema errors fail CI and block deploy.

#### SG-110 — Add security headers and verify the rendered policy

- **Priority / size / driver:** P1 / S / CX
- **Depends on:** SG-004
- **Outcome:** browser defense in depth matches the actual asset/API needs.
- **Implement:** CSP with narrow `connect-src`, `img-src`, `font-src`, and no unsafe script execution; `frame-ancestors`; HSTS; Permissions-Policy; Referrer-Policy; explicit SVG content handling.
- **Acceptance:** headers are present on production and previews; app flows still work; a CSP-report-only observation precedes enforcement if needed.

---

### Wave 2 — create one interpretive system and a real care/trust gate

#### SG-200 — Define the canonical interpretive schema

- **Priority / size / driver:** P0 / L / ALL (CF content, CX compiler)
- **Depends on:** SG-008
- **Outcome:** every interpretive artifact declares the same concepts, voice constraints, synthesis rules, modes, provenance, and version.
- **Implement:** typed schemas for canon entries, synthesis rules, voice exemplars, mode rules, report structure, care rules, and cross-links; validate all 312 entries and 612 edges at build time.
- **Acceptance:** one canonical source tree compiles successfully or fails with actionable file/entry errors; manual copies are removed from runtime code.

#### SG-201 — Build a versioned interpretive compiler

- **Priority / size / driver:** P0 / L / CX + CF
- **Depends on:** SG-200
- **Outcome:** the skill, web composer, Codex, and report consume generated artifacts from one source.
- **Implement:** compile purpose-specific artifacts: full skill/reference bundle, compact composer system prompt, static Codex JSON, report template/schema, care/audit rules, content manifest/hash.
- **Acceptance:** editing a canonical rule changes every dependent artifact in one build; CI fails on generated drift; generated files are reproducible.

#### SG-202 — Retrieve relevant Codex evidence for composition

- **Priority / size / driver:** P1 / L / CX + CF
- **Depends on:** SG-201
- **Outcome:** the portrait and Codex cannot contradict each other through ignorance.
- **Implement:** deterministic chart-to-entry selection; retrieve only relevant placement/canon fragments; include stable entry IDs and content version in the composer ledger; define precedence when reference rules and authored prose differ.
- **Acceptance:** a portrait can trace each canonical interpretive input to IDs/version without placing the full 63k words in every model call.

#### SG-203 — Replace Codex placement concatenation with synthesis

- **Priority / size / driver:** P1 / M / CF + CX
- **Depends on:** SG-200
- **Outcome:** opening “planet in sign, house” produces an integrated reading rather than two adjacent lookup essays.
- **Implement options:** author compiled synthesis seams; generate at build time under the same synthesis rules; or present clearly separated reference facets while reserving synthesis for the portrait. Choose one explicitly.
- **Acceptance:** the Codex no longer presents concatenation as synthesis; output is deterministic, versioned, and care-reviewed.

#### SG-204 — Make the report template a compiled product contract

- **Priority / size / driver:** P1 / M / CF + CX
- **Depends on:** SG-201
- **Outcome:** screen, print report, schema, and prose instructions share one movement/report structure.
- **Acceptance:** section order, labels, framing, audit provenance, apparatus, and colophon are generated or validated against the same template version.

#### SG-205 — Attach provenance to every chart and portrait

- **Priority / size / driver:** P1 / S / CX
- **Depends on:** SG-103, SG-201
- **Outcome:** any saved output can be reproduced and compared after system evolution.
- **Record:** calculator version, ephemeris source/version, input/effective settings, interpretive bundle hash, model identifiers, prompt/schema versions, audit outcome, creation time, and correction count—without logging raw sensitive content unnecessarily.
- **Acceptance:** support can answer “what produced this?” from the saved record alone.

#### SG-206 — Approve and encode the care clause

- **Priority / size / driver:** P0 / M / KR + CF
- **Depends on:** SG-200
- **Outcome:** psychological interpretation is offered as a hypothesis/invitation, never fabricated biography.
- **Define:** allowed certainty; prohibited narrated history; treatment of parents/childhood/trauma/relationships; diagnostic and crisis boundaries; “may fit / may not fit” language; user override; age policy; escalation/help language if needed.
- **Acceptance:** the policy contains positive and negative examples for portrait, Codex, framing, invitations, marketing, and support.

#### SG-207 — Make `framing` an explicit reader-authority contract

- **Priority / size / driver:** P0 / S / CF + CX
- **Depends on:** SG-206
- **Outcome:** the first sentence establishes symbolic scope and reader authority before interpretive claims.
- **Implement:** composer instruction, schema constraints, content lint, and UI placement before movement prose.
- **Acceptance:** framing states that the chart is a symbolic lens, invites testing against lived experience, and makes non-fit legitimate without turning into generic legalese.

#### SG-208 — Add reader response controls and durable semantics

- **Priority / size / driver:** P1 / M / KR + CF + CX
- **Depends on:** SG-206; durable storage integration later depends on SG-302
- **Outcome:** readers can mark `Resonates`, `Partly`, or `Doesn't fit` at movement/claim level and add a note.
- **Implement initially:** privacy-preserving local state and export; define stable feedback schema now so it migrates cleanly to accounts later.
- **Acceptance:** “Doesn't fit” never becomes an error state or forces justification; controls are keyboard/screen-reader usable; the product explains whether feedback is local or transmitted.

#### SG-209 — Care-migrate and lint the Codex

- **Priority / size / driver:** P0 / XL / CF (CX tooling, KR approval)
- **Depends on:** SG-206
- **Outcome:** 312 entries no longer assert invented childhood or fixed identity as fact.
- **Implement:** automated candidate detection for declarative identity, past-tense biography, diagnosis, inevitability, parent blame, and threat; human editorial pass; content snapshots and reviewer notes.
- **Acceptance:** every entry receives a care-review status; high-risk sentences are rewritten; regression lint blocks new violations; quality is judged by rubric and human review, not hedge-token count.

#### SG-210 — Make audit corrections movement-scoped and transactional

- **Priority / size / driver:** P0 / L / CX
- **Depends on:** SG-109, SG-206
- **Outcome:** a correction changes only the audited claim and every published status is earned.
- **Implement:** correction paths/IDs or movement-local exact spans; reject ambiguous matches; revalidate schema; final full re-audit after the last applied or unlocatable correction; fail closed on unresolved concrete contradictions.
- **Acceptance:** global `replaceAll` is gone; an unlocatable correction cannot publish as verified; duplicate/repeated imagery does not cause cross-movement edits.
- **Tests:** duplicate prose across movements/title, smart quotes, already-repaired spans, conflicting auditors, zero applicable corrections, schema breakage, and referee outcomes.

#### SG-211 — Separate calculation verification, care review, and referee status

- **Priority / size / driver:** P0 / M / ALL
- **Depends on:** SG-206, SG-210
- **Outcome:** one `verified` boolean no longer overclaims what was checked.
- **Model:** `calculation_status`, `care_status`, `resolution` (`verified`, `corrected`, `refereed`, `held`), passes, versions, and visible plain-language explanation.
- **Acceptance:** the UI never says “every claim verified” when only geometry was checked; refereed output is visibly distinct but not alarmist; held output never publishes.

#### SG-212 — Build a human-reviewed interpretation evaluation set

- **Priority / size / driver:** P1 / L / ALL
- **Depends on:** SG-206, SG-211
- **Outcome:** quality changes are measured against factuality, synthesis, voice, care, contradiction, usefulness, and non-fit handling.
- **Implement:** diverse golden charts, adversarial patterns, DST/polar/mode cases, repeated-image cases, sensitive family/trauma language, and explicit reviewer scoring anchors.
- **Acceptance:** prompt/model/content changes require evaluation results and named human review before release.

---

### Wave 3 — build durable identity, authorization, and data rights

#### SG-300 — Decide identity and tenancy architecture

- **Priority / size / driver:** P0 for membership / M / KR + CX
- **Depends on:** SG-002, approved privacy posture
- **Outcome:** a stable subject exists for saved data, entitlements, quotas, support, and deletion.
- **Decide:** magic link/passkey/social options; anonymous-to-account migration; session duration; recovery; single-region/multi-region needs; vendor and DPA; separation of authentication from billing identity.
- **Acceptance:** architecture decision record includes threat model, data residency, vendor exit path, and explicit non-goals.

#### SG-301 — Define the minimum data model and retention classes

- **Priority / size / driver:** P0 / M / CX + KR
- **Depends on:** SG-300
- **Outcome:** storage follows product purpose instead of mirroring frontend objects.
- **Entities:** user/profile, birth input, calculated chart, portrait/version, notes, feedback, job, entitlement, deletion request, consent/policy version, and audit/security event.
- **Design rule:** separate raw birth data from derived chart/portrait so the user can delete or minimize one class without corrupting unrelated records.
- **Acceptance:** every table/object has owner key, retention, encryption classification, deletion cascade, and migration strategy.

#### SG-302 — Implement authentication and secure sessions

- **Priority / size / driver:** P0 / L / CX
- **Depends on:** SG-300, SG-301
- **Outcome:** readers can sign in, recover access, and safely move between devices.
- **Acceptance:** secure cookie/session handling; CSRF strategy; rate-limited login/recovery; session revocation; no auth tokens in localStorage; accessible auth errors; test accounts isolated from production.

#### SG-303 — Enforce server-side object authorization

- **Priority / size / driver:** P0 / L / CX
- **Depends on:** SG-302
- **Outcome:** guessing or possessing another job/reading ID is insufficient.
- **Implement:** owner-scoped queries/policies; job creation binds owner/anonymous capability; all get/update/delete paths authorize; support access is explicit and audited.
- **Tests:** horizontal privilege escalation across every object and endpoint.

#### SG-304 — Implement full retention, export, and deletion workflows

- **Priority / size / driver:** P0 / L / KR + CX + EXT
- **Depends on:** SG-301, SG-303
- **Outcome:** policy promises are executable.
- **Implement:** account export; delete portrait/chart/note; delete account; processor propagation where applicable; grace/backup policy; verified request handling; completion receipt.
- **Acceptance:** automated integration test proves the documented cascade and time bound; exceptions are recorded and counsel-approved.

#### SG-305 — Migrate and validate local sessions safely

- **Priority / size / driver:** P1 / M / CX
- **Depends on:** SG-301, SG-302
- **Outcome:** existing local readers can opt into an account without stale/malformed data poisoning it.
- **Implement:** runtime schema validation and versioning; import preview; explicit consent; deduplication; clear-local-data control; reject mismatched chart/reading pairs.
- **Acceptance:** malformed and old sessions recover to a safe screen; import never silently overwrites server data.

#### SG-306 — Deliver saved readings, notes, and the Notice return loop

- **Priority / size / driver:** P1 / L / ALL
- **Depends on:** SG-303–SG-305, SG-208
- **Outcome:** Cast → Read → Investigate ⇄ Experiment → Notice → Return exists across devices.
- **Acceptance:** users can find, resume, annotate, export, and delete readings; notes expose sync state and conflict handling; product never claims server persistence while only writing locally.

#### SG-307 — Publish counsel-reviewed privacy, terms, consent, and support surfaces

- **Priority / size / driver:** P0 before public beta / M + external review / KR + EXT
- **Depends on:** SG-002; update after SG-301 and payment design
- **Outcome:** people understand processing before providing data.
- **Cover:** collected/derived data; purposes and lawful basis; processors/recipients; geocoding-as-you-type; LLM and hosting transfers; retention; rights/deletion; account and billing; age policy; cookies/local storage; security limits; symbolic/non-clinical scope; support contact; policy versions.
- **Acceptance:** concise notice appears before birth-place transmission; full policies are accessible from every relevant screen; consent is granular where required and not bundled into unrelated terms.

---

### Wave 4 — instrument unit economics, then entitlements and billing

#### SG-400 — Define a privacy-safe product telemetry contract

- **Priority / size / driver:** P0 before pricing / M / KR + CX
- **Depends on:** SG-002, SG-307
- **Outcome:** funnel and reliability can be measured without copying birth data or portrait prose into analytics.
- **Events:** landing viewed, sample opened, cast started/completed/failed, compose started/phase/terminal, movement progressed, feedback selected, report/share/export, account conversion, checkout, renewal/cancel, deletion.
- **Acceptance:** event dictionary defines purpose, allowed properties, retention, consent category, owner, and decision it supports; sensitive fields are prohibited by test/lint.

#### SG-401 — Add error tracking, structured logs, and uptime checks

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-002, SG-307
- **Outcome:** client, Netlify, LLM pipeline, and Render failures are visible and correlated.
- **Implement:** privacy-filtered client error boundary reporting; structured server logs with request/job correlation; synthetic `/health` and end-to-end canary; alerts for error rate, stuck jobs, latency, and ephemeris degradation.
- **Acceptance:** a synthetic failure produces one traceable incident without leaking birth/chart/portrait payloads.

#### SG-402 — Measure per-portrait cost and latency by stage

- **Priority / size / driver:** P0 before pricing / M / CX
- **Depends on:** SG-400, SG-401, SG-205
- **Outcome:** pricing and quotas use measured distributions, not the theoretical 26-call maximum alone.
- **Measure:** tokens, model, retries, audit passes, referee use, Netlify compute, duration, failures, abandoned jobs, and cost percentiles.
- **Acceptance:** dashboard shows p50/p90/p99 cost and latency, success rate, and cost by pipeline version without storing prose.

#### SG-403 — Re-architect generation as an idempotent bounded workflow

- **Priority / size / driver:** P0 before public beta / L / CX
- **Depends on:** SG-210–SG-212, SG-402
- **Outcome:** jobs cannot stay `working` forever or exceed platform execution limits invisibly.
- **Implement:** stage-level state machine/queue; idempotency keys; bounded retries; per-stage deadlines below platform limits; heartbeat and stale-job terminalizer; cancellation; restart/resume; model-call budget; terminal error persistence.
- **Acceptance:** every accepted job reaches `ready`, `held`, `error`, `cancelled`, or `expired`; none remains working past its SLA; provider retries do not duplicate charges/output.

#### SG-404 — Reduce model-call amplification with measured safeguards

- **Priority / size / driver:** P1 / L / CF + CX
- **Depends on:** SG-212, SG-402, SG-403
- **Outcome:** trust quality is preserved while cost/latency fall.
- **Evaluate:** one structured full-reading audit versus six; selective audit by risk; deterministic ledger validators before LLM audit; lower-cost composer/model routing; capped repair/referee policy.
- **Acceptance:** chosen design meets factuality/care thresholds on the evaluation set and has a documented call/cost ceiling.

#### SG-405 — Build entitlements and quota enforcement

- **Priority / size / driver:** P0 for payment / L / CX
- **Depends on:** SG-303, SG-402, SG-403
- **Outcome:** product access is controlled independently from checkout UI.
- **Implement:** plan/entitlement model; atomic portrait credit/reservation; idempotent consumption/refund; account and abuse limits; staff/test grants; audit trail.
- **Acceptance:** payment-webhook retries and concurrent requests cannot double-grant or overspend; entitlement checks are server-side.

#### SG-406 — Decide pricing from target margin and observed behavior

- **Priority / size / driver:** P1 / M / KR + ALL
- **Depends on:** SG-402, initial funnel data from SG-400
- **Outcome:** price, free experience, and quota are economically coherent.
- **Decide:** one-off portrait vs membership; trial/sample; included portraits; saved-reading value; refund policy; target gross margin; support burden; model-cost sensitivity.
- **Acceptance:** decision record includes unit-cost percentiles, conversion assumptions, break-even range, and rollback/experiment criteria.

#### SG-407 — Integrate billing only after entitlements exist

- **Priority / size / driver:** P1 / L / KR + CX
- **Depends on:** SG-001, SG-307, SG-405, SG-406
- **Outcome:** checkout, subscription lifecycle, receipts, taxes, refunds, and access stay consistent.
- **Implement:** hosted checkout/customer portal where possible; signed/idempotent webhooks; subscription state reconciliation; failed-payment grace; cancel/reactivate/refund; support tooling.
- **Acceptance:** webhook replay/out-of-order events are safe; no client-supplied price or entitlement is trusted; test-to-live launch checklist is complete.

---

### Wave 5 — complete the public product experience

#### SG-500 — Add routing and a real pre-data front door

- **Priority / size / driver:** P1 / L / KR + CF + CX
- **Depends on:** SG-207, SG-307, pricing direction
- **Outcome:** a stranger can understand and trust StarGlass before giving exact birth information.
- **Routes:** home, sample, cast, reading/library, Codex/about-method, pricing, FAQ, privacy, terms, support, account.
- **Acceptance:** home explains the calculated-versus-interpretive split, symbolic scope, data handling, expected wait, and next action without requiring a chart cast.

#### SG-501 — Publish a representative sample reading

- **Priority / size / driver:** P1 / M / CF + KR
- **Depends on:** SG-206–SG-212
- **Outcome:** prospects can judge depth, care, apparatus, and audit language before collection/payment.
- **Acceptance:** sample uses fictional/publicly consented data, is marked as a sample, shows the care/framing/audit model, and does not expose a real person's sensitive data.

#### SG-502 — Add share metadata, favicon, manifest, and indexability rules

- **Priority / size / driver:** P2 / S / CX + KR
- **Depends on:** SG-500
- **Outcome:** public pages share intentionally while private readings do not leak metadata.
- **Acceptance:** OG/Twitter preview works for public routes; reading/account routes are noindex and never place birth details or portrait text in metadata.

#### SG-503 — Make async chart/portrait state race-safe

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-109, SG-403
- **Outcome:** chart A can never render or persist beside portrait B.
- **Implement:** AbortController plus generation/job identity; ignore stale completions; cancel on recast/edit/logout; bind reading to chart hash and bundle version.
- **Acceptance:** deterministic rapid-recast tests prove stale work is discarded and never stored.

#### SG-504 — Add resilient session validation and user recovery

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-109
- **Outcome:** corrupt local state cannot create a permanent white screen or retain another person's birth data unexpectedly.
- **Implement:** runtime schema/version validation; error boundary; clear-current-reading and clear-all-local-data controls; edit/recast clears or explicitly retains by choice; safe migration/fallback screen.
- **Acceptance:** malformed JSON and structurally invalid reading/chart fixtures recover without developer tools.

#### SG-505 — Make wheel, polling, resume, and report failures explicit

- **Priority / size / driver:** P1 / M / CX
- **Depends on:** SG-403
- **Outcome:** loading, failed, retryable, expired, and ready are distinct states.
- **Implement:** wheel error with retry; `Retry-After`/exponential backoff and jitter for 429/5xx; one shared job lifetime; server-authored deadlines; report waits for required wheels or clearly omits them; cancellation and retry controls.
- **Acceptance:** no infinite “Drawing…” state, retry storm, or silently incomplete printout.

#### SG-506 — Complete keyboard, focus, announcement, and semantic behavior

- **Priority / size / driver:** P0 before public beta / L / CX + independent review
- **Depends on:** SG-109
- **Outcome:** the core flow is usable by keyboard and assistive technology.
- **Implement:** tabs with arrow/Home/End and roving tabindex; radiogroups with arrow behavior; modal initial focus, trap, inert background, Escape, and focus restore; live announcements for movement/async state; unique keys; table/heading/error semantics; target sizes and visible focus.
- **Verify:** keyboard walkthrough, screen reader, zoom/reflow, reduced motion, contrast across every theme, mobile viewport.
- **Acceptance:** automated axe-style checks plus documented manual results; do not claim full WCAG compliance from automation alone.

#### SG-507 — Validate visual hierarchy and trust copy across the full journey

- **Priority / size / driver:** P1 / M / KR + CF + CX
- **Depends on:** SG-500–SG-506
- **Outcome:** the crafted reading experience survives new legal, account, billing, error, and feedback layers.
- **Flow:** landing → sample → data notice → cast → wait → reading → Codex → feedback/notes → report/share → return.
- **Acceptance:** screenshot-backed desktop/mobile/theme audit; each step has a clear primary action, reassurance, error recovery, and no contradictory data/persistence claim.

---

### Wave 6 — make releases governable

#### SG-600 — Gate production deploys on CI

- **Priority / size / driver:** P0 / M / CX
- **Depends on:** SG-108, SG-109
- **Outcome:** a red gate cannot auto-publish.
- **Implement:** protected branch; required Python/web/security/content-generation checks; Netlify deploy previews; Render deploy only from approved commit/tag; lockfile enforcement.
- **Acceptance:** a deliberately failing check cannot reach production.

#### SG-601 — Add staging, release manifests, and rollback drills

- **Priority / size / driver:** P1 / M / CX
- **Depends on:** SG-205, SG-600
- **Outcome:** frontend, engine, schemas, and interpretive bundle move as one compatible release.
- **Implement:** staging environment with synthetic data; compatibility/version checks; immutable release manifest; one-command/provider rollback documentation; database/content migration rollback policy.
- **Acceptance:** team completes and records a rollback drill without data loss.

#### SG-602 — Define SLOs, alerts, and incident runbooks

- **Priority / size / driver:** P1 / M / ALL
- **Depends on:** SG-401–SG-403
- **Outcome:** reliability and trust failures have owners and response thresholds.
- **Cover:** chart correctness, generation success/latency, stuck jobs, cost spike, auth failures, deletion failure, cross-user access, ephemeris degradation, content safety incident, and vendor outage.
- **Acceptance:** each alert has severity, owner, first actions, user communication, recovery, and post-incident review.

#### SG-603 — Add dependency, secret, and release hygiene

- **Priority / size / driver:** P1 / M / CX
- **Depends on:** SG-600
- **Outcome:** supply-chain and configuration drift are visible.
- **Implement:** dependency scanning; secret scanning; SBOM; pinned runtimes; environment schema; key rotation runbook; no production secrets in previews/logs; backup/restore verification where storage exists.
- **Acceptance:** critical findings block release or have an owner-approved time-bound exception.

---

## 5. Release gates

### Gate A — controlled preview may continue

All must be true:

- production exposure is known and generation can be disabled;
- license path is owner/counsel approved and implemented;
- wheel carry and SVG injection are fixed and tested;
- indefinite anonymous portrait retention is stopped;
- spend cap/kill switch and basic failure visibility exist;
- documentation no longer makes false storage/configuration claims.

### Gate B — public free beta

All Gate A items plus:

- deterministic/API/rendering fixes and cross-surface tests pass;
- privacy/terms/support and pre-geocoding notice are live;
- care clause, explicit framing, Codex care migration, and accurate audit states are live;
- jobs are bounded, terminal, and observable;
- critical keyboard/focus/error-recovery issues are resolved;
- public landing/sample explain the product before data collection.

### Gate C — first paid portrait

All Gate B items plus:

- chosen Swiss Ephemeris commercial/AGPL posture explicitly covers the paid deployment;
- authentication, authorization, retention, export, and deletion are complete;
- per-job costs and failure rates are measured;
- entitlements/quotas precede checkout;
- billing lifecycle, refund/support process, and legal copy pass test-to-live review.

### Gate D — recurring membership

All Gate C items plus:

- cross-device saved readings and notes are reliable;
- the Notice return loop is usable and measured;
- cancellations, grace periods, reactivation, deletion, and data export work end to end;
- retention value supports the subscription promise, not only access to repeated generation.

---

## 6. Critical path and parallel work

```text
SG-000 exposure
  ├─ SG-001 licensing ───────────────────────────────────────────────┐
  ├─ SG-002 data map → SG-003 retention → SG-307 legal surfaces ────┤
  ├─ SG-107 Render containment → SG-105/107 durable API boundary ───┤
  ├─ SG-004 SVG → SG-106 renderer isolation ────────────────────────┤
  ├─ SG-005 wheel truth                                             │
  └─ SG-007 spend stop                                              │
                                                                    ▼
SG-008 baseline → SG-100..110 deterministic/platform trust → Gate A/B

SG-200 canonical schema → SG-201 compiler → SG-202..205 one system
SG-206 care policy → SG-207..212 care + earned verification → Gate B

SG-300 identity → SG-301 data model → SG-302 auth → SG-303 authorization
                                      └→ SG-304..306 durable product

SG-400 telemetry → SG-401 observability → SG-402 unit cost
                                      └→ SG-403/404 bounded pipeline
SG-303 + SG-402/403 → SG-405 entitlements → SG-406 price → SG-407 billing → Gate C
```

Safe parallel lanes after SG-000/002/008:

- **CX:** deterministic/security fixes and tests;
- **CF + KR:** care clause, content rubric, and Codex migration preparation;
- **KR + EXT:** license/privacy decisions and processor documents;
- **ALL:** canonical-schema and evaluation-set acceptance.

Do not parallelize checkout ahead of identity/entitlements, or mass Codex rewriting ahead of the approved care rubric.

---

## 7. Definition of done for every backlog item

An item is not complete when code exists. It is complete when:

1. the precondition/claim was reproduced or explicitly disproved;
2. behavior and data contracts are documented;
3. automated tests cover the defect and main failure paths;
4. sensitive logs/analytics were inspected for data leakage;
5. accessibility and error recovery were checked when UI changed;
6. deploy/rollback implications are recorded;
7. user-facing documentation and policy copy match the behavior;
8. the suggested driver presents evidence and at least one of the other two team members reviews it;
9. every release-gate item receives all-three sign-off before the gate opens.

---

## 8. First implementation slice

The first slice should be deliberately small and provable:

1. SG-000 production exposure inventory and temporary generation gate.
2. **SG-107 complete:** direct browser access to Render removed, server-to-server authentication enforced, and unauthenticated denial proven in production.
3. SG-001 license election/compliance action; do not infer that the preview gate itself defers license obligations.
4. SG-005 wheel carry fix plus renderer regression tests.
5. SG-004 SVG escaping/validation plus malicious-payload tests.
6. SG-003 anonymous job expiry/deletion and abandoned-job terminalization.
7. SG-006 documentation corrections.
8. SG-007 spend kill switch/alerts.
9. SG-008 clean baseline command in CI-ready form.

Only after that slice is evidenced should the team open Wave 1 implementation broadly.

---

## 9. External facts requiring owner/legal confirmation

- [Astrodienst's licensing documentation](https://www.astro.com/swisseph/swisseph.htm) describes Swiss Ephemeris as dual-licensed and says the choice must be made before a public service is activated; its [current store](https://www.astro.com/swisseph/swephprice_e.htm) lists the unlimited professional license at CHF 700.
- [GNU AGPLv3 section 13](https://www.gnu.org/licenses/agpl-3.0.html#section13) requires a modified network-interactive program to offer corresponding source prominently to remote users.
- GDPR scope depends on identifiability, establishment/targeting, purpose, and processing context; [Article 4](https://eur-lex.europa.eu/eli/reg/2016/679/art_4/oj/eng) definitions, Article 13 transparency, [Article 17](https://eur-lex.europa.eu/eli/reg/2016/679/art_17/oj/eng) erasure, and Article 25 privacy-by-design are directly relevant if it applies.
- Netlify currently documents a [15-minute Background Function limit](https://docs.netlify.com/build/functions/background-functions/) and [application-managed expiration/deletion for Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/). The current theoretical pipeline can exceed that function window.

These facts guide the backlog but do not replace advice from counsel or confirmation in the project's actual provider accounts/contracts.
