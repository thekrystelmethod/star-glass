import { useEffect, useMemo, useRef, type CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────────────
// GlyphField — ported from the AI Design Atlas and re-voiced for StarGlass:
// the sky decoding itself. A constellation of glyph actors, each running its
// own dim lighting cue. The soul is the IRREGULAR TIMING, not the characters:
//   • three tempo bands (slow drift, medium flicker, rare bright ghost-word)
//   • signal-spike opacity with false starts — never symmetric
//   • per-glyph duration + negative delay → nothing pulses together
//   • a few glyphs periodically swap character → a signal being decoded
// Vocabulary is the chart's own language: planet and sign glyphs, degrees,
// aspects, houses — and the ghost words are the six movements of a portrait.
// Colours read the register tokens, so it re-skins with every theme.
// ─────────────────────────────────────────────────────────────────────────

const V = "\uFE0E"; // text-presentation selector — keeps glyphs from becoming emoji
const SINGLE = [
  `☉${V}`, `☽${V}`, `☿${V}`, `♀${V}`, `♂${V}`, `♃${V}`, `♄${V}`, `♅${V}`, `♆${V}`, `♇${V}`,
  `☊${V}`, `♈${V}`, `♊${V}`, `♌${V}`, `♎${V}`, `♐${V}`, `♒${V}`, `♓${V}`,
  "△", "□", "✶", "℞", "0", "3", "7", "9",
];
const TOKENS = [
  "24°58′", "ORB 2.1°", "TRINE", "SEXTILE", "SQUARE", "ASC", "MC", "IC", "DSC",
  "H8", "CUSP 4", "PLACIDUS", "LAHIRI", "DUAL", "0°23′ ℞",
];
const FRAGMENTS = [
  `[SUN → 8TH HOUSE]`, "MOON // WITNESSED", "TWO-WITNESS RULE", "STATE:RETROGRADE", `[ASC = LEO ♌${V}]`,
];
const GHOSTS = [
  "OVERTURE", "THE GROUND FLOOR", "THE INNER CAST", "THE MIRROR", "THE SUMMIT",
  "INTEGRATION", "SIGNAL // SKY", "STILLNESS", "TENSION",
];

const COLOR_CLASSES = ["", "g-accent", "g-uv", "g-accent", "", "g-flash"]; // accent lean, rare full-ink flash

const KF_ID = "atlas-glyphfield-css";
function ensureCss() {
  if (typeof document === "undefined" || document.getElementById(KF_ID)) return;
  const s = document.createElement("style");
  s.id = KF_ID;
  s.textContent = `
.atlas-glyphfield{ isolation:isolate; }
.atlas-glyphfield .gf-grid{position:absolute;inset:-2px;opacity:.16;
  background-image:linear-gradient(color-mix(in srgb,var(--atlas-info) 12%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--atlas-accent) 10%,transparent) 1px,transparent 1px);
  background-size:76px 76px;-webkit-mask-image:radial-gradient(circle,#000 18%,transparent 82%);mask-image:radial-gradient(circle,#000 18%,transparent 82%);}
.atlas-glyphfield .gf-glyph{position:absolute;left:var(--x);top:var(--y);
  font-family:var(--font-mono,'IBM Plex Mono',ui-monospace,monospace);font-size:var(--size);font-weight:500;line-height:1;white-space:nowrap;letter-spacing:.04em;
  opacity:0;mix-blend-mode:var(--atlas-blend,screen);color:var(--atlas-info);
  text-shadow:0 0 5px color-mix(in srgb,var(--atlas-info) 70%,transparent),0 0 16px color-mix(in srgb,var(--atlas-accent) 30%,transparent);
  animation:atlas-gf-signal var(--duration) ease-in-out var(--delay) infinite, atlas-gf-drift calc(var(--duration) * 1.7) ease-in-out var(--delay) infinite alternate;}
.atlas-glyphfield .gf-glyph.g-accent{color:var(--atlas-accent);text-shadow:0 0 5px color-mix(in srgb,var(--atlas-accent) 70%,transparent),0 0 16px color-mix(in srgb,var(--atlas-info) 30%,transparent);}
.atlas-glyphfield .gf-glyph.g-uv{color:color-mix(in srgb,var(--atlas-accent) 55%, var(--atlas-info));}
.atlas-glyphfield .gf-glyph.g-flash{color:var(--atlas-text-1);}
.atlas-glyphfield .gf-glyph.gf-hit{font-weight:700;letter-spacing:.14em;
  animation:atlas-gf-hit var(--duration) ease-in-out var(--delay) infinite, atlas-gf-drift calc(var(--duration) * 1.9) ease-in-out var(--delay) infinite alternate;}
.atlas-glyphfield .gf-scan{position:absolute;inset:0;opacity:.10;mix-blend-mode:overlay;
  background:repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgb(255 255 255 / 4%) 4px);}
.atlas-glyphfield .gf-vig{position:absolute;inset:0;
  background:radial-gradient(circle at center,transparent 30%,var(--atlas-bg) 94%),linear-gradient(to bottom,color-mix(in srgb,var(--atlas-bg) 18%,transparent),transparent 35%,color-mix(in srgb,var(--atlas-bg) 45%,transparent));}
@keyframes atlas-gf-signal{
  0%,18%,100%{opacity:.015;filter:blur(1.4px)}
  22%{opacity:calc(.10 * var(--brightness))}
  25%{opacity:calc(.80 * var(--brightness));filter:blur(0)}
  28%{opacity:calc(.16 * var(--brightness))}
  31%{opacity:calc(.52 * var(--brightness))}
  38%,76%{opacity:calc(.045 * var(--brightness));filter:blur(.7px)}
}
@keyframes atlas-gf-hit{
  0%,44%,100%{opacity:.012;filter:blur(2px)}
  48%{opacity:calc(.92 * var(--brightness));filter:blur(0)}
  52%{opacity:calc(.18 * var(--brightness))}
  57%{opacity:.012;filter:blur(1.2px)}
}
@keyframes atlas-gf-drift{
  from{transform:translate3d(0,0,0) rotate(-2deg)}
  to{transform:translate3d(calc(var(--drift) * .35),calc(var(--drift) * -1),0) rotate(2deg)}
}
@media (prefers-reduced-motion: reduce){
  .atlas-glyphfield .gf-glyph{animation:none;opacity:.09}
}`;
  document.head.appendChild(s);
}

type Glyph = {
  char: string;
  cls: string;
  band: "single" | "token" | "hit";
  swappable: boolean;
  style: CSSProperties;
};

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildGlyphs(count: number): Glyph[] {
  return Array.from({ length: count }, () => {
    const roll = Math.random();
    let band: Glyph["band"], char: string, size: number, duration: number, brightness: number, swappable = false;
    if (roll < 0.70) {
      band = "single"; char = pick(SINGLE); size = 10 + Math.random() * 12;
      duration = 8 + Math.random() * 8; brightness = 0.25 + Math.random() * 0.6; swappable = true;
    } else if (roll < 0.92) {
      band = "token"; char = Math.random() < 0.7 ? pick(TOKENS) : pick(FRAGMENTS);
      size = 11 + Math.random() * 6; duration = 3 + Math.random() * 4; brightness = 0.5 + Math.random() * 0.5;
    } else {
      band = "hit"; char = pick(GHOSTS); size = 24 + Math.random() * 30;
      duration = 13 + Math.random() * 9; brightness = 0.7 + Math.random() * 0.3;
    }
    const style: CSSProperties = {
      ["--x" as string]: `${Math.random() * 100}%`,
      ["--y" as string]: `${Math.random() * 100}%`,
      ["--size" as string]: `${size}px`,
      ["--duration" as string]: `calc(${duration.toFixed(2)}s * var(--atlas-tempo, 1))`,
      ["--delay" as string]: `${(-Math.random() * duration).toFixed(2)}s`,
      ["--drift" as string]: `${(4 + Math.random() * 16).toFixed(1)}px`,
      ["--brightness" as string]: brightness.toFixed(2),
    };
    return { char, cls: pick(COLOR_CLASSES), band, swappable, style };
  });
}

interface Props {
  variant?: "fixed" | "contained";
  count?: number;
}

export function GlyphField({ variant, count }: Props) {
  useEffect(ensureCss, []);
  const n = count ?? (variant === "contained" ? 46 : 108);
  const glyphs = useMemo(() => buildGlyphs(n), [n]);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  // "decoding" — periodically swap a few single-char glyphs
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const swappable = glyphs.map((g, i) => (g.swappable ? i : -1)).filter((i) => i >= 0);
    if (!swappable.length) return;
    const id = window.setInterval(() => {
      const hits = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < hits; k++) {
        const idx = swappable[Math.floor(Math.random() * swappable.length)];
        const el = refs.current[idx];
        if (el) el.textContent = SINGLE[Math.floor(Math.random() * SINGLE.length)];
      }
    }, 850);
    return () => window.clearInterval(id);
  }, [glyphs]);

  const wrapper = `${variant === "contained" ? "motion-bg-contained" : "motion-bg-fixed"} atlas-glyphfield`;

  return (
    <div
      className={wrapper}
      aria-hidden
      style={{
        background:
          "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--atlas-accent) 10%, transparent), transparent 48%), var(--atlas-bg)",
      }}
    >
      <div className="gf-grid" />
      {glyphs.map((g, i) => (
        <span
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`gf-glyph ${g.cls}${g.band === "hit" ? " gf-hit" : ""}`}
          style={g.style}
        >
          {g.char}
        </span>
      ))}
      <div className="gf-scan" />
      <div className="gf-vig" />
    </div>
  );
}
