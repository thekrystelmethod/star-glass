// Executes the status/delete endpoint with a mocked Supabase Data API.
// Proves that a UUID alone cannot retrieve a portrait and deletion is terminal.
import { createHash } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);
const work = mkdtempSync(join(tmpdir(), "portrait-security-"));
await esbuild.build({
  entryPoints: [join(here, "netlify/functions/interpret-status.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: join(work, "status.mjs"),
  logLevel: "silent",
});
const { default: statusHandler } = await import(pathToFileURL(join(work, "status.mjs")).href);

const jobId = "123e4567-e89b-42d3-a456-426614174000";
const accessToken = "A".repeat(43);
const accessHash = createHash("sha256").update(accessToken).digest("hex");
let row = { record: { status: "ready", reading: { title: "Private portrait" } } };
let dataCalls = 0;

globalThis.Netlify = { env: { get: (name) => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test_only",
})[name] } };

globalThis.fetch = async (url, options = {}) => {
  dataCalls += 1;
  const parsed = new URL(String(url));
  const matches = parsed.searchParams.get("job_id") === `eq.${jobId}`
    && parsed.searchParams.get("access_token_hash") === `eq.${accessHash}`;
  if (options.method === "GET") {
    return { ok: true, status: 200, json: async () => matches && row ? [row] : [] };
  }
  if (options.method === "DELETE") {
    if (matches) row = null;
    return { ok: true, status: 204, json: async () => [] };
  }
  throw new Error(`unexpected Data API method ${options.method}`);
};

const context = { params: { jobId } };
const check = (name, condition, detail = "") => {
  if (!condition) { console.error(`✗ ${name}${detail ? `: ${detail}` : ""}`); process.exit(1); }
  console.log(`✓ ${name}`);
};

let response = await statusHandler(new Request(`https://x/api/interpret/${jobId}`), context);
check("a UUID without its capability is rejected", response.status === 401);
check("rejected access never reaches Supabase", dataCalls === 0);

response = await statusHandler(new Request(`https://x/api/interpret/${jobId}`, {
  headers: { authorization: `Bearer ${"B".repeat(43)}` },
}), context);
check("a forged capability retrieves no portrait", (await response.json()).status === "queued");

response = await statusHandler(new Request(`https://x/api/interpret/${jobId}`, {
  headers: { authorization: `Bearer ${accessToken}` },
}), context);
check("the owning capability retrieves its portrait", (await response.json()).reading?.title === "Private portrait");

response = await statusHandler(new Request(`https://x/api/interpret/${jobId}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${accessToken}` },
}), context);
check("deletion is accepted", response.status === 204);

response = await statusHandler(new Request(`https://x/api/interpret/${jobId}`, {
  headers: { authorization: `Bearer ${accessToken}` },
}), context);
check("a deleted portrait cannot be retrieved", (await response.json()).status === "queued");

console.log("ALL PORTRAIT-SECURITY SCENARIOS PASS");
