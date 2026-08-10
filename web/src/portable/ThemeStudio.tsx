import { useEffect, useState, type JSX } from "react";

/**
 * ThemeStudio — portable, full-screen gallery for register (theme) + motion
 * picks. Ported from the AI Design Atlas "Theme" page: instead of naming each
 * effect in a chip, every option renders a LIVE preview tile so the user can
 * SEE what each register, environment, and reveal moment entails before
 * committing. Opened from the RegisterDock (or a host shortcut).
 *
 * PORTABILITY CONTRACT (matches the src/portable kit philosophy):
 * - Pure + props-driven: all state lives in the HOST (providers, stores,
 *   localStorage). The studio only reports intent via onTheme / onBackground /
 *   onMoment / onClose. Effect components arrive as props, so the studio has
 *   no import ties to any one app's motion catalog.
 * - Self-styled: one inline <style> block, every color flows through
 *   var(--atlas-*, fallback) so it adopts any host register.
 * - Only internal state is UI-local: per-tile replay keys.
 */

export interface StudioTheme {
  id: string;
  label: string;
  note?: string;
  /** Full token map so each card previews in its OWN palette, not the active one. */
  tokens: Record<string, string>;
}
export interface StudioBackground {
  id: string;
  label: string;
  note?: string;
  Component: (p: { variant?: "fixed" | "contained" }) => JSX.Element;
}
export interface StudioMoment {
  id: string;
  label: string;
  note?: string;
  Component: (p: { trigger: string | null }) => JSX.Element | null;
}
export interface StudioPairing {
  id: string;
  label: string;
  note?: string;
  display: string;
  body: string;
  mono: string;
}

export interface ThemeStudioProps {
  open: boolean;
  /** Compress the gallery into a wide bottom workbench when space allows. */
  compact?: boolean;
  onClose: () => void;
  themes: StudioTheme[];
  themeId: string;
  onTheme: (id: string) => void;
  backgrounds: StudioBackground[];
  backgroundId: string;
  onBackground: (id: string) => void;
  moments: StudioMoment[];
  momentId: string;
  onMoment: (id: string) => void;
  /** Type pairings (optional — omit and the section doesn't render). */
  pairings?: StudioPairing[];
  /** Raw choice: followValue or a pairing id. */
  pairChoice?: string;
  onPairing?: (id: string) => void;
  /** Sentinel meaning "follow the register" (default "register"). */
  followValue?: string;
  /** The pairing actually in effect (resolved by the host when following). */
  effectivePairing?: StudioPairing;
  /** Active register label, for the follow card's subtitle. */
  registerLabel?: string;
  /** Eyebrow + heading, so the host names the room. */
  eyebrow?: string;
  heading?: string;
  intro?: string;
  statusText?: string;
  completionLabel?: string;
}

const HUES = ["--atlas-accent", "--atlas-info", "--atlas-positive", "--atlas-warning"] as const;

export default function ThemeStudio({
  open, compact = false, onClose,
  themes, themeId, onTheme,
  backgrounds, backgroundId, onBackground,
  moments, momentId, onMoment,
  pairings, pairChoice, onPairing,
  followValue = "register", effectivePairing, registerLabel,
  eyebrow = "UX RAVE · THEME STUDIO",
  heading = "Registers & motion",
  intro = "A register is a theme tuned for an audience — picking one re-skins the whole app at once. Type pairings set its voice in letterform; environments run behind everything; a reveal moment plays when an artifact lands. Every tile below is live: what you see is exactly what ships.",
  statusText,
  completionLabel = "Done",
}: ThemeStudioProps) {
  // Per-moment replay counters so each tile can re-fire its play-once effect.
  const [replays, setReplays] = useState<Record<string, number>>({});
  // Preview stage: which moment is auditioning (null = the saved pick) + play counter.
  const [stageId, setStageId] = useState<string | null>(null);
  const [stageN, setStageN] = useState(0);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Auto-play every moment tile once on open (and kick the stage), so the wall
  // greets you moving.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setReplays((r) => {
        const next = { ...r };
        for (const m of moments) next[m.id] = (next[m.id] ?? 0) + 1;
        return next;
      });
      setStageN((n) => n + 1);
    }, 350);
    return () => window.clearTimeout(id);
  }, [open, moments]);

  if (!open) return null;

  const replay = (id: string) =>
    setReplays((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));

  // Stage helpers: hover a tile = audition it full-scale; Use = pick + play.
  const audition = (id: string) => { setStageId(id); setStageN((n) => n + 1); };
  const stagePick = () => { setStageId(null); setStageN((n) => n + 1); };
  const stageMoment = moments.find((m) => m.id === (stageId ?? momentId)) ?? moments[0];
  const stageTrigger = stageN ? `stage-${stageMoment?.id}-${stageN}` : null;

  return (
    <div className={`tst-root${compact ? " tst-compact" : ""}`} role="dialog" aria-modal="true" aria-label="Theme Studio">
      <style>{TST_STYLE}</style>

      <div className="tst-scroll">
        <div className="tst-page">
          {/* header */}
          <div className="tst-head">
            <div>
              <p className="tst-eyebrow">{eyebrow}</p>
              <h1 className="tst-title">{heading}</h1>
              <p className="tst-intro">{intro}</p>
            </div>
            <button type="button" className="tst-close" onClick={onClose} aria-label="Close Theme Studio">
              ✕ <span className="tst-close-hint">Esc</span>
            </button>
          </div>

          {/* ── registers ── */}
          <p className="tst-section">Register</p>
          <div className="tst-registers">
            {themes.map((t) => {
              const on = t.id === themeId;
              const blend = (t.tokens["--atlas-blend"] || "screen") as React.CSSProperties["mixBlendMode"];
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`tst-register${on ? " tst-on" : ""}`}
                  style={{ background: t.tokens["--atlas-panel"], borderColor: on ? "var(--atlas-accent, #8fa1c2)" : t.tokens["--atlas-border"] }}
                  title={t.note}
                  onClick={() => onTheme(t.id)}
                >
                  {/* mini aurora rendered in THIS register's own hues */}
                  <span className="tst-register-sky" style={{ background: t.tokens["--atlas-surface"] }}>
                    <span
                      className="tst-register-wash"
                      style={{
                        mixBlendMode: blend,
                        background: [
                          `radial-gradient(closest-side at 30% 40%, ${t.tokens["--atlas-accent"]}, transparent 70%)`,
                          `radial-gradient(closest-side at 72% 60%, ${t.tokens["--atlas-info"]}, transparent 70%)`,
                          `radial-gradient(closest-side at 55% 28%, ${t.tokens["--atlas-positive"]}, transparent 70%)`,
                          `radial-gradient(closest-side at 42% 78%, ${t.tokens["--atlas-warning"]}, transparent 70%)`,
                        ].join(", "),
                      }}
                    />
                  </span>
                  <span className="tst-register-row">
                    <span className="tst-register-name" style={{ color: t.tokens["--atlas-text-1"] }}>{t.label}</span>
                    {on && <span className="tst-check" aria-hidden="true">✓</span>}
                  </span>
                  {t.note && (
                    <span className="tst-register-note" style={{ color: t.tokens["--atlas-text-4"] }}>{t.note}</span>
                  )}
                  <span className="tst-register-hues" aria-hidden="true">
                    {HUES.map((h) => (
                      <span key={h} style={{ background: t.tokens[h] }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── type pairings ── */}
          {pairings && onPairing && (
            <>
              <p className="tst-section">{compact ? "Typography" : "Type pairing — the register's voice in letterform"}</p>
              <div className="tst-pairs">
                {effectivePairing && (
                  <button
                    type="button"
                    className={`tst-pair${pairChoice === followValue ? " tst-on" : ""}`}
                    onClick={() => onPairing(followValue)}
                  >
                    <span className="tst-pair-ag" style={{ fontFamily: effectivePairing.display }}>Ag</span>
                    <span className="tst-pair-name" style={{ fontFamily: effectivePairing.display }}>Follow register</span>
                    <span className="tst-pair-sub">
                      currently {effectivePairing.label}{registerLabel ? ` — via ${registerLabel}` : ""}
                    </span>
                    <span className="tst-pair-note" style={{ fontFamily: effectivePairing.body }}>
                      Switch register, switch voice — type travels with the room.
                    </span>
                    <span className="tst-pair-mono" style={{ fontFamily: effectivePairing.mono }}>&lt;Ag&gt; 107.87 · mono</span>
                    {pairChoice === followValue && <span className="tst-check tst-pair-check" aria-hidden="true">✓</span>}
                  </button>
                )}
                {pairings.map((p) => {
                  const on = pairChoice === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`tst-pair${on ? " tst-on" : ""}`}
                      onClick={() => onPairing(p.id)}
                    >
                      <span className="tst-pair-ag" style={{ fontFamily: p.display }}>Ag</span>
                      <span className="tst-pair-name" style={{ fontFamily: p.display }}>{p.label}</span>
                      {p.note && <span className="tst-pair-note" style={{ fontFamily: p.body }}>{p.note}</span>}
                      <span className="tst-pair-mono" style={{ fontFamily: p.mono }}>&lt;Ag&gt; 107.87 · mono</span>
                      {on && <span className="tst-check tst-pair-check" aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── environments ── */}
          <p className="tst-section">{compact ? "Atmosphere" : "Environment — runs behind everything"}</p>
          <div className="tst-tiles">
            {backgrounds.map((b) => {
              const on = b.id === backgroundId;
              const Bg = b.Component;
              return (
                <div key={b.id} className={`tst-tile${on ? " tst-on" : ""}`}>
                  <button
                    type="button"
                    className="tst-stage"
                    title={`Use ${b.label}`}
                    onClick={() => onBackground(b.id)}
                  >
                    <Bg variant="contained" />
                  </button>
                  <div className="tst-tile-row">
                    <div className="tst-tile-copy">
                      <p className="tst-tile-name">{b.label}</p>
                      {b.note && <p className="tst-tile-note">{b.note}</p>}
                    </div>
                    <button
                      type="button"
                      className={`tst-use${on ? " tst-use-on" : ""}`}
                      onClick={() => onBackground(b.id)}
                    >
                      {on ? "✓ In use" : "Use"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── reveal moments ── */}
          {moments.length > 0 && (
            <>
              <p className="tst-section">Reveal moment — plays when an artifact lands</p>
              <div className="tst-tiles">
            {moments.map((m) => {
              const on = m.id === momentId;
              const Gen = m.Component;
              const n = replays[m.id] ?? 0;
              return (
                <div key={m.id} className={`tst-tile${on ? " tst-on" : ""}`} onMouseEnter={() => audition(m.id)}>
                  <button
                    type="button"
                    className="tst-stage"
                    title={`Audition ${m.label} on the stage`}
                    onClick={() => { replay(m.id); audition(m.id); }}
                  >
                    {/* skeleton "result card" the moment plays over */}
                    <span className="tst-skel" aria-hidden="true">
                      <span className="tst-skel-line tst-skel-head" />
                      <span className="tst-skel-line" style={{ width: "100%" }} />
                      <span className="tst-skel-line" style={{ width: "82%" }} />
                      <span className="tst-skel-line" style={{ width: "38%" }} />
                    </span>
                    <Gen trigger={n ? `studio-${m.id}-${n}` : null} />
                  </button>
                  <div className="tst-tile-row">
                    <div className="tst-tile-copy">
                      <p className="tst-tile-name">{m.label}</p>
                      {m.note && <p className="tst-tile-note">{m.note}</p>}
                    </div>
                    <div className="tst-tile-actions">
                      <button type="button" className="tst-replay" onClick={() => replay(m.id)} title="Replay">
                        ▶
                      </button>
                      <button
                        type="button"
                        className={`tst-use${on ? " tst-use-on" : ""}`}
                        onClick={() => { onMoment(m.id); replay(m.id); stagePick(); }}
                      >
                        {on ? "✓ In use" : "Use"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}

          {/* ── preview stage — the séance at full scale ── */}
          {stageMoment && (
            <div className="tst-bigstage">
              <div className="tst-bigstage-head">
                <p className="tst-bigstage-label">
                  PREVIEW STAGE — {stageId ? "AUDITIONING" : "YOUR PICK"}: {stageMoment.label.toUpperCase()}
                </p>
                <button type="button" className="tst-use" onClick={() => { setStageId(null); setStageN((n) => n + 1); }}>
                  ▶ Replay
                </button>
              </div>
              <div className="tst-bigstage-body">
                <span className="tst-skel-line tst-skel-head" style={{ width: "34%" }} />
                <span className="tst-skel-line" style={{ width: "100%" }} />
                <span className="tst-skel-line" style={{ width: "88%" }} />
                <span className="tst-skel-line" style={{ width: "64%" }} />
                <span className="tst-bigstage-bars" aria-hidden="true">
                  {[38, 62, 46, 78, 55, 90, 40, 68].map((v, i) => (
                    <span key={i} style={{ height: `${v}%` }} />
                  ))}
                </span>
                <stageMoment.Component trigger={stageTrigger} />
              </div>
            </div>
          )}

          <div className="tst-finish">
            <p className="tst-foot">{statusText || "Picks apply instantly and persist — the whole app is already wearing them."}</p>
            <button type="button" className="tst-done" onClick={onClose}>{completionLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TST_STYLE = `
.tst-root {
  position: fixed;
  left: 18px;
  right: 18px;
  bottom: 18px;
  height: min(650px, calc(100vh - 36px));
  z-index: 80;
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 97%, transparent);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-xl, 1.5rem);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  overflow: hidden;
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  animation: tstIn 220ms ease both;
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
}
@keyframes tstIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .tst-root { animation: none; }
  .tst-register-wash { filter: blur(22px); }
}
.tst-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; }
.tst-page { max-width: 1320px; margin: 0 auto; padding: 28px 32px 56px; }

@media (max-width: 760px) {
  .tst-root { left: 0; right: 0; bottom: 0; height: 92vh; border-radius: 20px 20px 0 0; }
  .tst-page { padding: 24px 18px 48px; }
}

.tst-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.tst-eyebrow {
  margin: 0;
  font-family: var(--font-label, var(--font-display, ui-serif, Georgia, serif));
  font-size: var(--label-size, 12px); font-style: var(--label-style, normal);
  font-weight: var(--label-weight, 500); letter-spacing: var(--label-tracking, 0.05em);
  text-transform: var(--label-transform, none);
  color: var(--atlas-positive, #cda24a);
}
.tst-title {
  margin: 6px 0 0;
  font-family: var(--font-display, ui-serif, Georgia, serif);
  font-size: clamp(26px, 3.4vw, 40px); font-weight: 580; line-height: 1.06;
  letter-spacing: -0.02em;
  color: var(--atlas-text-1, #e8eaf0);
}
.tst-intro {
  margin: 10px 0 0; max-width: 640px;
  font-size: 14.5px; line-height: 1.55;
  color: var(--atlas-text-3, #a6acba);
}
.tst-close {
  flex: none;
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px;
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 92%, transparent);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-full, 9999px);
  color: var(--atlas-text-2, #d2d6df);
  font-size: 13px; cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
}
.tst-close:hover { border-color: var(--atlas-accent, #8fa1c2); color: var(--atlas-text-1, #e8eaf0); }
.tst-close:focus-visible { outline: 2px solid var(--atlas-accent, #8fa1c2); outline-offset: 2px; }
.tst-close-hint {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 9px; padding: 1px 4px;
  border: 1px solid var(--atlas-border, #272d38); border-radius: 4px;
  color: var(--atlas-text-5, #565d6b);
}

.tst-section {
  margin: 34px 0 12px;
  font-family: var(--font-label, var(--font-display, ui-serif, Georgia, serif));
  font-size: var(--label-size, 12px); font-style: var(--label-style, normal);
  font-weight: var(--label-weight, 500); letter-spacing: var(--label-tracking, 0.05em);
  text-transform: var(--label-transform, none);
  color: var(--atlas-text-4, #7c8392);
}

/* registers — cards previewed in their OWN palette */
.tst-registers { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 12px; }
.tst-register {
  display: flex; flex-direction: column; align-items: stretch; text-align: left;
  padding: 12px; border: 1px solid; border-radius: var(--radius-lg, 1rem);
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.tst-register:hover { transform: translateY(-3px); }
.tst-register.tst-on { box-shadow: 0 0 0 1px var(--atlas-accent, #8fa1c2); }
.tst-register-sky { position: relative; display: block; height: 72px; border-radius: 10px; overflow: hidden; }
.tst-register-wash { position: absolute; inset: -30%; filter: blur(22px); }
.tst-register-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.tst-register-name {
  font-family: var(--font-action, var(--font-display, ui-serif, Georgia, serif));
  font-size: 13.5px; font-style: var(--action-style, normal); font-weight: var(--action-weight, 500);
  letter-spacing: var(--action-tracking, 0.01em);
}
.tst-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--atlas-accent, #8fa1c2);
  color: var(--atlas-bg, #0e1116);
  font-size: 11px; font-weight: 800;
}
.tst-register-note { margin-top: 4px; font-size: 11.5px; line-height: 1.4; min-height: 32px; }
.tst-register-hues { display: flex; gap: 5px; margin-top: 9px; }
.tst-register-hues span { width: 11px; height: 11px; border-radius: 50%; }

/* effect tiles — live stage + copy + Use */
.tst-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.tst-tile {
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-lg, 1rem);
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 92%, transparent);
  padding: 10px;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.tst-tile.tst-on {
  border-color: var(--atlas-accent, #8fa1c2);
  box-shadow: 0 0 0 1px var(--atlas-accent, #8fa1c2);
}
.tst-stage {
  position: relative; display: block; width: 100%; height: 128px;
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: 12px; overflow: hidden;
  background: var(--atlas-surface, #12151b);
  cursor: pointer; padding: 0;
}
.tst-stage:focus-visible { outline: 2px solid var(--atlas-accent, #8fa1c2); outline-offset: 2px; }
.tst-skel {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center; gap: 9px;
  padding: 0 18%;
}
.tst-skel-line { display: block; height: 9px; border-radius: 5px; background: var(--atlas-border, #272d38); }
.tst-skel-head {
  width: 46%;
  background: linear-gradient(90deg, var(--atlas-accent, #8fa1c2), var(--atlas-info, #7f96c4));
}
.tst-tile-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-top: 9px; }
.tst-tile-copy { min-width: 0; }
.tst-tile-name {
  margin: 0; color: var(--atlas-text-1, #e8eaf0);
  font-family: var(--font-action, var(--font-display, ui-serif, Georgia, serif));
  font-size: 13px; font-style: var(--action-style, normal); font-weight: var(--action-weight, 500);
  letter-spacing: var(--action-tracking, 0.01em);
}
.tst-tile-note { margin: 3px 0 0; font-size: 11.5px; line-height: 1.4; color: var(--atlas-text-4, #7c8392); }
.tst-tile-actions { display: flex; gap: 6px; flex: none; }
.tst-use {
  flex: none;
  padding: 5px 11px;
  background: var(--atlas-surface, #12151b);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-full, 9999px);
  font-size: 11.5px; color: var(--atlas-text-3, #a6acba);
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
}
.tst-use:hover { border-color: var(--atlas-accent, #8fa1c2); color: var(--atlas-text-1, #e8eaf0); }
.tst-use-on {
  border-color: var(--atlas-accent, #8fa1c2);
  background: var(--atlas-accent-soft, rgba(143,161,194,0.14));
  color: var(--atlas-text-1, #e8eaf0);
  box-shadow: 0 0 0 1px var(--atlas-accent, #8fa1c2) inset;
}
.tst-replay {
  flex: none;
  width: 27px; height: 27px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--atlas-surface, #12151b);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: 50%;
  font-size: 10px; color: var(--atlas-accent, #8fa1c2);
  cursor: pointer;
  transition: border-color 120ms ease;
}
.tst-replay:hover { border-color: var(--atlas-accent, #8fa1c2); }

.tst-foot {
  margin: 0;
  font-size: 11.5px; color: var(--atlas-text-5, #565d6b);
}
.tst-finish {
  position: sticky; bottom: -1px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-top: 24px; padding: 14px 0 2px;
  background: var(--atlas-panel, #161a21);
}
.tst-done {
  min-width: 128px; padding: 10px 18px;
  border: 1px solid var(--atlas-accent, #8fa1c2);
  border-radius: var(--radius-md, .625rem);
  background: var(--atlas-accent, #8fa1c2);
  color: var(--atlas-bg, #0e1116);
  font-family: var(--font-action, var(--font-display, ui-serif, Georgia, serif));
  font-size: 13px; font-style: var(--action-style, normal); font-weight: var(--action-weight, 500); line-height: 1;
  letter-spacing: var(--action-tracking, 0.01em);
  cursor: pointer;
}
.tst-done:focus-visible { outline: 2px solid var(--atlas-text-1, #e8eaf0); outline-offset: 2px; }

/* Optional wide workbench — keeps the active chart visible behind the studio. */
@media (min-width: 1080px) {
  .tst-root.tst-compact { height: min(400px, 42vh); min-height: 292px; }
  .tst-compact .tst-scroll { overflow-y: hidden; }
  .tst-compact .tst-page {
    height: 100%; max-width: none; margin: 0; padding: 22px 26px 16px;
    display: grid;
    grid-template-columns: 205px minmax(430px, 1fr) 190px 242px;
    grid-template-rows: 22px minmax(0, 1fr) 46px;
    column-gap: 18px; row-gap: 8px;
  }
  .tst-compact .tst-head { display: contents; }
  .tst-compact .tst-head > div { grid-column: 1; grid-row: 1 / 3; padding-right: 8px; }
  .tst-compact .tst-title { margin-top: 8px; font-size: 22px; line-height: 1.08; }
  .tst-compact .tst-intro { margin-top: 10px; font-size: 12.5px; line-height: 1.48; }
  .tst-compact .tst-close { grid-column: 4; grid-row: 1; justify-self: end; align-self: start; z-index: 2; transform: translateY(-5px); }
  .tst-compact .tst-page > .tst-section { margin: 0; align-self: end; }
  .tst-compact .tst-page > .tst-section:nth-of-type(1) { grid-column: 2; grid-row: 1; }
  .tst-compact .tst-page > .tst-section:nth-of-type(2) { grid-column: 3; grid-row: 1; }
  .tst-compact .tst-page > .tst-section:nth-of-type(3) { grid-column: 4; grid-row: 1; }
  .tst-compact .tst-registers { grid-column: 2; grid-row: 2; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; min-width: 0; }
  .tst-compact .tst-register { min-width: 0; padding: 9px; }
  .tst-compact .tst-register-sky { height: 58px; }
  .tst-compact .tst-register-row { margin-top: 8px; }
  .tst-compact .tst-register-name { min-height: 25px; overflow: hidden; font-size: 10.75px; line-height: 1.15; }
  .tst-compact .tst-register-note { min-height: 48px; max-height: 48px; overflow: hidden; font-size: 9.5px; line-height: 1.35; }
  .tst-compact .tst-register-hues { margin-top: 6px; }
  .tst-compact .tst-register-hues span { width: 8px; height: 8px; }
  .tst-compact .tst-pairs { grid-column: 3; grid-row: 2; display: block; min-width: 0; }
  .tst-compact .tst-pair { display: none; height: 100%; padding: 12px; }
  .tst-compact .tst-pair.tst-on { display: flex; }
  .tst-compact .tst-pair-ag { font-size: 30px; }
  .tst-compact .tst-pair-name { margin-top: 7px; font-size: 13px; }
  .tst-compact .tst-pair-note { font-size: 10.5px; }
  .tst-compact .tst-tiles { grid-column: 4; grid-row: 2; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-width: 0; }
  .tst-compact .tst-tile { padding: 7px; border-radius: 12px; }
  .tst-compact .tst-stage { height: 68px; border-radius: 50%; }
  .tst-compact .tst-tile-row { display: block; margin-top: 7px; text-align: center; }
  .tst-compact .tst-tile-name { min-height: 24px; overflow: hidden; font-size: 9.5px; line-height: 1.15; }
  .tst-compact .tst-tile-note { display: none; }
  .tst-compact .tst-use { margin-top: 6px; padding: 3px 7px; font-size: 9px; }
  .tst-compact .tst-finish {
    grid-column: 1 / -1; grid-row: 3; align-self: end;
    margin: 0; padding: 8px 0 0; border-top: 1px solid var(--atlas-border, #272d38);
  }
  .tst-compact .tst-foot { font-size: 10.5px; }
  .tst-compact .tst-done { min-width: 150px; padding: 9px 16px; }
}

/* type pairing cards — each set in its OWN faces */
.tst-pairs { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.tst-pair {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
  padding: 14px; cursor: pointer;
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 92%, transparent);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-lg, 1rem);
  transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}
.tst-pair:hover { transform: translateY(-3px); border-color: var(--atlas-accent, #8fa1c2); }
.tst-pair.tst-on { border-color: var(--atlas-accent, #8fa1c2); box-shadow: 0 0 0 1px var(--atlas-accent, #8fa1c2); }
.tst-pair-ag { font-size: 36px; font-weight: 700; line-height: 1; color: var(--atlas-text-1, #e8eaf0); }
.tst-pair-name {
  margin-top: 10px; color: var(--atlas-text-1, #e8eaf0);
  font-family: var(--font-action, var(--font-display, ui-serif, Georgia, serif));
  font-size: 15px; font-style: var(--action-style, normal); font-weight: var(--action-weight, 500);
  letter-spacing: var(--action-tracking, 0.01em);
}
.tst-pair-sub { margin-top: 2px; font-size: 10px; letter-spacing: 0.04em; color: var(--atlas-text-5, #565d6b); }
.tst-pair-note { margin-top: 6px; font-size: 11.5px; line-height: 1.45; color: var(--atlas-text-4, #7c8392); }
.tst-pair-mono {
  margin-top: 10px; padding: 2px 6px;
  border: 1px solid var(--atlas-border, #272d38); border-radius: 5px;
  font-size: 9.5px; color: var(--atlas-text-4, #7c8392);
}
.tst-pair-check { position: absolute; top: 12px; right: 12px; }

/* preview stage — the séance at full scale */
.tst-bigstage {
  margin-top: 14px;
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-lg, 1rem);
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 92%, transparent);
  overflow: hidden;
}
.tst-bigstage-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--atlas-border, #272d38);
}
.tst-bigstage-label {
  margin: 0; font-size: 10.5px; letter-spacing: 0.08em;
  color: var(--atlas-text-4, #7c8392);
}
.tst-bigstage-body {
  position: relative; overflow: hidden;
  min-height: 260px; padding: 26px 28px;
  display: flex; flex-direction: column; gap: 11px;
  background: var(--atlas-surface, #12151b);
  border-radius: 0 0 var(--radius-lg, 1rem) var(--radius-lg, 1rem);
}
.tst-bigstage-body .tst-skel-line { flex: none; }
.tst-bigstage-bars {
  display: flex; align-items: flex-end; gap: 9px;
  height: 84px; margin-top: 6px;
}
.tst-bigstage-bars span {
  flex: 1; border-radius: 5px 5px 0 0;
  background: color-mix(in srgb, var(--atlas-accent, #8fa1c2) 40%, var(--atlas-border, #272d38));
}
.tst-bigstage-bars span:nth-child(even) {
  background: color-mix(in srgb, var(--atlas-info, #7f96c4) 40%, var(--atlas-border, #272d38));
}
`;
