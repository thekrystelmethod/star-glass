import type { ChartResponse } from "./api";
import type { BirthFormState, GeneratedReading } from "./types";

interface InterpretationRequest {
  chart: ChartResponse;
  zodiac: BirthFormState["zodiac"];
  essence: BirthFormState["essence"];
}

export interface ReadingPhase {
  phase: "composing" | "auditing" | "repairing" | "refereeing" | string;
  round?: number;
}

const PENDING_KEY = "starglass-pending-job";
const JOB_LIFETIME = 15 * 60_000;

interface PendingJob {
  jobId: string;
  startedAt: number;
}

function rememberJob(jobId: string) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ jobId, startedAt: Date.now() }));
  } catch (_) {}
}

function forgetJob() {
  try { window.sessionStorage.removeItem(PENDING_KEY); } catch (_) {}
}

/** A compose job started in this tab that may still be running server-side —
    survives a page refresh so the portrait is resumed, never abandoned. */
export function pendingReadingJob(): PendingJob | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const job = JSON.parse(raw) as PendingJob;
    if (!job || typeof job.jobId !== "string" || typeof job.startedAt !== "number") return null;
    if (Date.now() - job.startedAt > JOB_LIFETIME) { forgetJob(); return null; }
    return job;
  } catch (_) {
    return null;
  }
}

/** Poll a job until it publishes or errors. The background function reports
    its phase while working; onPhase lets the UI narrate real progress. */
export async function awaitReading(
  jobId: string,
  deadlineAt: number,
  onPhase?: (phase: ReadingPhase) => void,
): Promise<GeneratedReading> {
  while (Date.now() < deadlineAt) {
    await new Promise((resolve) => window.setTimeout(resolve, 3_000));
    const statusResponse = await fetch(`/api/interpret/${jobId}`, { cache: "no-store" });
    if (!statusResponse.ok) continue;
    const status = await statusResponse.json() as {
      status?: "queued" | "working" | "ready" | "held" | "error";
      phase?: string;
      round?: number;
      reading?: GeneratedReading;
      error?: string;
    };
    if (status.status === "working" && status.phase && onPhase) {
      onPhase({ phase: status.phase, round: status.round });
    }
    if (status.status === "ready" && status.reading) { forgetJob(); return status.reading; }
    // "held" is a terminal state: the audit could not reconcile the draft, but
    // the draft itself is preserved server-side rather than discarded.
    if (status.status === "held") { forgetJob(); throw new Error(status.error || "StarGlass held this portrait for review. Please compose it once more."); }
    if (status.status === "error") { forgetJob(); throw new Error(status.error || "StarGlass could not compose the reading."); }
  }
  forgetJob();
  throw new Error("The portrait is still taking shape. Please try the reading once more.");
}

export async function composeReading(
  input: InterpretationRequest,
  onPhase?: (phase: ReadingPhase) => void,
): Promise<GeneratedReading> {
  const jobId = crypto.randomUUID();
  const response = await fetch("/api/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...input, jobId }),
  });

  if (!response.ok && response.status !== 202) {
    if (response.status === 429) {
      throw new Error("The composing room is catching its breath. Wait a minute or two, then try once more.");
    }
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "StarGlass could not begin the reading.");
  }

  rememberJob(jobId);
  return awaitReading(jobId, Date.now() + 12 * 60_000, onPhase);
}
