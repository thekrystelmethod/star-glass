// Smoke harness for netlify/functions/interpret.ts — EXECUTES the whole
// function with mocked gateway + blob store. This exists because a syntax
// check once passed a ReferenceError into production: bundling is not
// running. CI runs this on every push.
//
//   node test-interpret-smoke.mjs
//
// Scenarios:
//   1. clean pass       — composer output verified first time → publishes
//   2. repair pass      — auditors return overlapping/duplicate corrections,
//                         second audit clean → publishes with repairs
//   3. unrepairable     — auditor unverified with no fixes → HELD, draft kept
//   4. affirmations     — find===replace entries dropped at intake → publishes
//   5. fixed point      — unlocatable corrections converge → publishes
//   6. referee dismiss  — persistent style pedantry ruled non-genuine → publishes
//   7. referee repair   — genuine error repaired in its own movement, one
//                         bounded final re-audit clean → publishes (SG-210)
//   8. referee + dirty  — final re-audit still unverified → HELD, draft kept
//   9. unlocatable ref  — referee find matches nothing → HELD, draft kept
//  10. kill switch      — generation disabled → fail closed, 0 gateway calls
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);

// ── bundle the function with a stubbed blob store ────────────────────────
const work = mkdtempSync(join(tmpdir(), "interpret-smoke-"));
writeFileSync(join(work, "blobs-stub.mjs"), `
export function getStore() {
  return { setJSON: async (key, value) => { globalThis.__lastStored = value; } };
}
`);
await esbuild.build({
  entryPoints: [join(here, "netlify/functions/interpret.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: join(work, "fn.mjs"),
  alias: { "@netlify/blobs": join(work, "blobs-stub.mjs") },
  logLevel: "silent",
});
const { default: handler } = await import(pathToFileURL(join(work, "fn.mjs")).href);

// ── fixtures ─────────────────────────────────────────────────────────────
const chart = { tropical: { placements: {}, angles: { Ascendant: { display: "x", longitude: 1 }, Midheaven: { display: "x", longitude: 2 } }, house_cusps: [], aspects: [], weighting: {} }, input: {} };
const movement = (nav) => ({
  nav, title: `${nav} title here`, subtitle: `${nav} subtitle long enough`,
  paragraphs: [
    `The torch is carried into the ${nav} and what it shows repeats in every chamber of the reading, faithfully and at length, so this paragraph clears the minimum. (a)`,
    `The well answers the torch in the ${nav} as it does in every movement, which is exactly why duplicate corrections occur across auditors in production systems. (b)`,
    `A third paragraph for schema validity in the ${nav}, long enough to satisfy the minimum length constraint imposed by the reading tool schema definition. (c)`,
  ],
  quote: `A quote for ${nav} that is long enough.`,
  invitation: `An invitation for ${nav} that is long enough to pass.`,
  bridge: `A bridge sentence for ${nav} carrying images onward.`,
  bodies: ["Sun", "Moon"],
});
const NAVS = ["Overture", "The Ground Floor", "The Inner Cast", "The Mirror", "The Summit", "Integration"];
const readingFixture = () => ({
  title: "The Torch and the Well",
  framing: "Read this as a field guide rather than a verdict, tested against your days.",
  movements: NAVS.map(movement),
});

const composerResponse = () => ({
  ok: true, status: 200,
  json: async () => ({ content: [{ type: "tool_use", name: "submit_reading", input: readingFixture() }] }),
  text: async () => "",
});
const auditResponse = (verified, corrections) => ({
  ok: true, status: 200,
  json: async () => ({ content: [{ type: "tool_use", name: "submit_corrections", input: { verified, corrections } }] }),
  text: async () => "",
});
const refereeResponse = (genuineErrors) => ({
  ok: true, status: 200,
  json: async () => ({ content: [{ type: "tool_use", name: "submit_verdict", input: { genuine_errors: genuineErrors } }] }),
  text: async () => "",
});

const envValues = {
  ANTHROPIC_API_KEY: "test",
  ANTHROPIC_BASE_URL: "https://gateway.test",
  PUBLIC_GENERATION_ENABLED: "true",
};
globalThis.Netlify = { env: { get: (k) => envValues[k] } };

// The shape-namer runs before composition and is identified by CONTENT, not by
// call order — dispatching on order made every scenario break the moment a new
// stage was added ahead of the composer. `namerScript` lets a scenario decide
// how the namer behaves; by default it names a real shape so a myth is chosen.
function namerResponse(shapeId) {
  return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: shapeId }] }) };
}
const isNamerRequest = (options) =>
  String(options?.body ?? "").includes("You name the hardest theme");

async function scenario(name, auditScript, expectStatus, expectExtra = () => {}, namerScript = () => namerResponse("mark-at-sovereignty")) {
  let call = 0;
  let composerPrompt = "";
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("gateway.test")) {
      if (isNamerRequest(options)) return namerScript();
      call += 1;
      if (call === 1) { composerPrompt = String(options?.body ?? ""); return composerResponse(); }
      return auditScript(call - 1); // audit calls numbered from 1
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  globalThis.__composerPrompt = () => composerPrompt;
  globalThis.__lastStored = null;
  const request = new Request("https://x/api/interpret", {
    method: "POST",
    body: JSON.stringify({ jobId: "123e4567-e89b-42d3-a456-426614174000", chart, zodiac: "tropical", essence: null }),
  });
  await handler(request);
  const stored = globalThis.__lastStored;
  if (!stored || stored.status !== expectStatus) {
    console.error(`✗ ${name}: expected status=${expectStatus}, got`, JSON.stringify(stored)?.slice(0, 300));
    process.exit(1);
  }
  expectExtra(stored);
  console.log(`✓ ${name} (${call} gateway calls) → ${stored.status}`);
}

// 1. clean: all six audits verified, no corrections
await scenario("clean pass publishes",
  () => auditResponse(true, []),
  "ready",
  (s) => { if (s.audit?.passes !== 1) { console.error("expected 1 pass"); process.exit(1); } });

// 2. repair: first round returns overlapping + duplicate corrections (same
// find from two auditors; one correction superseding another), second round clean
await scenario("repair round tolerates overlaps then publishes",
  (auditCall) => {
    if (auditCall <= 6) {
      if (auditCall === 1) return auditResponse(false, [
        { find: "The torch is carried into the Overture", replace: "The lantern is carried into the Overture", reason: "test" },
        { find: "The Torch and the Well", replace: "The Lamp and the Well", reason: "title fix" },
      ]);
      if (auditCall === 2) return auditResponse(true, [
        { find: "The Torch and the Well", replace: "The Lamp and the Well", reason: "duplicate title fix from second auditor" },
      ]);
      return auditResponse(true, []);
    }
    return auditResponse(true, []); // second full round: clean
  },
  "ready",
  (s) => {
    if (s.audit?.passes !== 2) { console.error("expected 2 passes, got", s.audit); process.exit(1); }
    if (JSON.stringify(s.reading).includes("The Torch and the Well")) { console.error("title correction not applied"); process.exit(1); }
  });

// 3. unrepairable: an auditor says unverified with no fixes — the portrait is
// HELD (draft preserved for inspection), never silently discarded
await scenario("unverified with no corrections holds the draft",
  (auditCall) => auditCall === 3 ? auditResponse(false, []) : auditResponse(true, []),
  "held",
  (s) => {
    if (!s.held?.reading?.movements) { console.error("held record must preserve the draft", JSON.stringify(s).slice(0, 200)); process.exit(1); }
    if (s.stage !== "held-unrepairable") { console.error("expected stage held-unrepairable, got", s.stage); process.exit(1); }
  });

// 4. affirmation corrections (find === replace) are dropped at intake —
// this is the production incident where auditors "corrected" correct text
await scenario("affirmation corrections are filtered and the portrait publishes",
  (auditCall) => auditCall === 2
    ? auditResponse(true, [{ find: "The well answers the torch", replace: "  The well answers the torch  ", reason: "this text is correct, no change needed" }])
    : auditResponse(true, []),
  "ready",
  (s) => { if (s.audit?.passes !== 1) { console.error("expected 1 pass, got", s.audit); process.exit(1); } });

// 5. fixed point: a correction quoting text that no longer exists (or never
// did) applies to nothing — the verified reading stands instead of failing
await scenario("unlocatable corrections reach a fixed point and publish",
  (auditCall) => auditCall <= 6
    ? auditResponse(true, [{ find: "this passage exists nowhere in the portrait text", replace: "and so it cannot be applied to anything", reason: "re-litigating settled text" }])
    : auditResponse(true, []),
  "ready",
  (s) => { if (s.audit?.refereed !== false) { console.error("expected refereed=false, got", s.audit); process.exit(1); } });

// 6. true deadlock, referee dismisses: every round produces corrections that
// DO apply, audits never come back empty — the referee rules them non-genuine
const deadlockScript = (auditCall) => {
  if (auditCall <= 6) return auditResponse(true, [{ find: "faithfully and at length", replace: "faithfully and at some length", reason: "pass 1" }]);
  if (auditCall <= 12) return auditResponse(true, [{ find: "duplicate corrections occur", replace: "duplicated corrections occur", reason: "pass 2" }]);
  if (auditCall <= 18) return auditResponse(true, [{ find: "schema validity", replace: "schema correctness", reason: "pass 3" }]);
  if (auditCall <= 24) return auditResponse(true, [{ find: "minimum length constraint", replace: "minimum-length constraint", reason: "pass 4 — style pedantry" }]);
  return refereeResponse([]); // call 25: the referee
};
await scenario("persistent stylistic corrections publish after referee dismissal",
  deadlockScript,
  "ready",
  (s) => {
    if (s.audit?.refereed !== true) { console.error("expected refereed=true, got", s.audit); process.exit(1); }
    if (s.audit?.passes !== 4) { console.error("expected 4 passes, got", s.audit); process.exit(1); }
  });

// 7. true deadlock, referee confirms a genuine error WITH a movement-scoped
// repair: the repair is applied only inside its movement, one bounded final
// re-audit comes back clean, and the portrait PUBLISHES (SG-210). The same
// phrase in every other movement must remain untouched.
const genuineFinding = {
  movement: "The Mirror",
  find: "occur across auditors in production systems",
  replace: "occur across referees in production systems",
  reason: "the ledger contradicts this claim",
};
await scenario("referee repairs genuine errors in scope and publishes after a clean re-audit",
  (auditCall) => {
    if (auditCall <= 24) return deadlockScript(auditCall);
    if (auditCall === 25) return refereeResponse([genuineFinding]);
    return auditResponse(true, []); // calls 26-31: the bounded final re-audit
  },
  "ready",
  (s) => {
    if (s.audit?.refereed !== true || s.audit?.referee_repairs !== 1) { console.error("expected refereed=true with 1 repair, got", s.audit); process.exit(1); }
    if (s.audit?.resolution !== "referee-corrected") { console.error("expected resolution referee-corrected, got", s.audit); process.exit(1); }
    if (s.audit?.passes !== 5) { console.error("expected 5 passes, got", s.audit); process.exit(1); }
    const mirror = s.reading.movements.find((m) => m.nav === "The Mirror");
    const summit = s.reading.movements.find((m) => m.nav === "The Summit");
    if (!JSON.stringify(mirror).includes("across referees")) { console.error("referee repair not applied in its movement"); process.exit(1); }
    if (!JSON.stringify(summit).includes("across auditors")) { console.error("referee repair leaked across movements"); process.exit(1); }
  });

// 8. referee repairs, but the final re-audit still finds an unverifiable
// movement: HELD with the draft preserved — no second referee, no loop
await scenario("dirty final re-audit after referee repair holds the draft",
  (auditCall) => {
    if (auditCall <= 24) return deadlockScript(auditCall);
    if (auditCall === 25) return refereeResponse([genuineFinding]);
    return auditCall === 26 ? auditResponse(false, []) : auditResponse(true, []);
  },
  "held",
  (s) => {
    if (!s.held?.reading?.movements) { console.error("held record must preserve the draft"); process.exit(1); }
    if (s.stage !== "held-contradiction") { console.error("expected stage held-contradiction, got", s.stage); process.exit(1); }
  });

// 9. the referee calls errors genuine but its find exists nowhere in the
// text it judged: nothing can be repaired and nothing may publish — HELD
await scenario("unlocatable referee findings hold the draft",
  (auditCall) => {
    if (auditCall <= 24) return deadlockScript(auditCall);
    return refereeResponse([{ movement: "Overture", find: "this text exists nowhere in the portrait", replace: "and so it cannot repair anything", reason: "test" }]);
  },
  "held",
  (s) => {
    if (s.stage !== "referee-unlocatable") { console.error("expected stage referee-unlocatable, got", s.stage); process.exit(1); }
    if (!s.held?.reading?.movements) { console.error("held record must preserve the draft"); process.exit(1); }
  });

// 10. the named shape reaches the composer as a told story, not a mood
await scenario("a named shape sends its myth to the composer",
  () => auditResponse(true, []),
  "ready",
  () => {
    const prompt = globalThis.__composerPrompt();
    if (!prompt.includes("THE MYTH FOR THIS CHART'S HARDEST THEME")) {
      console.error("✗ composer was not given the myth block"); process.exit(1);
    }
    if (!prompt.includes("THE IMAGE THE STORY TURNS ON")) {
      console.error("✗ myth block omitted the governing image"); process.exit(1);
    }
  });

// 11. FAIL OPEN. Myth selection must never become a twelfth way to lose a
// portrait: a dead namer costs imagery, never the reading.
await scenario("a dead shape-namer still publishes",
  () => auditResponse(true, []),
  "ready",
  () => {
    if (globalThis.__composerPrompt().includes("THE MYTH FOR THIS")) {
      console.error("✗ a failed namer still injected a myth"); process.exit(1);
    }
  },
  () => { throw new Error("namer unavailable"); });

// 12. An invented shape is not a licence to guess a story.
await scenario("an unknown shape selects no myth",
  () => auditResponse(true, []),
  "ready",
  () => {
    if (globalThis.__composerPrompt().includes("THE MYTH FOR THIS")) {
      console.error("✗ an unknown shape still produced a myth"); process.exit(1);
    }
  },
  () => namerResponse("the-shape-of-water"));

// 10. owner kill switch: disabled is fail-closed and never reaches the gateway
envValues.PUBLIC_GENERATION_ENABLED = "false";
globalThis.fetch = async () => { throw new Error("generation switch allowed a gateway request"); };
globalThis.__lastStored = null;
await handler(new Request("https://x/api/interpret", {
  method: "POST",
  body: JSON.stringify({ jobId: "123e4567-e89b-42d3-a456-426614174001", chart, zodiac: "tropical", essence: null }),
}));
if (globalThis.__lastStored?.status !== "error" || !globalThis.__lastStored?.error?.includes("paused")) {
  console.error("✗ disabled generation did not fail closed", globalThis.__lastStored);
  process.exit(1);
}
console.log("✓ disabled generation fails closed (0 gateway calls) → error");

console.log("ALL SMOKE SCENARIOS PASS");
