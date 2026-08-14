// Harness for src/interpretation.ts — the client boundary that decides what a
// failed compose MEANS. This exists because that decision was the production
// bug of 13 Aug 2026: eleven distinct endings were flattened into one message
// that told the reader to retry, including for the three endings where
// retrying is structurally guaranteed to fail. The portrait was finished and
// preserved in the blob the whole time.
//
//   node test-reading-failure.mjs
//
// Scenarios:
//   1. held-contradiction   — draft released, NOT retryable, claims surfaced
//   2. held-unrepairable    — same
//   3. referee-unlocatable  — same
//   4. audit-unavailable    — the checker faltered, not the chart → retryable
//   5. crashed              — no draft, retryable
//   6. unconfigured         — blocked: no draft, no retry offered
//   7. ready                — publishes normally
//   8. malformed draft      — degrades to "nothing to show", never crashes
//   9. rate limit (429)     — its own stage, distinct message, retryable
//  10. unknown stage        — with a draft → held; without → transient
//  11. COVERAGE GATE        — every stage interpret.ts can emit is classified
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);

const work = mkdtempSync(join(tmpdir(), "reading-failure-"));
const bundle = join(work, "interpretation.mjs");
await esbuild.build({
  entryPoints: [join(here, "src/interpretation.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: bundle,
});

// ── minimal browser surface ───────────────────────────────────────────────
const store = new Map();
globalThis.window = {
  setTimeout: (fn) => setTimeout(fn, 0),
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};
globalThis.crypto ??= { randomUUID: () => "123e4567-e89b-42d3-a456-426614174000" };

const { awaitReading, composeReading, ReadingFailure } = await import(pathToFileURL(bundle).href);

const PORTRAIT = {
  title: "The Spear and the Sea",
  framing: "A framing paragraph.",
  movements: [{ nav: "Overture", title: "t", subtitle: "s", body: "b", quote: "q", invitation: "i" }],
};

/** Serve one status payload, then keep serving it. */
function serveStatus(payload) {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => payload });
}

let failures = 0;
function check(label, condition, detail = "") {
  if (condition) { console.log(`✓ ${label}`); return; }
  failures += 1;
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

async function failureFrom(payload) {
  serveStatus(payload);
  try {
    await awaitReading("123e4567-e89b-42d3-a456-426614174000", Date.now() + 5_000);
    return null;
  } catch (reason) {
    return reason;
  }
}

// ── 1–3. the three terminal stages release their draft and refuse the retry ──
for (const stage of ["held-contradiction", "held-unrepairable", "referee-unlocatable"]) {
  const failure = await failureFrom({
    status: "held",
    stage,
    error: "StarGlass held this portrait back.",
    held: {
      reading: PORTRAIT,
      corrections: [{ find: "Mars, Venus and Saturn stand together", reason: "Venus–Saturn is not in the aspect list" }],
    },
  });
  check(`${stage} is terminal`, failure instanceof ReadingFailure && failure.kind === "held", `got ${failure?.kind}`);
  check(`${stage} never offers a retry`, failure?.retryable === false);
  check(`${stage} releases the finished portrait`, failure?.draft?.title === PORTRAIT.title);
  check(`${stage} names the unreconciled claim`, failure?.unreconciled?.length === 1);
}

// ── 4. the checker faltered; the chart is fine and a fresh run differs ───────
const unavailable = await failureFrom({
  status: "held",
  stage: "audit-unavailable",
  error: "The portrait's fact-check could not finish this time.",
  held: { reading: PORTRAIT, corrections: [] },
});
check("audit-unavailable is transient", unavailable?.kind === "transient", `got ${unavailable?.kind}`);
check("audit-unavailable offers a retry", unavailable?.retryable === true);

// ── 5. a crash with no draft ────────────────────────────────────────────────
const crashed = await failureFrom({ status: "error", stage: "crashed", error: "StarGlass could not compose the portrait." });
check("crashed is transient", crashed?.kind === "transient");
check("crashed has no draft to show", crashed?.draft === null);

// ── 6. the request itself cannot be served ──────────────────────────────────
const blocked = await failureFrom({ status: "error", stage: "unconfigured", error: "Not enabled for this preview." });
check("unconfigured is blocked", blocked?.kind === "blocked", `got ${blocked?.kind}`);
check("unconfigured offers no retry", blocked?.retryable === false);

// ── 7. the happy path still publishes ───────────────────────────────────────
serveStatus({ status: "ready", reading: PORTRAIT });
const published = await awaitReading("123e4567-e89b-42d3-a456-426614174000", Date.now() + 5_000);
check("a ready job returns its portrait", published.title === PORTRAIT.title);

// ── 8. a malformed draft must degrade, never throw ──────────────────────────
const malformed = await failureFrom({
  status: "held",
  stage: "held-contradiction",
  error: "held",
  held: { reading: { title: "only a title" }, corrections: "not an array" },
});
check("a malformed draft degrades to nothing-to-show", malformed?.draft === null);
check("malformed corrections degrade to an empty list", Array.isArray(malformed?.unreconciled) && malformed.unreconciled.length === 0);

// ── 9. the rate limit gets its own stage and its own words ──────────────────
globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
let limited = null;
try {
  await composeReading({ chart: {}, zodiac: "tropical", essence: "full" });
} catch (reason) { limited = reason; }
check("429 is its own stage", limited?.stage === "rate-limited", `got ${limited?.stage}`);
check("429 is retryable", limited?.retryable === true);
check("429 does not blame the chart", /nothing is wrong with your chart/i.test(limited?.message ?? ""));

// ── 10. an unrecognised stage errs toward showing what exists ───────────────
const unknownWithDraft = await failureFrom({ status: "held", stage: "some-future-stage", error: "x", held: { reading: PORTRAIT } });
check("an unknown stage WITH a draft shows it", unknownWithDraft?.kind === "held");
const unknownBare = await failureFrom({ status: "error", stage: "some-future-stage", error: "x" });
check("an unknown stage with no draft stays retryable", unknownBare?.kind === "transient");

// ── 11. COVERAGE GATE ───────────────────────────────────────────────────────
// The classifier defaults rather than throwing, so a stage added to
// interpret.ts without a matching entry here would silently fall back — and
// falling back to "transient" on a genuinely terminal stage IS the original
// bug. Read the stages straight out of the function and require each one to be
// classified explicitly.
const source = readFileSync(join(here, "netlify/functions/interpret.ts"), "utf8");
const emitted = new Set([
  ...[...source.matchAll(/holdDraft\(\s*"([a-z-]+)"/g)].map((m) => m[1]),
  ...[...source.matchAll(/stage:\s*"([a-z-]+)"/g)].map((m) => m[1]),
].filter((stage) => stage !== "published" && !["composing", "auditing", "repairing", "refereeing"].includes(stage)));

const client = readFileSync(join(here, "src/interpretation.ts"), "utf8");
const classified = new Set([...client.matchAll(/^\s+"([a-z-]+)",$/gm)].map((m) => m[1]));

const unclassified = [...emitted].filter((stage) => !classified.has(stage));
check(
  `every stage interpret.ts emits is classified (${emitted.size} stages)`,
  unclassified.length === 0,
  `unclassified: ${unclassified.join(", ")}`,
);

if (failures > 0) {
  console.error(`\n${failures} READING-FAILURE ASSERTION(S) FAILED`);
  process.exit(1);
}
console.log("ALL READING-FAILURE SCENARIOS PASS");
