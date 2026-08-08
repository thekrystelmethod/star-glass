import type { ChartResponse } from "./api";
import type { BirthFormState, GeneratedReading } from "./types";

interface InterpretationRequest {
  chart: ChartResponse;
  zodiac: BirthFormState["zodiac"];
  essence: BirthFormState["essence"];
}

export async function composeReading(input: InterpretationRequest): Promise<GeneratedReading> {
  const jobId = crypto.randomUUID();
  const response = await fetch("/api/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...input, jobId }),
  });

  if (!response.ok && response.status !== 202) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "StarGlass could not begin the reading.");
  }

  const deadline = Date.now() + 12 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 3_000));
    const statusResponse = await fetch(`/api/interpret/${jobId}`, { cache: "no-store" });
    if (!statusResponse.ok) continue;
    const status = await statusResponse.json() as {
      status?: "queued" | "working" | "ready" | "error";
      reading?: GeneratedReading;
      error?: string;
    };
    if (status.status === "ready" && status.reading) return status.reading;
    if (status.status === "error") throw new Error(status.error || "StarGlass could not compose the reading.");
  }

  throw new Error("The portrait is still taking shape. Please try the reading once more.");
}
