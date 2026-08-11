import type { Config, Context } from "@netlify/functions";
import { engineFetch, jsonError, responseHeaders } from "./_shared/engine";

export default async (request: Request, context: Context): Promise<Response> => {
  const requestId = context.requestId || crypto.randomUUID();
  if (request.method !== "GET") return jsonError("Method not allowed.", 405, requestId, { allow: "GET" });
  try {
    const upstream = await engineFetch("/health", { method: "GET", headers: { accept: "application/json" } }, requestId);
    if (!upstream) return jsonError("The chart engine is not configured.", 503, requestId);
    if (!upstream.ok) return jsonError("The chart engine is waking.", 503, requestId, { "retry-after": "3" });
    const result = await upstream.json() as { ok?: unknown };
    if (result.ok !== true) return jsonError("The chart engine is not healthy.", 503, requestId, { "retry-after": "3" });
    return Response.json({ ok: true }, { headers: responseHeaders(requestId) });
  } catch (reason) {
    const name = reason instanceof Error ? reason.name : "UnknownError";
    console.error("Engine health request failed", { requestId, name });
    return jsonError("The chart engine is waking.", name === "TimeoutError" ? 504 : 503, requestId, { "retry-after": "3" });
  }
};

export const config: Config = {
  path: "/api/engine/health",
  rateLimit: {
    windowLimit: 120,
    windowSize: 180,
    aggregateBy: ["ip", "domain"],
  },
};
