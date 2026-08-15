# Interpretive schema draft

**Status: PROPOSED, NONCANONICAL, AND NOT CONNECTED TO RUNTIME.**

This directory is the isolated Phase 2 experiment approved after the Phase 1
schema-discovery audit. It describes a possible boundary between semantic
meaning, evidence rules, delivery profiles, authored corpora, and generated
artifacts. Its presence does not make the draft authoritative.

## Guardrails

- Nothing under this directory is imported by `SKILL.md`, `web/`, `api/`, or
  `scripts/`.
- The validator is read-only. It parses the draft, inspects the existing Codex,
  and compares the two current Codex trees; it writes no files.
- `web/netlify/functions/interpret.ts` remains the operational portrait prompt.
- `web/public/codex/` remains the deployed Codex asset tree.
- Handwritten references and authored corpora remain untouched.
- Contradictions remain explicit until an owner approves their disposition.

## Contents

- `bundle.draft.json` — draft manifest, ownership boundaries, and artifact
  targets.
- `schema/interpretive-bundle.schema.json` — dependency-free core interfaces in
  JSON Schema form.
- `fixtures/representative-fixtures.json` — one rule, one axis, one legacy
  corpus entry, and one delivery-profile fixture.
- `fixtures/coverage-fixtures.json` — ontology, sign/node axes, mode, mythology,
  and output-contract fixtures that exercise the remaining draft interfaces.
- `contradictions.draft.json` — the Phase 1 contradiction ledger with proposed
  Phase 2 handling, not semantic resolutions.
- `scripts/validate_draft.py` — read-only validation of the draft and the
  existing 312-entry Codex.
- `scripts/compile_preview.py` — deterministic in-memory grouping of the draft
  into semantic, delivery, corpus, and contract channels. It prints to stdout
  and has no file-write option.

## Validate

From the repository root:

```bash
python3 interpretive-schema-draft/scripts/validate_draft.py
python3 interpretive-schema-draft/scripts/compile_preview.py --check
```

The validator deliberately uses only the Python standard library. A successful
run demonstrates structural coherence and preservation of the observed Codex
baseline. It does not demonstrate that any disputed interpretive rule is true,
approved, safe for runtime, or ready for migration.
