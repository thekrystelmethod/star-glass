// The StarGlass Codex — client for the compiled interpretation graph.
// Pure retrieval: every word was authored at build time and ships as static
// JSON under /codex/. Nothing generates at runtime; this module only fetches,
// caches, and resolves node IDs so the panel can walk edges.

export interface CodexEntry {
  id: string;
  title: string;
  body: string[];
  invitation?: string;
  edges?: {
    point?: string;
    sign?: string;
    house?: number;
    see_also?: string[];
  };
}

export interface CanonCore {
  id: string;
  name: string;
  glyph?: string;
  core: string;
  shadow?: string;
  arc?: string;
  element_mode?: string;
  itch?: string;
}

interface PointFile {
  point: string;
  name: string;
  glyph: string;
  in_sign: Record<string, CodexEntry>;
  in_house: Record<string, CodexEntry>;
}

interface CanonFile {
  points: Record<string, CanonCore>;
  signs: Record<string, CanonCore>;
  aspects: Record<string, CanonCore>;
}

// Chart body name → codex file stem. South Node has no file by design.
export const CODEX_POINT_FILE: Record<string, string> = {
  Sun: "sun", Moon: "moon", Mercury: "mercury", Venus: "venus", Mars: "mars",
  Jupiter: "jupiter", Saturn: "saturn", Uranus: "uranus", Neptune: "neptune",
  Pluto: "pluto", Chiron: "chiron", "North Node": "north-node",
};

const POINT_KEY_TO_FILE: Record<string, string> = {
  sun: "sun", moon: "moon", mercury: "mercury", venus: "venus", mars: "mars",
  jupiter: "jupiter", saturn: "saturn", uranus: "uranus", neptune: "neptune",
  pluto: "pluto", chiron: "chiron", north_node: "north-node",
};

export function hasCodexEntry(bodyName: string) {
  return bodyName in CODEX_POINT_FILE;
}

const cache = new Map<string, Promise<unknown>>();

function fetchJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((response) => {
      if (!response.ok) { cache.delete(path); throw new Error(`Codex fetch failed: ${path}`); }
      return response.json();
    }).catch((reason) => { cache.delete(path); throw reason; }));
  }
  return cache.get(path) as Promise<T>;
}

export const loadPointFile = (fileStem: string) => fetchJson<PointFile>(`/codex/${fileStem}.json`);
export const loadRisings = () => fetchJson<{ risings: Record<string, CodexEntry> }>("/codex/risings.json");
export const loadHouses = () => fetchJson<{ houses: Record<string, CodexEntry> }>("/codex/houses.json");
export const loadCanon = () => fetchJson<CanonFile>("/codex/canon.json");

// A resolved node ready for the panel: canonical header line plus entries.
export interface CodexNode {
  id: string;
  glyph?: string;
  heading: string;
  subheading?: string;
  canonLine?: string;
  canonArc?: string;
  sections: Array<{ label?: string; entry: CodexEntry }>;
  seeAlso: string[];
}

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 10 > 3 || Math.floor(n / 10) === 1) ? 0 : n % 10]}`;

function collectSeeAlso(entries: Array<CodexEntry | undefined>): string[] {
  const ids: string[] = [];
  for (const entry of entries) {
    for (const id of entry?.edges?.see_also ?? []) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** A placement in this chart: canon core + in-sign entry + in-house entry. */
export async function resolvePlacement(bodyName: string, sign: string, house: number): Promise<CodexNode> {
  const stem = CODEX_POINT_FILE[bodyName];
  if (!stem) throw new Error(`No codex entry for ${bodyName}`);
  const [file, canon] = await Promise.all([loadPointFile(stem), loadCanon()]);
  const signKey = sign.toLowerCase();
  const inSign = file.in_sign[signKey];
  const inHouse = file.in_house[String(house)];
  const core = canon.points[file.point];
  const sections: CodexNode["sections"] = [];
  if (inSign) sections.push({ label: `${file.name} in ${sign}`, entry: inSign });
  if (inHouse) sections.push({ label: `${file.name} in the ${ord(house)} house`, entry: inHouse });
  return {
    id: inSign?.id ?? `${file.point}_${signKey}`,
    glyph: file.glyph,
    heading: `${file.name} in ${sign}`,
    subheading: `${ord(house)} house`,
    canonLine: core?.core,
    canonArc: core?.arc,
    sections,
    seeAlso: collectSeeAlso([inSign, inHouse]),
  };
}

/** The Ascendant: rising entry for the sign. */
export async function resolveRising(sign: string): Promise<CodexNode> {
  const [risings, canon] = await Promise.all([loadRisings(), loadCanon()]);
  const signKey = sign.toLowerCase();
  const entry = risings.risings[signKey];
  if (!entry) throw new Error(`No rising entry for ${sign}`);
  const core = canon.signs[signKey];
  return {
    id: entry.id,
    heading: `${cap(signKey)} rising`,
    subheading: "The Ascendant — how the world meets you",
    canonLine: core?.core,
    sections: [{ entry }],
    seeAlso: collectSeeAlso([entry]),
  };
}

/** Resolve any node ID a see_also edge can carry. */
export async function resolveNodeId(id: string): Promise<CodexNode> {
  // canon:<key> — points, signs, or aspects
  if (id.startsWith("canon:")) {
    const key = id.slice(6);
    const canon = await loadCanon();
    const core = canon.points[key] ?? canon.signs[key] ?? canon.aspects[key];
    if (!core) throw new Error(`Unknown canon node ${id}`);
    const body: string[] = [core.core];
    if (core.shadow) body.push(`Shadow: ${core.shadow}`);
    if (core.itch) body.push(`The itch: ${core.itch}`);
    if (core.arc) body.push(`The arc: ${core.arc}`);
    return {
      id, glyph: core.glyph, heading: core.name,
      subheading: core.element_mode ?? "Canon core",
      sections: [{ entry: { id, title: core.name, body } }],
      seeAlso: [],
    };
  }
  // house_N — house essay
  const houseMatch = id.match(/^house_(\d{1,2})$/);
  if (houseMatch) {
    const n = Number(houseMatch[1]);
    const houses = await loadHouses();
    const entry = houses.houses[String(n)];
    if (!entry) throw new Error(`Unknown house ${id}`);
    return {
      id, heading: `The ${ord(n)} house`, subheading: entry.title,
      sections: [{ entry }], seeAlso: collectSeeAlso([entry]),
    };
  }
  // <sign>_rising
  const risingMatch = id.match(/^([a-z]+)_rising$/);
  if (risingMatch) return resolveRising(cap(risingMatch[1]));
  // <point>_in_house_N
  const inHouseMatch = id.match(/^([a-z_]+)_in_house_(\d{1,2})$/);
  if (inHouseMatch) {
    const stem = POINT_KEY_TO_FILE[inHouseMatch[1]];
    const file = await loadPointFile(stem);
    const entry = file.in_house[inHouseMatch[2]];
    if (!entry) throw new Error(`Unknown node ${id}`);
    return {
      id, glyph: file.glyph, heading: entry.title,
      subheading: `${file.name} in the ${ord(Number(inHouseMatch[2]))} house`,
      sections: [{ entry }], seeAlso: collectSeeAlso([entry]),
    };
  }
  // <point>_in_<sign>
  const inSignMatch = id.match(/^([a-z_]+)_in_([a-z]+)$/);
  if (inSignMatch && POINT_KEY_TO_FILE[inSignMatch[1]]) {
    const file = await loadPointFile(POINT_KEY_TO_FILE[inSignMatch[1]]);
    const entry = file.in_sign[inSignMatch[2]];
    if (!entry) throw new Error(`Unknown node ${id}`);
    return {
      id, glyph: file.glyph, heading: entry.title,
      subheading: `${file.name} in ${cap(inSignMatch[2])}`,
      sections: [{ entry }], seeAlso: collectSeeAlso([entry]),
    };
  }
  throw new Error(`Unrecognised codex id ${id}`);
}

/** Human label for a see-also chip, without fetching. */
export function chipLabel(id: string): string {
  if (id.startsWith("canon:")) return cap(id.slice(6).replace(/_/g, " "));
  const house = id.match(/^house_(\d{1,2})$/);
  if (house) return `The ${ord(Number(house[1]))} house`;
  const rising = id.match(/^([a-z]+)_rising$/);
  if (rising) return `${cap(rising[1])} rising`;
  const inHouse = id.match(/^([a-z_]+)_in_house_(\d{1,2})$/);
  if (inHouse) return `${cap(inHouse[1].replace(/_/g, " "))} in the ${ord(Number(inHouse[2]))}`;
  const inSign = id.match(/^([a-z_]+)_in_([a-z]+)$/);
  if (inSign) return `${cap(inSign[1].replace(/_/g, " "))} in ${cap(inSign[2])}`;
  return id;
}
