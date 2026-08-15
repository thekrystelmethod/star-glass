# StarGlass — next sprint handoff

**Paused:** 2026-08-14
**Operating posture:** private preview; keep `STARGLASS_PREVIEW_GATE=on`

## Finish the current trust-gate deployment first

1. In Netlify, set `SUPABASE_URL` to
   `https://ozfkwvlwgmvfayoaklla.supabase.co` for Functions.
2. Create a dedicated `sb_secret_` key in the StarGlass Supabase project and
   store it as the production Netlify Functions secret `SUPABASE_SECRET_KEY`.
3. Deploy only through the approved Git-triggered Netlify path.
4. With the preview gate still on, verify one synthetic portrait through the
   full create → authorized read → terminal deletion path.
5. Confirm Supabase returns zero rows for that delivered job and the Security
   Advisor remains clear.
6. Inventory and explicitly approve deletion or migration of legacy
   `starglass-readings` Netlify Blob records. Do not silently delete them.
7. Verify malicious SVG captions/colors are rejected or rendered as inert text
   on the deployed engine.

## Next sprint priority 1 — reproducible release checks

Build the release baseline before adding more product surface:

- pin Python test dependencies and make the Python suite runnable from a clean checkout;
- add TypeScript checking, linting, component/function checks, and renderer/API tests;
- include Netlify functions and the Supabase adapter in the checked TypeScript scope;
- add cross-surface fixtures proving chart JSON, tables, and SVG agree;
- expose one local and CI command whose success is required before deployment.

## Next sprint priority 2 — one interpretive and care system

Then unify the skill, Codex, and portrait pipeline around one versioned source:

- compile purpose-specific artifacts rather than maintaining three handwritten copies;
- retrieve relevant canonical evidence for portrait composition;
- replace Codex sign/house concatenation with actual synthesis;
- encode reader authority and hypothesis language at the point of reading;
- add a meaningful “doesn’t fit” response with durable semantics;
- care-migrate and lint authored Codex entries before broader release.

Do not start billing, membership, or public acquisition before these two
priorities and the remaining release gates are complete.
