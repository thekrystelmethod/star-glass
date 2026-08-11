// Smoke harness for the private-preview Edge Function. It verifies that the
// gate fails closed, protects app and API routes, and issues only a signed,
// expiring HttpOnly cookie after the server-side passphrase check.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);

const work = mkdtempSync(join(tmpdir(), "preview-gate-smoke-"));
await esbuild.build({
  entryPoints: [join(here, "netlify/edge-functions/preview-gate.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: join(work, "gate.mjs"),
  logLevel: "silent",
});

const envValues = {};
globalThis.Netlify = { env: { get: (key) => envValues[key] } };
const { default: gate } = await import(pathToFileURL(join(work, "gate.mjs")).href);

let originCalls = 0;
const context = {
  next: async () => {
    originCalls += 1;
    return new Response("origin response", { status: 200, headers: { "cache-control": "public" } });
  },
};

function expect(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exit(1);
  }
}

async function formRequest(passphrase, returnTo = "/") {
  return new Request("https://star-glass.netlify.app/__preview-access", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ passphrase, returnTo }),
  });
}

envValues.STARGLASS_PREVIEW_GATE = "off";
let response = await gate(new Request("https://star-glass.netlify.app/"), context);
expect(response.status === 200 && originCalls === 1, "explicitly disabled gate should pass through");
console.log("✓ explicit off bypasses the private-preview gate");

envValues.STARGLASS_PREVIEW_GATE = "on";
response = await gate(new Request("https://star-glass.netlify.app/"), context);
expect(response.status === 503 && originCalls === 1, "missing secrets should fail closed");
console.log("✓ missing gate secrets fail closed");

envValues.STARGLASS_PREVIEW_PASSPHRASE = "too short";
envValues.STARGLASS_PREVIEW_COOKIE_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
response = await gate(new Request("https://star-glass.netlify.app/"), context);
expect(response.status === 503 && originCalls === 1, "weak passphrase configuration should fail closed");
console.log("✓ weak preview phrase configuration fails closed");

envValues.STARGLASS_PREVIEW_PASSPHRASE = "lantern river velvet orbit";
envValues.STARGLASS_PREVIEW_SESSION_HOURS = "24";

response = await gate(new Request("https://star-glass.netlify.app/reading?mode=dual"), context);
const page = await response.text();
expect(response.status === 401 && page.includes("Private preview"), "anonymous page request should show the access form");
expect(page.includes("/reading?mode=dual"), "access form should retain a safe return path");
expect(!page.includes(envValues.STARGLASS_PREVIEW_PASSPHRASE), "access page must not expose the configured passphrase");
expect(originCalls === 1, "anonymous request must not reach origin");
console.log("✓ anonymous app routes are gated and non-indexable");

response = await gate(new Request("https://star-glass.netlify.app/api/interpret", {
  method: "POST",
  body: "should-not-reach-origin",
}), context);
expect(response.status === 401 && originCalls === 1, "anonymous API request should be stopped at the edge");
console.log("✓ anonymous generation routes are gated");

response = await gate(await formRequest("wrong phrase", "/reading"), context);
expect(response.status === 401 && (await response.text()).includes("not recognized"), "wrong passphrase should be rejected generically");
expect(originCalls === 1, "wrong passphrase must not reach origin");
console.log("✓ incorrect preview phrase is rejected");

response = await gate(await formRequest(envValues.STARGLASS_PREVIEW_PASSPHRASE, "/reading?mode=dual"), context);
const setCookie = response.headers.get("set-cookie") ?? "";
expect(response.status === 303 && response.headers.get("location") === "/reading?mode=dual", "correct phrase should redirect safely");
expect(setCookie.includes("HttpOnly") && setCookie.includes("Secure") && setCookie.includes("SameSite=Strict"), "session cookie should use secure attributes");
expect(!setCookie.includes(envValues.STARGLASS_PREVIEW_PASSPHRASE), "session cookie must not contain the passphrase");
const cookie = setCookie.split(";")[0];
console.log("✓ correct preview phrase issues a signed, expiring session cookie");

response = await gate(await formRequest(envValues.STARGLASS_PREVIEW_PASSPHRASE, "//attacker.example/"), context);
expect(response.status === 303 && response.headers.get("location") === "/", "external return URL should be reduced to the site root");
console.log("✓ external return URL is rejected");

response = await gate(new Request("https://star-glass.netlify.app/reading", { headers: { cookie } }), context);
expect(response.status === 200 && (await response.text()) === "origin response", "valid session should reach origin");
expect(response.headers.get("x-robots-tag")?.includes("noindex"), "private preview response should remain non-indexable");
expect(originCalls === 2, "valid session should make exactly one new origin call");
console.log("✓ valid preview session reaches the app with no-index headers");

const forgedCookie = `${cookie.slice(0, -1)}${cookie.endsWith("0") ? "1" : "0"}`;
response = await gate(new Request("https://star-glass.netlify.app/reading", {
  headers: { cookie: forgedCookie },
}), context);
expect(response.status === 401 && originCalls === 2, "forged session should be rejected");
console.log("✓ forged preview session is rejected");

response = await gate(new Request("https://star-glass.netlify.app/__preview-logout"), context);
expect(response.status === 303 && response.headers.get("set-cookie")?.includes("Max-Age=0"), "logout should clear the session cookie");
console.log("✓ preview logout clears the session cookie");

console.log("ALL PREVIEW GATE SCENARIOS PASS");
