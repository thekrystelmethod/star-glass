declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JOB_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const JOB_TTL_MS = 24 * 60 * 60 * 1_000;
const TERMINAL_STATUSES = new Set(["ready", "held", "error"]);

export interface PortraitRecord extends Record<string, unknown> {
  status: "queued" | "working" | "ready" | "held" | "error";
  startedAt?: string;
  updatedAt?: string;
}

interface PortraitRow {
  job_id: string;
  access_token_hash: string;
  status: PortraitRecord["status"];
  record: PortraitRecord;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export function validPortraitJobId(value: unknown): value is string {
  return typeof value === "string" && JOB_ID.test(value);
}

export function validPortraitJobToken(value: unknown): value is string {
  return typeof value === "string" && JOB_TOKEN.test(value);
}

function configuration() {
  const origin = Netlify.env.get("SUPABASE_URL")?.trim().replace(/\/$/, "");
  const secret = Netlify.env.get("SUPABASE_SECRET_KEY")?.trim();
  if (!origin || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin) || !secret) {
    throw new Error("Portrait storage is not configured.");
  }
  return { origin, secret };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function dataRequest(path: string, init: RequestInit) {
  const { origin, secret } = configuration();
  return fetch(`${origin}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secret,
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

function dates(startedAt: string | undefined) {
  const parsed = startedAt ? Date.parse(startedAt) : Number.NaN;
  const createdMs = Number.isFinite(parsed) ? parsed : Date.now();
  const createdAt = new Date(createdMs).toISOString();
  return {
    createdAt,
    expiresAt: new Date(createdMs + JOB_TTL_MS).toISOString(),
  };
}

/**
 * A writer is bound to one high-entropy capability for its whole invocation.
 * The first write must insert; later writes must match both the UUID and the
 * capability hash, so a colliding UUID can never rotate ownership.
 */
export async function createPortraitJobWriter(jobId: string, accessToken: string, startedAt?: string) {
  if (!validPortraitJobId(jobId) || !validPortraitJobToken(accessToken)) {
    throw new Error("Invalid portrait capability.");
  }

  const accessTokenHash = await sha256(accessToken);
  const { createdAt, expiresAt } = dates(startedAt);
  let inserted = false;

  return async (value: PortraitRecord) => {
    const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString();
    const record: PortraitRecord = { ...value, createdAt, expiresAt };
    if (!inserted) {
      const row: PortraitRow = {
        job_id: jobId,
        access_token_hash: accessTokenHash,
        status: record.status,
        record,
        created_at: createdAt,
        updated_at: updatedAt,
        expires_at: expiresAt,
      };
      const response = await dataRequest("portrait_jobs", {
        method: "POST",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify(row),
      });
      if (!response.ok) throw new Error(`Portrait storage insert failed (${response.status}).`);
      inserted = true;
      return;
    }

    const query = new URLSearchParams({
      job_id: `eq.${jobId}`,
      access_token_hash: `eq.${accessTokenHash}`,
    });
    const response = await dataRequest(`portrait_jobs?${query}`, {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ status: record.status, record, updated_at: updatedAt }),
    });
    if (!response.ok) throw new Error(`Portrait storage update failed (${response.status}).`);
    const rows = await response.json() as unknown[];
    if (rows.length !== 1) throw new Error("Portrait storage capability no longer owns this job.");
  };
}

export async function getPortraitJob(jobId: string, accessToken: string): Promise<PortraitRecord | null> {
  if (!validPortraitJobId(jobId) || !validPortraitJobToken(accessToken)) return null;
  const accessTokenHash = await sha256(accessToken);
  const query = new URLSearchParams({
    select: "record",
    job_id: `eq.${jobId}`,
    access_token_hash: `eq.${accessTokenHash}`,
    expires_at: `gt.${new Date().toISOString()}`,
    limit: "1",
  });
  const response = await dataRequest(`portrait_jobs?${query}`, { method: "GET" });
  if (!response.ok) throw new Error(`Portrait storage read failed (${response.status}).`);
  const rows = await response.json() as Array<{ record?: PortraitRecord }>;
  return rows[0]?.record ?? null;
}

/** Hard-delete a terminal or abandoned job. The operation is idempotent. */
export async function deletePortraitJob(jobId: string, accessToken: string): Promise<void> {
  if (!validPortraitJobId(jobId) || !validPortraitJobToken(accessToken)) return;
  const accessTokenHash = await sha256(accessToken);
  const query = new URLSearchParams({
    job_id: `eq.${jobId}`,
    access_token_hash: `eq.${accessTokenHash}`,
  });
  const response = await dataRequest(`portrait_jobs?${query}`, {
    method: "DELETE",
    headers: { prefer: "return=minimal" },
  });
  if (!response.ok) throw new Error(`Portrait storage deletion failed (${response.status}).`);
}

/** Opportunistic cleanup bounds abandoned jobs even before a scheduled sweep exists. */
export async function purgeExpiredPortraitJobs(): Promise<void> {
  const query = new URLSearchParams({ expires_at: `lte.${new Date().toISOString()}` });
  const response = await dataRequest(`portrait_jobs?${query}`, {
    method: "DELETE",
    headers: { prefer: "return=minimal" },
  });
  if (!response.ok) throw new Error(`Portrait storage cleanup failed (${response.status}).`);
}

export function isTerminalPortrait(record: PortraitRecord) {
  return TERMINAL_STATUSES.has(record.status);
}
