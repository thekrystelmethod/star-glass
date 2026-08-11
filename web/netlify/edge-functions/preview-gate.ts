import type { Config, Context } from "@netlify/edge-functions";

declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const COOKIE_NAME = "starglass_preview";
const ACCESS_PATH = "/__preview-access";
const LOGOUT_PATH = "/__preview-logout";

function securityHeaders(): Record<string, string> {
  return {
    "cache-control": "no-store, max-age=0",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
}

function env(name: string): string {
  return Netlify.env.get(name)?.trim() ?? "";
}

function sessionSeconds(): number {
  const requested = Number.parseInt(env("STARGLASS_PREVIEW_SESSION_HOURS"), 10);
  const hours = Number.isFinite(requested) ? Math.min(168, Math.max(1, requested)) : 72;
  return hours * 60 * 60;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function samePassphrase(submitted: string, expected: string): Promise<boolean> {
  const [submittedDigest, expectedDigest] = await Promise.all([digest(submitted.trim()), digest(expected.trim())]);
  return constantTimeEqual(submittedDigest, expectedDigest);
}

async function signature(expiresAt: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(expiresAt))));
}

function cookieValue(request: Request, name: string): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
  }
  return "";
}

async function validSession(request: Request, secret: string): Promise<boolean> {
  const value = cookieValue(request, COOKIE_NAME);
  const separator = value.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = value.slice(0, separator);
  const suppliedSignature = value.slice(separator + 1);
  if (!/^\d{10}$/.test(expiresAt) || !/^[0-9a-f]{64}$/i.test(suppliedSignature)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1_000)) return false;

  const expectedSignature = await signature(expiresAt, secret);
  const encoder = new TextEncoder();
  return constantTimeEqual(encoder.encode(suppliedSignature.toLowerCase()), encoder.encode(expectedSignature));
}

function safeReturnPath(value: FormDataEntryValue | string | null): string {
  const candidate = typeof value === "string" ? value : "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/";
  try {
    const base = "https://preview.invalid";
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base || parsed.pathname === ACCESS_PATH || parsed.pathname === LOGOUT_PATH) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch (_) {
    return "/";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

function accessPage(returnTo: string, error = "", status = 401): Response {
  const errorMarkup = error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Star Glass — Private Preview</title>
  <style>
    :root { color-scheme: dark; font-family: ui-serif, Georgia, serif; background: #080b16; color: #f4efe4; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 50% 10%, #1c2340 0, #080b16 52%); }
    main { width: min(100%, 430px); padding: 40px; border: 1px solid #b9a36a55; border-radius: 24px; background: #0f1425ee; box-shadow: 0 24px 80px #0008; }
    .mark { color: #d9bd77; letter-spacing: .22em; text-transform: uppercase; font: 600 12px ui-sans-serif, system-ui, sans-serif; }
    h1 { margin: 18px 0 12px; font-size: clamp(30px, 8vw, 42px); font-weight: 500; line-height: 1.05; }
    p { color: #c9c6bf; line-height: 1.6; }
    label { display: block; margin: 28px 0 8px; font: 600 13px ui-sans-serif, system-ui, sans-serif; }
    input, button { width: 100%; border-radius: 12px; padding: 14px 16px; font: 16px ui-sans-serif, system-ui, sans-serif; }
    input { border: 1px solid #ffffff33; background: #080b16; color: #fff; }
    input:focus { outline: 2px solid #d9bd77; outline-offset: 2px; }
    button { margin-top: 14px; border: 0; background: #d9bd77; color: #17140c; font-weight: 750; cursor: pointer; }
    .error { color: #ffbbb2; margin: 18px 0 0; }
    small { display: block; margin-top: 22px; color: #8e8d90; line-height: 1.5; font: 12px ui-sans-serif, system-ui, sans-serif; }
  </style>
</head>
<body>
  <main>
    <div class="mark">Star Glass</div>
    <h1>Private preview</h1>
    <p>This unfinished instrument is open only to invited testers. Enter the shared preview phrase to continue.</p>
    ${errorMarkup}
    <form method="post" action="${ACCESS_PATH}">
      <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
      <label for="passphrase">Preview phrase</label>
      <input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Enter the preview</button>
    </form>
    <small>This is a limited testing environment, not a public release.</small>
  </main>
</body>
</html>`;
  return new Response(html, { status, headers: { ...securityHeaders(), "content-type": "text/html; charset=utf-8" } });
}

function configurationError(): Response {
  return new Response("Star Glass preview access is not configured.", {
    status: 503,
    headers: { ...securityHeaders(), "content-type": "text/plain; charset=utf-8", "retry-after": "300" },
  });
}

function redirect(location: string, setCookie: string): Response {
  return new Response(null, {
    status: 303,
    headers: { ...securityHeaders(), location, "set-cookie": setCookie },
  });
}

export default async (request: Request, context: Context): Promise<Response> => {
  // The safe default is closed. Public launch requires an explicit `off`.
  if (env("STARGLASS_PREVIEW_GATE").toLowerCase() === "off") return context.next();

  const passphrase = env("STARGLASS_PREVIEW_PASSPHRASE");
  const cookieSecret = env("STARGLASS_PREVIEW_COOKIE_SECRET");
  if (passphrase.length < 16 || cookieSecret.length < 32) return configurationError();

  const url = new URL(request.url);
  if (url.pathname === LOGOUT_PATH) {
    return redirect("/", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  }

  if (url.pathname === ACCESS_PATH && request.method === "POST") {
    let form: FormData;
    try {
      form = await request.formData();
    } catch (_) {
      return accessPage("/", "That preview phrase could not be checked. Please try again.");
    }
    const returnTo = safeReturnPath(form.get("returnTo"));
    const submitted = form.get("passphrase");
    if (typeof submitted !== "string" || !(await samePassphrase(submitted, passphrase))) {
      return accessPage(returnTo, "That preview phrase is not recognized.");
    }

    const maxAge = sessionSeconds();
    const expiresAt = String(Math.floor(Date.now() / 1_000) + maxAge);
    const token = `${expiresAt}.${await signature(expiresAt, cookieSecret)}`;
    return redirect(returnTo, `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
  }

  if (!(await validSession(request, cookieSecret))) {
    const returnTo = safeReturnPath(`${url.pathname}${url.search}`);
    return accessPage(returnTo);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  headers.set("referrer-policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config: Config = { path: "/*" };
