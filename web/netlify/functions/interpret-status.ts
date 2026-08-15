import type { Config, Context } from "@netlify/functions";
import {
  deletePortraitJob,
  getPortraitJob,
  validPortraitJobId,
  validPortraitJobToken,
} from "./_shared/portrait-store.ts";

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => Response.json(body, {
  status,
  headers: {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  },
});

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
  return scheme?.toLowerCase() === "bearer" && token && rest.length === 0 ? token : "";
}

export default async (request: Request, context: Context) => {
  if (request.method !== "GET" && request.method !== "DELETE") {
    return json({ error: "Method not allowed." }, 405, { allow: "GET, DELETE" });
  }

  const jobId = context.params.jobId;
  const accessToken = bearerToken(request);
  if (!validPortraitJobId(jobId)) return json({ error: "Invalid portrait id." }, 400);
  if (!validPortraitJobToken(accessToken)) return json({ error: "Portrait capability required." }, 401);

  try {
    if (request.method === "DELETE") {
      await deletePortraitJob(jobId, accessToken);
      return new Response(null, {
        status: 204,
        headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
      });
    }

    const record = await getPortraitJob(jobId, accessToken);
    if (!record) {
      // If this capability owned an expired record, this removes it. A forged
      // capability matches nothing and receives the same queued response.
      await deletePortraitJob(jobId, accessToken);
      return json({ status: "queued" });
    }
    return json(record);
  } catch (reason) {
    console.error("Portrait status storage failed", reason);
    return json({ error: "Portrait storage is temporarily unavailable." }, 503);
  }
};

export const config: Config = {
  path: "/api/interpret/:jobId",
  method: ["GET", "DELETE"],
  rateLimit: {
    windowLimit: 120,
    windowSize: 180,
    aggregateBy: ["ip", "domain"],
  },
};
