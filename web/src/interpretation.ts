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

/** A claim the audit could not reconcile with the calculated chart. */
export interface UnreconciledClaim {
  find: string;
  reason: string;
}

/**
 * How a compose attempt ended, and — crucially — whether composing again can
 * possibly end differently.
 *
 *  - "transient": the draft was written but the verification apparatus itself
 *    faltered (an audit call failed, a repair broke the schema, the function
 *    crashed, the request was rate-limited, the client stopped waiting).
 *    Composing again is a genuinely different roll of the dice.
 *
 *  - "held": the portrait is complete and preserved server-side, but one
 *    concrete claim in it contradicts the ledger and could not be repaired.
 *    Composing again CANNOT help. The composer varies its prose (temperature
 *    0.7) while the ledger it is checked against is byte-identical for a given
 *    chart and the auditors run at temperature 0 — so a chart whose geometry
 *    the whitelist cannot admit trips the same finding on every fresh draft.
 *    Offering "try again" here is the bug that cost two days of debugging.
 *
 *  - "blocked": the request cannot be served as posed and no draft exists.
 */
export type ReadingFailureKind = "transient" | "held" | "blocked";

/** Stages from interpret.ts where the draft survived but the checker did not. */
const TRANSIENT_STAGES = new Set([
  "audit-unavailable",
  "repair-schema",
  "referee-unavailable",
  "referee-schema",
  "final-audit-unavailable",
  "compose-structure",
  "compose-gateway",
  "crashed",
]);

/** Stages where the chart and the ledger genuinely disagree. Terminal. */
const HELD_STAGES = new Set([
  "held-unrepairable",
  "held-contradiction",
  "referee-unlocatable",
]);

/** Stages that reject the request itself. Nothing to show, nothing to retry. */
const BLOCKED_STAGES = new Set([
  "invalid-chart",
  "oversized-chart",
  "unconfigured",
  "paused",
]);

function classifyStage(stage: string | undefined, hasDraft: boolean): ReadingFailureKind {
  if (stage && HELD_STAGES.has(stage)) return "held";
  if (stage && BLOCKED_STAGES.has(stage)) return "blocked";
  if (stage && TRANSIENT_STAGES.has(stage)) return "transient";
  // An unrecognised stage is treated as transient only when there is no draft
  // to show; with a draft in hand, showing it beats guessing.
  return hasDraft ? "held" : "transient";
}

/** The blob stores the held draft as `unknown`; trust it only if it is shaped
    like a portrait. A malformed draft degrades to "nothing to show". */
function asDraft(value: unknown): GeneratedReading | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<GeneratedReading>;
  if (typeof candidate.title !== "string" || typeof candidate.framing !== "string") return null;
  if (!Array.isArray(candidate.movements) || candidate.movements.length === 0) return null;
  return candidate as GeneratedReading;
}

function asClaims(value: unknown): UnreconciledClaim[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as { find?: unknown; reason?: unknown };
    if (typeof entry.find !== "string" || typeof entry.reason !== "string") return [];
    return [{ find: entry.find, reason: entry.reason }];
  });
}

/**
 * A compose attempt that did not publish, carrying everything the UI needs to
 * respond honestly: what stopped it, whether retrying can help, and the
 * preserved portrait when one exists.
 */
export class ReadingFailure extends Error {
  readonly kind: ReadingFailureKind;
  readonly stage: string;
  readonly draft: GeneratedReading | null;
  readonly unreconciled: UnreconciledClaim[];

  constructor(init: {
    message: string;
    kind: ReadingFailureKind;
    stage: string;
    draft?: GeneratedReading | null;
    unreconciled?: UnreconciledClaim[];
  }) {
    super(init.message);
    this.name = "ReadingFailure";
    this.kind = init.kind;
    this.stage = init.stage;
    this.draft = init.draft ?? null;
    this.unreconciled = init.unreconciled ?? [];
  }

  /** Whether a "compose again" button can honestly be offered. */
  get retryable(): boolean {
    return this.kind === "transient";
  }
}

/** Normalise anything thrown by the compose path into a ReadingFailure. */
export function asReadingFailure(reason: unknown): ReadingFailure {
  if (reason instanceof ReadingFailure) return reason;
  return new ReadingFailure({
    message: reason instanceof Error ? reason.message : "StarGlass could not compose the reading.",
    kind: "transient",
    stage: "unknown",
  });
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

/** Poll a job until it publishes or stops. The background function reports its
    phase while working; onPhase lets the UI narrate real progress. */
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
      stage?: string;
      phase?: string;
      round?: number;
      reading?: GeneratedReading;
      error?: string;
      held?: { reading?: unknown; corrections?: unknown };
    };
    if (status.status === "working" && status.phase && onPhase) {
      onPhase({ phase: status.phase, round: status.round });
    }
    if (status.status === "ready" && status.reading) { forgetJob(); return status.reading; }

    // "held" and "error" are both terminal for THIS job. What differs is
    // whether a fresh job would fare any better, and whether a finished
    // portrait is sitting in the record waiting to be shown. Both answers
    // are already in the payload — read them rather than discarding them.
    if (status.status === "held" || status.status === "error") {
      forgetJob();
      const draft = asDraft(status.held?.reading);
      throw new ReadingFailure({
        message: status.error || "StarGlass could not compose the reading.",
        kind: classifyStage(status.stage, Boolean(draft)),
        stage: status.stage || "unknown",
        draft,
        unreconciled: asClaims(status.held?.corrections),
      });
    }
  }
  forgetJob();
  throw new ReadingFailure({
    message: "The portrait outlasted the time this page waits for it. It may well have finished composing — opening the chart again is safe.",
    kind: "transient",
    stage: "client-timeout",
  });
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
      throw new ReadingFailure({
        message: "That is several casts in quick succession, and the composing room only takes so many at once. Nothing is wrong with your chart — wait a minute or two, then compose again.",
        kind: "transient",
        stage: "rate-limited",
      });
    }
    const payload = await response.json().catch(() => ({}));
    throw new ReadingFailure({
      message: payload.error || "StarGlass could not begin the reading.",
      kind: "transient",
      stage: "start-failed",
    });
  }

  rememberJob(jobId);
  return awaitReading(jobId, Date.now() + 12 * 60_000, onPhase);
}
