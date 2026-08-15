# StarGlass — next builder handoff

**Prepared:** 2026-08-14
**Operating posture:** private preview; keep `STARGLASS_PREVIEW_GATE=on`
**Repository:** `thekrystelmethod/star-glass`, branch `main`

## Live production state

- Site: <https://star-glass.netlify.app>
- Current production commit: `f14e536566c9a85654a795840da90717765e3639`
- Current Netlify deploy: `6a7fddc8279069dd32a03882` (`ready`)
- The preview edge gate is present and anonymous requests to both `/` and
  `/api/interpret` return `401` with `x-starglass-preview: private-gate-v2`.
- `PUBLIC_GENERATION_ENABLED=true` in production. It remains `false` in dev,
  branch deploys, and deploy previews.
- Production Netlify has `SUPABASE_URL` and an encrypted
  `SUPABASE_SECRET_KEY`. Never expose, copy into source, or send the secret in
  chat. Do not replace it with a browser-safe publishable key.
- Supabase project: `StarGlass`, ref `ozfkwvlwgmvfayoaklla`, region
  `us-west-1`.

## What shipped

- Commit `a193e95` moved new portrait jobs from Netlify Blobs to the protected
  Supabase `public.portrait_jobs` table.
- The browser owns a 256-bit capability while Supabase stores only its SHA-256
  hash. Reads, updates, and deletes require the UUID plus that capability.
- Terminal jobs are hard-deleted after delivery; an hourly scheduled function
  purges expired rows.
- The SVG wheel renderer now escapes text, rejects invalid palette/font input,
  isolates request-local palettes, and correctly carries rounded minutes.
- Netlify deployed six functions: `engine-health`, `engine-proxy`, `interpret`,
  `interpret-status`, `myth-bank`, and `purge-portrait-jobs`. The preview edge
  function is present, and Netlify's deploy secret scan found zero matches.

Key files:

- `supabase/migrations/20260814233420_secure_portrait_jobs.sql`
- `web/netlify/functions/_shared/portrait-store.ts`
- `web/netlify/functions/interpret.ts`
- `web/netlify/functions/interpret-status.ts`
- `web/netlify/functions/purge-portrait-jobs.ts`
- `scripts/draw_chart.py`
- `api/main.py`
- `tests/test_svg_renderer.py`
- `web/test-portrait-security.mjs`

## Verification completed

- All six web smoke files passed, including portrait capability security.
- The Vite production build passed.
- Four SVG renderer unit tests passed.
- `git diff --check` passed before the security release.
- Direct production Supabase synthetic round trip passed: create `201`,
  authorized read returned exactly one row, delete `204`, and the database
  follow-up returned zero rows.
- Supabase Security Advisor currently returns no findings.
- RLS is enabled and forced; `anon` and `authenticated` cannot read the table;
  only the server role has table privileges.

The full Python suite is not yet reproducible from a clean checkout because
its test dependencies are not pinned. That is deliberately next-sprint work,
not evidence that it passed.

## First actions for the next builder

1. Keep the preview gate on. Sign into the live preview using the shared phrase
   supplied by the owner; Netlify masks it from agents, so do not rotate it just
   to automate a test.
2. Submit one controlled real chart through the browser and follow its portrait
   job through create → capability-authorized read → terminal deletion.
3. Confirm that delivered job has zero remaining rows in `portrait_jobs`, then
   check Netlify function logs and the Supabase Security Advisor again.
4. Verify the deployed wheel endpoint with malicious caption and color probes;
   captions must render as inert XML text and invalid colors must be rejected.
5. Inventory legacy `starglass-readings` Netlify Blob records. Do not delete or
   migrate them without explicit owner approval.

An automated live portrait-job attempt was intentionally stopped at the preview
gate: the credential available to authenticated tools is masked and correctly
failed login. The gate was not weakened or turned off to bypass this control.

## Next sprint priority 1 — reproducible release checks

Build the release baseline before adding more product surface:

- pin Python test dependencies and make the Python suite runnable from a clean
  checkout;
- add TypeScript checking, linting, component/function checks, and renderer/API
  tests;
- include Netlify functions and the Supabase adapter in the checked TypeScript
  scope;
- add cross-surface fixtures proving chart JSON, tables, and SVG agree;
- expose one local and CI command whose success is required before deployment.

## Next sprint priority 2 — one interpretive and care system

Then unify the skill, Codex, and portrait pipeline around one versioned source:

- compile purpose-specific artifacts rather than maintaining three handwritten
  copies;
- retrieve relevant canonical evidence for portrait composition;
- replace Codex sign/house concatenation with actual synthesis;
- encode reader authority and hypothesis language at the point of reading;
- add a meaningful “doesn't fit” response with durable semantics;
- care-migrate and lint authored Codex entries before broader release.

Do not start billing, membership, or public acquisition before these two
priorities and the remaining release gates are complete.
