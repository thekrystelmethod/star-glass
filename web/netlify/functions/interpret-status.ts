import { getStore } from "@netlify/blobs";

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "cache-control": "no-store" },
});

export default async (_request: Request, context: { params: { jobId?: string } }) => {
  const jobId = context.params.jobId;
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) return json({ error: "Invalid portrait id." }, 400);

  const store = getStore({ name: "starglass-readings", consistency: "strong" });
  const record = await store.get(`portrait:${jobId}`, { type: "json" });
  return json(record ?? { status: "queued" });
};

export const config = {
  path: "/api/interpret/:jobId",
  method: "GET",
  rateLimit: {
    windowLimit: 120,
    windowSize: 180,
    aggregateBy: ["ip", "domain"],
  },
};
