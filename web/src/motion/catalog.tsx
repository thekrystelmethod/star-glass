import {
  AuroraMesh, BreathingGlow, Constellation, CrystallizeShimmer, DriftingBlobs,
  PlasmaFlow, QuietBg, SigilBloom, SpectralScan,
  type BgProps, type MomentProps,
} from "./effects";
import { GlyphField } from "./GlyphField";

// The StarGlass motion catalog — atmospheres run behind everything; a moment
// plays once when the portrait crystallizes. All entries are live components
// (variant="contained" gives an in-card preview, "fixed" the app background).

export interface AtmosphereEntry {
  id: string;
  label: string;
  note: string;
  Component: (p: BgProps) => JSX.Element;
}
export interface MomentEntry {
  id: string;
  label: string;
  note: string;
  Component: (p: MomentProps) => JSX.Element | null;
}

export const ATMOSPHERES: AtmosphereEntry[] = [
  { id: "quiet", label: "Quiet", note: "The register without an ambient layer.", Component: QuietBg },
  { id: "aurora", label: "Aurora Mesh", note: "A living mesh-gradient turning slowly beneath the page.", Component: AuroraMesh },
  { id: "constellation", label: "Constellation", note: "A particle lattice — every star threaded to its neighbours.", Component: Constellation },
  { id: "glyphs", label: "Glyph Field", note: "The sky decoding itself: planet glyphs, degrees, and the movements as ghost-words.", Component: GlyphField },
  { id: "blobs", label: "Drifting Blobs", note: "Three blurred orbs on slow, unequal loops.", Component: DriftingBlobs },
  { id: "plasma", label: "Plasma Flow", note: "One liquid gradient that drifts. The gentlest on battery.", Component: PlasmaFlow },
  { id: "glow", label: "Breathing Glow", note: "A single glow that breathes. The quiet option with a pulse.", Component: BreathingGlow },
];

export const MOMENTS: MomentEntry[] = [
  { id: "sigil", label: "Sigil Bloom", note: "Twin rings counter-rotate around a charging core; the sigil detonates as your portrait lands.", Component: SigilBloom },
  { id: "spectral", label: "Spectral Scan", note: "Starlight through a prism: the emission line prints the portrait top to bottom.", Component: SpectralScan },
  { id: "crystallize", label: "Crystallize", note: "A seed of light grows a faceted lattice; the reading shimmers into place.", Component: CrystallizeShimmer },
];

export const DEFAULT_ATMOSPHERE = "aurora";
export const DEFAULT_MOMENT = "sigil";

// Old atmosphere ids (pre-port) → their nearest new equivalent.
const LEGACY: Record<string, string> = { breathing: "glow", bloom: "aurora" };

export function migrateAtmosphereId(id: string | null | undefined): string {
  if (!id) return DEFAULT_ATMOSPHERE;
  const mapped = LEGACY[id] ?? id;
  return ATMOSPHERES.some((a) => a.id === mapped) ? mapped : DEFAULT_ATMOSPHERE;
}

export function atmosphereById(id: string) {
  return ATMOSPHERES.find((a) => a.id === id) ?? ATMOSPHERES[0];
}
export function momentById(id: string) {
  return MOMENTS.find((m) => m.id === id) ?? MOMENTS[0];
}

/** The app-wide ambient layer. Sits in the .app-atmosphere slot (fixed, z 0). */
export function Atmosphere({ id }: { id: string }) {
  const entry = atmosphereById(id);
  if (entry.id === "quiet") return null;
  const Bg = entry.Component;
  return (
    <div className="app-atmosphere" aria-hidden="true">
      <Bg variant="contained" />
    </div>
  );
}

/** The ceremony overlay: plays the chosen moment once per trigger change. */
export function CeremonyMoment({ momentId, trigger }: { momentId: string; trigger: string | null }) {
  const { Component } = momentById(momentId);
  return <Component trigger={trigger} />;
}
