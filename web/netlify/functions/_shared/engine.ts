declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const MAX_REQUEST_BYTES = 512 * 1024;
const UPSTREAM_TIMEOUT_MS = 55_000;

interface EngineConfig {
  origin: string;
  token: string;
}

export function responseHeaders(requestId?: string): Record<string, string> {
  return {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...(requestId ? { "x-starglass-request-id": requestId } : {}),
  };
}

export function jsonError(detail: string, status: number, requestId?: string, extraHeaders: Record<string, string> = {}): Response {
  return Response.json({ detail }, {
    status,
    headers: { ...responseHeaders(requestId), ...extraHeaders },
  });
}

export function engineConfig(): EngineConfig | null {
  const token = Netlify.env.get("STARGLASS_ENGINE_TOKEN")?.trim() ?? "";
  const configuredOrigin = Netlify.env.get("STARGLASS_ENGINE_ORIGIN")?.trim() ?? "";
  if (token.length < 32 || !configuredOrigin) return null;
  try {
    const parsed = new URL(configuredOrigin);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (parsed.pathname !== "/" && parsed.pathname !== "") return null;
    return { origin: parsed.origin, token };
  } catch (_) {
    return null;
  }
}

export async function boundedJsonBody(request: Request): Promise<Uint8Array | Response> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return jsonError("Content-Type must be application/json.", 415);

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsed = Number(declaredLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0) return jsonError("Invalid Content-Length.", 400);
    if (parsed > MAX_REQUEST_BYTES) return jsonError("Request body is too large.", 413);
  }

  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return jsonError("Request body is too large.", 413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function engineFetch(path: string, init: RequestInit, requestId: string): Promise<Response | null> {
  const config = engineConfig();
  if (!config) return null;
  return fetch(`${config.origin}${path}`, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
      authorization: `Bearer ${config.token}`,
      "x-starglass-request-id": requestId,
    },
  });
}
