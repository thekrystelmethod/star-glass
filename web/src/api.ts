import type { StarGlassTheme } from "./theme/themes";

export const ENGINE_URL = (import.meta.env.VITE_ENGINE_URL || "https://star-glass-engine.onrender.com").replace(/\/+$/, "");

export interface BirthPayload {
  date: string;
  time: string;
  tz: string;
  lat: number;
  lon: number;
  zodiac: "tropical" | "sidereal" | "dual";
  house_system: string;
  orbs: "tight" | "standard" | "wide";
  quincunx: boolean;
  minor_aspects: boolean;
  vedic: boolean;
}

export interface Placement {
  sign: string;
  degree_in_sign: number;
  minute: number;
  house: number;
  retrograde?: boolean;
  display: string;
}

export interface ChartBlock {
  placements: Record<string, Placement>;
  angles: Record<string, Placement>;
  house_cusps: Placement[];
  aspects: Array<{ bodies: [string, string]; aspect: string; orb: number; tight?: boolean }>;
  weighting?: Record<string, unknown>;
}

export interface ChartResponse {
  input: Record<string, unknown>;
  tropical?: ChartBlock;
  sidereal_lahiri?: ChartBlock;
}

async function request(path: string, body: unknown, responseType: "json" | "text" = "json") {
  const response = await fetch(`${ENGINE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).detail || ""; } catch (_) {}
    throw new Error(detail || `${path} returned ${response.status}`);
  }
  return responseType === "text" ? response.text() : response.json();
}

export async function checkEngine() {
  const response = await fetch(`${ENGINE_URL}/health`);
  if (!response.ok) throw new Error("The chart engine is not answering yet.");
  return response.json();
}

export async function castChart(birth: BirthPayload): Promise<ChartResponse> {
  return request("/chart", birth) as Promise<ChartResponse>;
}

export async function renderWheel(
  chart: ChartResponse,
  zodiacBlock: "tropical" | "sidereal",
  theme: StarGlassTheme,
  subtitle: string,
) {
  return request("/wheel", {
    chart,
    zodiac_block: zodiacBlock,
    size: 1100,
    title: "Natal chart",
    subtitle,
    palette: theme.wheel,
    transparent: true,
  }, "text") as Promise<string>;
}

export function activeChartBlock(chart: ChartResponse, block: "tropical" | "sidereal") {
  return block === "tropical"
    ? chart.tropical ?? chart.sidereal_lahiri!
    : chart.sidereal_lahiri ?? chart.tropical!;
}
