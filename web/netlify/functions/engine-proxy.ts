import type { Config, Context } from "@netlify/functions";
import { boundedJsonBody, engineFetch, jsonError, responseHeaders } from "./_shared/engine";

const RESPONSE_TYPES: Record<string, string> = {
  chart: "application/json",
  wheel: "image/svg+xml",
  tables: "text/plain",
};

function upstreamError(status: number, requestId: string): Response {
  if (status === 413) return jsonError("The chart request is too large.", 413, requestId);
  if (status === 415) return jsonError("The chart request has an unsupported format.", 415, requestId);
  if (status === 422) return jsonError("The chart request could not be processed.", 422, requestId);
  if (status === 429) return jsonError("The chart engine is busy. Please try again shortly.", 429, requestId, { "retry-after": "2" });
  if (status === 503 || status === 504) return jsonError("The chart engine is waking or busy. Please try again shortly.", 503, requestId, { "retry-after": "3" });
  return jsonError("The chart engine could not complete the request.", 502, requestId);
}

export default async (request: Request, context: Context): Promise<Response> => {
  const requestId = context.requestId || crypto.randomUUID();
  const operation = context.params.operation;
  if (!operation || !Object.hasOwn(RESPONSE_TYPES, operation)) return jsonError("Chart operation not found.", 404, requestId);
  if (request.method !== "POST") return jsonError("Method not allowed.", 405, requestId, { allow: "POST" });

  const body = await boundedJsonBody(request);
  if (body instanceof Response) {
    const payload = await body.text();
    return new Response(payload, { status: body.status, headers: { ...Object.fromEntries(body.headers), "x-starglass-request-id": requestId } });
  }

  try {
    const upstream = await engineFetch(`/${operation}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: RESPONSE_TYPES[operation],
      },
      body,
    }, requestId);
    if (!upstream) return jsonError("The chart engine is not configured.", 503, requestId);
    if (!upstream.ok) return upstreamError(upstream.status, requestId);

    const contentType = upstream.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
    if (contentType !== RESPONSE_TYPES[operation]) {
      console.error("Engine proxy received an unexpected response type", { operation, requestId, contentType });
      return jsonError("The chart engine returned an invalid response.", 502, requestId);
    }
    return new Response(upstream.body, {
      status: 200,
      headers: { ...responseHeaders(requestId), "content-type": upstream.headers.get("content-type") ?? RESPONSE_TYPES[operation] },
    });
  } catch (reason) {
    const name = reason instanceof Error ? reason.name : "UnknownError";
    console.error("Engine proxy request failed", { operation, requestId, name });
    return jsonError(
      name === "TimeoutError" ? "The chart engine took too long to answer." : "The chart engine is not available.",
      name === "TimeoutError" ? 504 : 502,
      requestId,
    );
  }
};

export const config: Config = {
  path: "/api/engine/:operation",
  excludedPath: "/api/engine/health",
  rateLimit: {
    windowLimit: 30,
    windowSize: 180,
    aggregateBy: ["ip", "domain"],
  },
};
