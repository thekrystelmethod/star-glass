// Executes the same-origin Netlify engine functions with mocked Render
// responses. The service token is asserted at the upstream boundary and must
// never appear in any client-visible response.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);
const work = mkdtempSync(join(tmpdir(), "engine-proxy-smoke-"));

for (const [name, entry] of [
  ["proxy", "netlify/functions/engine-proxy.ts"],
  ["health", "netlify/functions/engine-health.ts"],
]) {
  await esbuild.build({
    entryPoints: [join(here, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: join(work, `${name}.mjs`),
    logLevel: "silent",
  });
}

const envValues = {
  STARGLASS_ENGINE_TOKEN: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  STARGLASS_ENGINE_ORIGIN: "https://engine.test",
};
globalThis.Netlify = { env: { get: (key) => envValues[key] } };
const { default: proxy } = await import(pathToFileURL(join(work, "proxy.mjs")).href);
const { default: health } = await import(pathToFileURL(join(work, "health.mjs")).href);

function expect(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exit(1);
  }
}

const context = (operation = "chart", requestId = "req-test-1") => ({ params: { operation }, requestId });
const post = (body = "{}", headers = {}) => new Request("https://star-glass.netlify.app/api/engine/chart", {
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body,
});

let upstreamCalls = 0;
globalThis.fetch = async () => { upstreamCalls += 1; return Response.json({ ok: true }); };

const savedToken = envValues.STARGLASS_ENGINE_TOKEN;
envValues.STARGLASS_ENGINE_TOKEN = "";
let response = await proxy(post(), context());
expect(response.status === 503 && upstreamCalls === 0, "missing service token should fail closed before upstream");
envValues.STARGLASS_ENGINE_TOKEN = savedToken;
console.log("✓ missing proxy configuration fails closed");

response = await proxy(new Request("https://star-glass.netlify.app/api/engine/chart"), context());
expect(response.status === 405 && upstreamCalls === 0, "non-POST chart request should be rejected");
response = await proxy(post(), context("unknown"));
expect(response.status === 404 && upstreamCalls === 0, "unknown operation should be rejected");
response = await proxy(new Request("https://star-glass.netlify.app/api/engine/chart", { method: "POST", body: "{}" }), context());
expect(response.status === 415 && upstreamCalls === 0, "non-JSON request should be rejected");
console.log("✓ proxy enforces route and content-type policy");

response = await proxy(post("{}", { "content-length": String(512 * 1024 + 1) }), context());
expect(response.status === 413 && upstreamCalls === 0, "declared oversized request should be rejected");
response = await proxy(post(`"${"x".repeat(512 * 1024)}"`), context());
expect(response.status === 413 && upstreamCalls === 0, "streamed oversized request should be rejected");
console.log("✓ proxy rejects oversized bodies before Render");

let observedUrl = "";
let observedInit;
globalThis.fetch = async (url, init) => {
  upstreamCalls += 1;
  observedUrl = String(url);
  observedInit = init;
  return Response.json({ input: { safe: true }, tropical: {} });
};
response = await proxy(post('{"date":"1986-03-15"}'), context());
expect(response.status === 200, "valid chart request should return success");
expect(observedUrl === "https://engine.test/chart", "proxy should call only the configured origin and operation");
expect(new Headers(observedInit.headers).get("authorization") === `Bearer ${savedToken}`, "proxy should attach the server-only bearer token");
expect(new TextDecoder().decode(observedInit.body) === '{"date":"1986-03-15"}', "proxy should preserve the JSON body");
expect(response.headers.get("cache-control") === "no-store", "proxied chart should not be cached");
expect(response.headers.get("x-starglass-request-id") === "req-test-1", "proxy should expose only a correlation id");
expect(!(await response.text()).includes(savedToken), "service token must not appear in the client response");
console.log("✓ valid request reaches Render with server-only authentication");

globalThis.fetch = async () => new Response("secret upstream detail", { status: 401 });
response = await proxy(post(), context());
const deniedBody = await response.text();
expect(response.status === 502 && !deniedBody.includes("secret upstream detail") && !deniedBody.includes(savedToken), "upstream auth failures should be sanitized");
console.log("✓ upstream failures are sanitized");

globalThis.fetch = async (url, init) => {
  observedUrl = String(url);
  observedInit = init;
  return Response.json({ ok: true, cache_entries: 500, internal: "hidden" });
};
response = await health(new Request("https://star-glass.netlify.app/api/engine/health"), { params: {}, requestId: "req-health-1" });
expect(response.status === 200 && observedUrl === "https://engine.test/health", "health proxy should reach configured Render health");
expect(new Headers(observedInit.headers).get("authorization") === `Bearer ${savedToken}`, "health proxy should authenticate upstream");
expect(JSON.stringify(await response.json()) === '{"ok":true}', "health proxy should return only minimal health data");
console.log("✓ health proxy is authenticated and information-minimal");

console.log("ALL ENGINE PROXY SCENARIOS PASS");
