import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// StarGlass motion effects — ported from the AI Design Atlas motion system
// (execute_md/src/app/components/motion/effects.tsx), de-Tailwinded for this
// codebase. Every effect reads the active register's --atlas-* tokens, so
// switching theme re-skins them for free.
//   Backgrounds : props { variant?: "fixed" | "contained" }
//   Moments     : props { trigger: string | null }  (change trigger → play once)
// Moments are full séances: gather → surge → reveal → settle, ~3.4s base
// scaled by --atlas-tempo. Keyframes inject once; reduced motion respected.
// ─────────────────────────────────────────────────────────────────────────

type Blend = React.CSSProperties["mixBlendMode"];
const blend = "var(--atlas-blend, screen)" as Blend;

const KF_ID = "atlas-motion-keyframes";
function ensureKeyframes() {
  if (typeof document === "undefined" || document.getElementById(KF_ID)) return;
  const s = document.createElement("style");
  s.id = KF_ID;
  s.textContent = `
@keyframes atlas-drift1{0%{transform:translate(-30px,20px)}25%{transform:translate(120px,70px)}50%{transform:translate(160px,20px)}75%{transform:translate(80px,90px)}100%{transform:translate(-30px,20px)}}
@keyframes atlas-drift2{0%{transform:translate(160px,-20px)}33%{transform:translate(40px,80px)}66%{transform:translate(190px,90px)}100%{transform:translate(160px,-20px)}}
@keyframes atlas-drift3{0%{transform:translate(80px,110px)}30%{transform:translate(10px,15px)}60%{transform:translate(170px,45px)}100%{transform:translate(80px,110px)}}
@keyframes atlas-plasma{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes atlas-aurora-spin{from{transform:rotate(0)scale(1.15)}to{transform:rotate(360deg)scale(1.15)}}
@keyframes atlas-breathe{0%,100%{transform:translate(-50%,-50%)scale(.82);opacity:.5}50%{transform:translate(-50%,-50%)scale(1.15);opacity:1}}
@keyframes atlas-veil{0%{opacity:0}10%{opacity:1}78%{opacity:1}100%{opacity:0}}
@keyframes atlas-bloom{0%{opacity:0;transform:translate(-50%,-50%)scale(.5)}35%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%)scale(1.9)}}
@keyframes atlas-shock{0%{opacity:.9;transform:translate(-50%,-50%)scale(.15)}100%{opacity:0;transform:translate(-50%,-50%)scale(2.4)}}
@keyframes atlas-spec-warm{0%{opacity:0}25%{opacity:.9}55%{opacity:.25}80%{opacity:.6}100%{opacity:0}}
@keyframes atlas-scan{0%{top:-4%;opacity:0}6%{opacity:1}88%{opacity:1}100%{top:103%;opacity:0}}
@keyframes atlas-print{0%{height:0%;opacity:.32}82%{height:100%;opacity:.22}100%{height:100%;opacity:0}}
@keyframes atlas-scan-echo{0%{top:103%;opacity:0}14%{opacity:.75}100%{top:-4%;opacity:0}}
@keyframes atlas-seed{0%{opacity:0;transform:translate(-50%,-50%)scale(.2)}30%{opacity:1;transform:translate(-50%,-50%)scale(1)}70%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%)scale(1.4)}}
@keyframes atlas-shard{0%{opacity:0;transform:scale(0)rotate(var(--shard-rot,0deg))}40%{opacity:1;transform:scale(1.06)rotate(var(--shard-rot,0deg))}62%{opacity:.95;transform:scale(1)rotate(var(--shard-rot,0deg))}88%{opacity:.9}100%{opacity:0;transform:scale(1.04)rotate(var(--shard-rot,0deg))}}
@keyframes atlas-glint{0%,55%{filter:brightness(1)}63%{filter:brightness(2.4)}72%,100%{filter:brightness(1)}}
@keyframes atlas-shimmer{0%{opacity:0;background-position:120% 0;filter:blur(3px)}30%{opacity:1}85%{opacity:1;background-position:-40% 0;filter:blur(0)}100%{opacity:0}}
@keyframes atlas-sigil-cw{0%{opacity:0;transform:translate(-50%,-50%)scale(.25)rotate(0)}30%{opacity:1;transform:translate(-50%,-50%)scale(1)rotate(140deg)}78%{opacity:1;transform:translate(-50%,-50%)scale(1.04)rotate(330deg)}100%{opacity:0;transform:translate(-50%,-50%)scale(1.8)rotate(400deg)}}
@keyframes atlas-sigil-ccw{0%{opacity:0;transform:translate(-50%,-50%)scale(.4)rotate(0)}35%{opacity:.9;transform:translate(-50%,-50%)scale(1)rotate(-120deg)}78%{opacity:.9;transform:translate(-50%,-50%)scale(1.06)rotate(-300deg)}100%{opacity:0;transform:translate(-50%,-50%)scale(2)rotate(-380deg)}}
@keyframes atlas-charge{0%{opacity:0;transform:translate(-50%,-50%)scale(.4)}25%{opacity:.9;transform:translate(-50%,-50%)scale(.72)}45%{opacity:.55;transform:translate(-50%,-50%)scale(.88)}65%{opacity:1;transform:translate(-50%,-50%)scale(1.05)}100%{opacity:0;transform:translate(-50%,-50%)scale(1.5)}}
@keyframes atlas-rays{0%,55%{opacity:0;transform:translate(-50%,-50%)scale(.5)rotate(0)}68%{opacity:.95;transform:translate(-50%,-50%)scale(1.15)rotate(8deg)}100%{opacity:0;transform:translate(-50%,-50%)scale(1.9)rotate(14deg)}}
@media (prefers-reduced-motion: reduce){
  [data-atlas-motion]{animation:none !important}
  [data-atlas-motion-once]{animation-duration:1ms !important;animation-delay:0ms !important}
}`;
  document.head.appendChild(s);
}

function bgClass(variant?: "fixed" | "contained") {
  return variant === "contained" ? "motion-bg-contained" : "motion-bg-fixed";
}

export interface BgProps {
  variant?: "fixed" | "contained";
}
export interface MomentProps {
  trigger: string | null;
}

// hex → "r,g,b" for canvas effects that read CSS tokens
function hexToRgb(h: string) {
  h = h.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h || "888888", 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
function tokenRgb(name: string) {
  if (typeof document === "undefined") return "136,136,136";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return hexToRgb(v || "#888888");
}
function tempoScale() {
  if (typeof document === "undefined") return 1;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--atlas-tempo"));
  return Number.isFinite(v) && v > 0 ? v : 1;
}
function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// séance player: plays for the effect's full choreography, then unmounts.
function useSequence(trigger: string | null, totalBase: number) {
  const [playing, setPlaying] = useState(false);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (trigger && trigger !== prev.current) {
      prev.current = trigger;
      setPlaying(false);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const raf = requestAnimationFrame(() => {
        setPlaying(true);
        timer = setTimeout(
          () => setPlaying(false),
          reducedMotion() ? 60 : totalBase * tempoScale() * 1000 + 250,
        );
      });
      return () => {
        cancelAnimationFrame(raf);
        if (timer) clearTimeout(timer);
      };
    }
    if (!trigger) prev.current = null;
  }, [trigger, totalBase]);
  return playing;
}

const abs = (extra: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...extra });

// ═══════════════════════ BACKGROUNDS ═══════════════════════

export function QuietBg({ variant }: BgProps) {
  // The register without an ambient layer — nothing behind the page.
  return <div className={bgClass(variant)} aria-hidden style={variant === "contained" ? { background: "var(--atlas-surface)" } : undefined} />;
}

export function AuroraMesh({ variant }: BgProps) {
  useEffect(ensureKeyframes, []);
  return (
    <div className={bgClass(variant)} aria-hidden style={{ opacity: 0.55 }}>
      <div
        data-atlas-motion
        style={abs({
          inset: "-30%",
          filter: "blur(60px)",
          mixBlendMode: blend,
          animation: "atlas-aurora-spin calc(46s * var(--atlas-tempo,1)) linear infinite",
          background: [
            "radial-gradient(closest-side at 25% 35%, color-mix(in srgb, var(--atlas-accent) 60%, transparent), transparent 70%)",
            "radial-gradient(closest-side at 75% 62%, color-mix(in srgb, var(--atlas-info) 60%, transparent), transparent 70%)",
            "radial-gradient(closest-side at 58% 22%, color-mix(in srgb, var(--atlas-positive) 45%, transparent), transparent 70%)",
            "radial-gradient(closest-side at 38% 80%, color-mix(in srgb, var(--atlas-warning) 40%, transparent), transparent 70%)",
          ].join(", "),
        })}
      />
    </div>
  );
}

export function DriftingBlobs({ variant }: BgProps) {
  useEffect(ensureKeyframes, []);
  const blob = (token: string, size: number, anim: string, dur: number): React.CSSProperties =>
    abs({
      width: size,
      height: size,
      borderRadius: "50%",
      background: `var(${token})`,
      filter: "blur(40px)",
      mixBlendMode: blend,
      opacity: 0.65,
      animation: `${anim} calc(${dur}s * var(--atlas-tempo,1)) ease-in-out infinite`,
    });
  return (
    <div className={bgClass(variant)} aria-hidden>
      <div data-atlas-motion style={blob("--atlas-accent", 150, "atlas-drift1", 14)} />
      <div data-atlas-motion style={blob("--atlas-info", 95, "atlas-drift2", 12)} />
      <div data-atlas-motion style={blob("--atlas-positive", 90, "atlas-drift3", 16)} />
    </div>
  );
}

export function PlasmaFlow({ variant }: BgProps) {
  useEffect(ensureKeyframes, []);
  return (
    <div className={bgClass(variant)} aria-hidden style={{ opacity: 0.55 }}>
      <div
        data-atlas-motion
        style={abs({
          inset: 0,
          background:
            "linear-gradient(120deg, var(--atlas-accent), var(--atlas-info), var(--atlas-positive), var(--atlas-warning), var(--atlas-accent))",
          backgroundSize: "340% 340%",
          filter: "saturate(1.1) blur(8px)",
          mixBlendMode: blend,
          animation: "atlas-plasma calc(18s * var(--atlas-tempo,1)) ease infinite",
        })}
      />
    </div>
  );
}

export function BreathingGlow({ variant }: BgProps) {
  useEffect(ensureKeyframes, []);
  return (
    <div className={bgClass(variant)} aria-hidden>
      <div
        data-atlas-motion
        style={abs({
          left: "50%",
          top: "52%",
          width: "min(70%, 520px)",
          height: "min(70%, 520px)",
          transform: "translate(-50%,-50%)",
          mixBlendMode: blend,
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--atlas-accent) 55%, transparent), color-mix(in srgb, var(--atlas-info) 25%, transparent) 45%, transparent 70%)",
          animation: "atlas-breathe calc(7s * var(--atlas-tempo,1)) ease-in-out infinite",
        })}
      />
    </div>
  );
}

export function Constellation({ variant }: BgProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pts: { x: number; y: number; vx: number; vy: number }[] = [];
    const resize = () => {
      w = cv.width = cv.offsetWidth;
      h = cv.height = cv.offsetHeight;
    };
    resize();
    const N = Math.max(18, Math.min(46, Math.floor((w * h) / 12000)));
    for (let i = 0; i < N; i++)
      pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28 });
    let line = tokenRgb("--atlas-accent");
    let dot = tokenRgb("--atlas-text-1");
    let frames = 0;
    const tick = () => {
      if ((frames++ & 63) === 0) {
        line = tokenRgb("--atlas-accent");
        dot = tokenRgb("--atlas-text-1");
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // Every point is always linked to its 2 nearest neighbours, plus fainter
      // radius links — guaranteed threads, nothing drifts by disconnected.
      const REACH = 120, WEAVE = 2;
      const drawn = new Set<number>();
      for (let i = 0; i < pts.length; i++) {
        const ds: [number, number][] = [];
        for (let j = 0; j < pts.length; j++) if (j !== i) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          ds.push([d, j]);
        }
        ds.sort((a, b) => a[0] - b[0]);
        for (let k = 0; k < Math.min(WEAVE, ds.length); k++) {
          const [d, j] = ds[k];
          const key = i < j ? i * 1000 + j : j * 1000 + i;
          if (drawn.has(key)) continue; drawn.add(key);
          const a = pts[i], b = pts[j];
          const fade = Math.max(0.3, 1 - d / (REACH * 1.6));
          ctx.strokeStyle = `rgba(${line},${0.4 * fade})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let k = WEAVE; k < ds.length; k++) {
          const [d, j] = ds[k]; if (d > REACH) break;
          const key = i < j ? i * 1000 + j : j * 1000 + i;
          if (drawn.has(key)) continue; drawn.add(key);
          const a = pts[i], b = pts[j];
          ctx.strokeStyle = `rgba(${line},${0.18 * (1 - d / REACH)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${dot},.85)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 7); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <div className={bgClass(variant)} aria-hidden style={{ opacity: 0.7 }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ═══════════════════════ MOMENTS (séances) ═══════════════════════
// Choreography: gather → surge → reveal → settle. ~3.4s base × --atlas-tempo.

const genDur = (base: number) => `calc(${base}s * var(--atlas-tempo,1))`;

function Veil({ total }: { total: number }) {
  return (
    <div
      data-atlas-motion-once
      style={abs({
        inset: 0,
        background:
          "radial-gradient(120% 95% at 50% 45%, transparent 38%, color-mix(in srgb, var(--atlas-surface) 82%, transparent) 100%)",
        animation: `atlas-veil ${genDur(total)} ease both`,
      })}
    />
  );
}

function Bloom({ delay, size = 200, dur = 0.8 }: { delay: number; size?: number; dur?: number }) {
  return (
    <div
      data-atlas-motion-once
      style={abs({
        left: "50%", top: "50%", width: size, height: size,
        transform: "translate(-50%,-50%) scale(.5)", opacity: 0,
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--atlas-text-1) 65%, transparent), color-mix(in srgb, var(--atlas-accent) 45%, transparent) 40%, transparent 70%)",
        mixBlendMode: blend,
        animation: `atlas-bloom ${genDur(dur)} ease ${genDur(delay)} both`,
      })}
    />
  );
}

function Shock({ delay, dur = 0.9 }: { delay: number; dur?: number }) {
  return (
    <div
      data-atlas-motion-once
      style={abs({
        left: "50%", top: "50%", width: 160, height: 160,
        transform: "translate(-50%,-50%) scale(.15)", opacity: 0,
        borderRadius: "50%",
        border: "2px solid color-mix(in srgb, var(--atlas-info) 80%, transparent)",
        boxShadow: "0 0 22px color-mix(in srgb, var(--atlas-accent) 55%, transparent)",
        animation: `atlas-shock ${genDur(dur)} cubic-bezier(.2,.7,.3,1) ${genDur(delay)} both`,
      })}
    />
  );
}

// SPECTRAL SCAN — spectrograph warms up, the emission line prints the
// portrait top-to-bottom, an echo line snaps back, bloom settles.
export function SpectralScan({ trigger }: MomentProps) {
  useEffect(ensureKeyframes, []);
  const playing = useSequence(trigger, 3.4);
  if (!playing) return null;
  const warm = [
    { top: "18%", w: "62%", d: 0 },
    { top: "37%", w: "84%", d: 0.1 },
    { top: "58%", w: "48%", d: 0.2 },
    { top: "76%", w: "72%", d: 0.3 },
  ];
  return (
    <div className="motion-overlay" aria-hidden>
      <Veil total={3.4} />
      {warm.map((l, i) => (
        <div
          key={i}
          data-atlas-motion-once
          style={abs({
            left: 0, top: l.top, width: l.w, height: 1.5, opacity: 0,
            marginLeft: "8%",
            background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--atlas-info) 80%, transparent), transparent)",
            animation: `atlas-spec-warm ${genDur(0.9)} ease ${genDur(l.d)} both`,
          })}
        />
      ))}
      <div
        data-atlas-motion-once
        style={abs({
          left: 0, right: 0, height: 0, top: 0,
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--atlas-info) 26%, transparent), color-mix(in srgb, var(--atlas-accent) 12%, transparent))",
          mixBlendMode: blend,
          animation: `atlas-print ${genDur(2.2)} cubic-bezier(.65,0,.35,1) ${genDur(0.5)} both`,
        })}
      />
      <div
        data-atlas-motion-once
        style={abs({
          left: 0, right: 0, height: 3, top: "-4%",
          animation: `atlas-scan ${genDur(2.2)} cubic-bezier(.65,0,.35,1) ${genDur(0.5)} both`,
          background: "linear-gradient(90deg, transparent, var(--atlas-info), var(--atlas-text-1), var(--atlas-accent), transparent)",
          boxShadow: "0 0 24px 5px color-mix(in srgb, var(--atlas-accent) 75%, transparent)",
        })}
      />
      <div
        data-atlas-motion-once
        style={abs({
          left: 0, right: 0, height: 1.5, top: "103%",
          animation: `atlas-scan-echo ${genDur(0.6)} cubic-bezier(.3,0,.2,1) ${genDur(2.5)} both`,
          background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--atlas-accent) 85%, transparent), transparent)",
          boxShadow: "0 0 12px 2px color-mix(in srgb, var(--atlas-info) 60%, transparent)",
        })}
      />
      <Bloom delay={2.6} />
    </div>
  );
}

// CRYSTALLIZE — a seed of light grows a faceted lattice with refraction
// glints while content shimmers into place, then flashes and dissolves.
export function CrystallizeShimmer({ trigger }: MomentProps) {
  useEffect(ensureKeyframes, []);
  const playing = useSequence(trigger, 3.4);
  if (!playing) return null;
  const shards = [
    { l: 34, t: 32, s: 46, r: -18, d: 0.25, clip: "polygon(50% 0%, 100% 58%, 62% 100%, 8% 72%)" },
    { l: 60, t: 26, s: 38, r: 24, d: 0.4, clip: "polygon(38% 0%, 100% 40%, 74% 100%, 0% 78%)" },
    { l: 46, t: 54, s: 56, r: 8, d: 0.3, clip: "polygon(50% 0%, 96% 50%, 58% 100%, 4% 62%)" },
    { l: 27, t: 60, s: 34, r: -42, d: 0.55, clip: "polygon(46% 0%, 100% 64%, 52% 100%, 0% 56%)" },
    { l: 66, t: 58, s: 42, r: 48, d: 0.48, clip: "polygon(56% 0%, 100% 52%, 46% 100%, 0% 44%)" },
    { l: 52, t: 15, s: 30, r: 72, d: 0.65, clip: "polygon(50% 0%, 100% 58%, 62% 100%, 8% 72%)" },
    { l: 19, t: 40, s: 28, r: -66, d: 0.7, clip: "polygon(38% 0%, 100% 40%, 74% 100%, 0% 78%)" },
    { l: 74, t: 40, s: 30, r: 102, d: 0.6, clip: "polygon(46% 0%, 100% 64%, 52% 100%, 0% 56%)" },
  ];
  const row = (w: string, delay: number): React.CSSProperties => ({
    height: 10, borderRadius: 6, marginBottom: 9, width: w, opacity: 0,
    background:
      "linear-gradient(90deg, color-mix(in srgb,var(--atlas-text-1) 6%,transparent), color-mix(in srgb,var(--atlas-accent) 55%,transparent), color-mix(in srgb,var(--atlas-text-1) 6%,transparent))",
    backgroundSize: "200% 100%",
    animation: `atlas-shimmer ${genDur(1.5)} ease ${genDur(delay)} both`,
  });
  return (
    <div className="motion-overlay" aria-hidden>
      <Veil total={3.4} />
      <div
        data-atlas-motion-once
        style={abs({
          left: "50%", top: "45%", width: 90, height: 90, opacity: 0,
          transform: "translate(-50%,-50%) scale(.2)",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--atlas-text-1) 70%, transparent), color-mix(in srgb, var(--atlas-accent) 50%, transparent) 45%, transparent 72%)",
          mixBlendMode: blend,
          animation: `atlas-seed ${genDur(1.2)} ease both`,
        })}
      />
      {shards.map((sh, i) => (
        <div
          key={i}
          style={abs({ left: `${sh.l}%`, top: `${sh.t}%`, width: sh.s, height: sh.s, transform: "translate(-50%,-50%)" })}
        >
          <div
            data-atlas-motion-once
            style={{
              width: "100%", height: "100%", opacity: 0,
              clipPath: sh.clip,
              ["--shard-rot" as never]: `${sh.r}deg`,
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--atlas-accent) 78%, transparent), color-mix(in srgb, var(--atlas-info) 62%, transparent) 55%, color-mix(in srgb, var(--atlas-positive) 40%, transparent))",
              mixBlendMode: blend,
              animation: `atlas-shard ${genDur(2.4)} cubic-bezier(.2,.9,.3,1.2) ${genDur(sh.d)} both, atlas-glint ${genDur(2.4)} ease ${genDur(sh.d)} both`,
            }}
          />
        </div>
      ))}
      <div style={abs({ inset: 0, display: "flex", alignItems: "center", justifyContent: "center" })}>
        <div style={{ width: "78%", maxWidth: 280 }}>
          <div data-atlas-motion-once style={row("52%", 1.4)} />
          <div data-atlas-motion-once style={row("100%", 1.52)} />
          <div data-atlas-motion-once style={row("84%", 1.64)} />
          <div data-atlas-motion-once style={row("40%", 1.76)} />
        </div>
      </div>
      <Bloom delay={2.5} size={240} />
    </div>
  );
}

// SIGIL BLOOM — twin conjuring rings counter-rotate around a charging core;
// rays flare at full charge and the sigil detonates outward. The natural
// ceremony for a portrait crystallizing.
export function SigilBloom({ trigger }: MomentProps) {
  useEffect(ensureKeyframes, []);
  const playing = useSequence(trigger, 3.4);
  if (!playing) return null;
  return (
    <div className="motion-overlay" aria-hidden>
      <Veil total={3.4} />
      <div
        data-atlas-motion-once
        style={abs({
          left: "50%", top: "50%", width: 130, height: 130, opacity: 0,
          transform: "translate(-50%,-50%) scale(.25)",
          borderRadius: "50%",
          background: "conic-gradient(from 0deg, var(--atlas-accent), var(--atlas-positive), var(--atlas-info), var(--atlas-warning), var(--atlas-accent))",
          WebkitMask: "radial-gradient(circle, transparent 38%, #000 40%, #000 52%, transparent 54%)",
          mask: "radial-gradient(circle, transparent 38%, #000 40%, #000 52%, transparent 54%)",
          animation: `atlas-sigil-cw ${genDur(2.8)} cubic-bezier(.34,1.3,.5,1) both`,
        })}
      />
      <div
        data-atlas-motion-once
        style={abs({
          left: "50%", top: "50%", width: 190, height: 190, opacity: 0,
          transform: "translate(-50%,-50%) scale(.4)",
          borderRadius: "50%",
          background:
            "repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--atlas-info) 85%, transparent) 0deg 7deg, transparent 7deg 24deg)",
          WebkitMask: "radial-gradient(circle, transparent 44%, #000 45.5%, #000 49%, transparent 50.5%)",
          mask: "radial-gradient(circle, transparent 44%, #000 45.5%, #000 49%, transparent 50.5%)",
          animation: `atlas-sigil-ccw ${genDur(2.8)} cubic-bezier(.34,1.2,.5,1) ${genDur(0.15)} both`,
        })}
      />
      <div
        data-atlas-motion-once
        style={abs({
          left: "50%", top: "50%", width: 74, height: 74, opacity: 0,
          transform: "translate(-50%,-50%) scale(.4)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--atlas-text-1) 80%, transparent), color-mix(in srgb, var(--atlas-accent) 55%, transparent) 45%, transparent 72%)",
          mixBlendMode: blend,
          animation: `atlas-charge ${genDur(2.2)} ease ${genDur(0.2)} both`,
        })}
      />
      <div
        data-atlas-motion-once
        style={abs({
          left: "50%", top: "50%", width: 240, height: 240, opacity: 0,
          transform: "translate(-50%,-50%) scale(.5)",
          background:
            "repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--atlas-accent) 80%, transparent) 0deg 1.6deg, transparent 1.6deg 45deg)",
          WebkitMask: "radial-gradient(circle, transparent 22%, #000 30%, transparent 68%)",
          mask: "radial-gradient(circle, transparent 22%, #000 30%, transparent 68%)",
          mixBlendMode: blend,
          animation: `atlas-rays ${genDur(3.2)} ease both`,
        })}
      />
      <Shock delay={2.35} />
      <Bloom delay={2.4} size={230} />
    </div>
  );
}
