import { useEffect, useId, useRef, useState } from "react";

/**
 * RegisterDock — portable, one-click control surface for register (theme) +
 * motion FX picks. Built for live demos: everything is a single click, the
 * active choice is always visible, and the host can bind keyboard shortcuts.
 *
 * PORTABILITY CONTRACT (matches the src/portable kit philosophy):
 * - Pure + props-driven: all state lives in the HOST (providers, stores,
 *   localStorage — whatever the app uses). The dock only reports intent via
 *   onTheme / onBackground / onMoment, so state logic is preserved wherever
 *   this component travels.
 * - Self-styled: one inline <style> block, every color flows through
 *   var(--atlas-*, fallback) so it adopts any host register and still looks
 *   right in a bare app.
 * - Only internal state is the open/closed popover (UI-local by nature).
 */

export interface DockTheme {
  id: string;
  label: string;
  note?: string;
  /** Colors for the swatch card: surface + two accent dots. */
  swatch: { bg: string; accent: string; extra?: string };
}
export interface DockOption {
  id: string;
  label: string;
  note?: string;
}

export interface RegisterDockProps {
  themes: DockTheme[];
  themeId: string;
  onTheme: (id: string) => void;
  backgrounds: DockOption[];
  backgroundId: string;
  onBackground: (id: string) => void;
  moments: DockOption[];
  momentId: string;
  onMoment: (id: string) => void;
  /** Shortcut hint line shown in the footer (host binds the actual keys). */
  hint?: string;
  label?: string;
  /** When provided, the panel grows a "Theme Studio" button — the host opens
      its full gallery (live previews of every register + effect) on click. */
  onStudio?: () => void;
}

export default function RegisterDock({
  themes, themeId, onTheme,
  backgrounds, backgroundId, onBackground,
  moments, momentId, onMoment,
  hint,
  label = "Appearance",
  onStudio,
}: RegisterDockProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const active = themes.find((t) => t.id === themeId) ?? themes[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="rgd" style={{ position: "relative" }}>
      <style>{RGD_STYLE}</style>

      {/* Trigger — always shows the live register swatch + name */}
      <button
        type="button"
        className="rgd-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={active?.note}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="rgd-dots" aria-hidden="true">
          <span style={{ background: active?.swatch.bg }} />
          <span style={{ background: active?.swatch.accent }} />
          <span style={{ background: active?.swatch.extra ?? active?.swatch.accent }} />
        </span>
        <span className="rgd-trigger-label">{active?.label}</span>
        <span className={`rgd-caret${open ? " rgd-caret--open" : ""}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="rgd-panel" id={panelId} role="dialog" aria-label={label}>
          <p className="rgd-heading">Register</p>
          <div className="rgd-themes" role="listbox" aria-label="Register">
            {themes.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={t.id === themeId}
                className={`rgd-theme${t.id === themeId ? " rgd-active" : ""}`}
                title={t.note}
                onClick={() => onTheme(t.id)}
              >
                <span className="rgd-theme-swatch" style={{ background: t.swatch.bg }} aria-hidden="true">
                  <span style={{ background: t.swatch.accent }} />
                  <span style={{ background: t.swatch.extra ?? t.swatch.accent }} />
                </span>
                <span className="rgd-theme-label">{t.label}</span>
                <span className="rgd-key" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </div>

          {backgrounds.length > 0 && <><p className="rgd-heading">Environment</p>
          <div className="rgd-chips" role="listbox" aria-label="Background motion">
            {backgrounds.map((b) => (
              <button
                key={b.id}
                type="button"
                role="option"
                aria-selected={b.id === backgroundId}
                className={`rgd-chip${b.id === backgroundId ? " rgd-active" : ""}`}
                title={b.note}
                onClick={() => onBackground(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div></>}

          {moments.length > 0 && <><p className="rgd-heading">Reveal moment</p>
          <div className="rgd-chips" role="listbox" aria-label="Generation moment">
            {moments.map((m) => (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={m.id === momentId}
                className={`rgd-chip${m.id === momentId ? " rgd-active" : ""}`}
                title={m.note}
                onClick={() => onMoment(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div></>}

          {onStudio && (
            <button
              type="button"
              className="rgd-studio"
              onClick={() => { setOpen(false); onStudio(); }}
            >
              Open Theme Studio
              <span className="rgd-studio-note">change how StarGlass catches the light</span>
            </button>
          )}

          {hint && <p className="rgd-hint">{hint}</p>}
        </div>
      )}
    </div>
  );
}

const RGD_STYLE = `
.rgd-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--atlas-panel, #161a21);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-full, 9999px);
  color: var(--atlas-text-3, #a6acba);
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
}
.rgd-trigger:hover { border-color: var(--atlas-accent, #8fa1c2); color: var(--atlas-text-1, #e8eaf0); }
.rgd-trigger:focus-visible { outline: 2px solid var(--atlas-accent, #8fa1c2); outline-offset: 2px; }
.rgd-dots { display: inline-flex; gap: 3px; }
.rgd-dots span {
  width: 10px; height: 10px; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--atlas-text-1, #e8eaf0) 25%, transparent);
}
.rgd-caret { font-size: 9px; opacity: 0.7; transition: transform 160ms ease; }
.rgd-caret--open { transform: rotate(180deg); }

.rgd-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  /* Size to content so long register labels render un-truncated, but never
     wider than the viewport (88px ≈ host right-offset + breathing room), so
     the panel can't bleed off-screen in any host. */
  width: max-content;
  min-width: 316px;
  max-width: min(412px, calc(100vw - 88px));
  padding: 0.875rem;
  background: color-mix(in srgb, var(--atlas-panel, #161a21) 92%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-lg, 1rem);
  box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  z-index: 60;
  animation: rgdIn 180ms ease both;
}
@keyframes rgdIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .rgd-panel { animation: none; } }

.rgd-heading {
  margin: 0 0 0.375rem;
  font-family: var(--font-label, var(--font-display, ui-serif, Georgia, serif));
  font-size: var(--label-size, 12px);
  font-style: var(--label-style, normal);
  font-weight: var(--label-weight, 500);
  letter-spacing: var(--label-tracking, 0.05em);
  text-transform: var(--label-transform, none);
  color: var(--atlas-text-4, #7c8392);
}
.rgd-heading + .rgd-heading { margin-top: 0.75rem; }
/* minmax(0,1fr): a bare 1fr bottoms out at min-content, so one long register
   label (e.g. "Refined Instrument") inflates its column and shoves the other
   column through the panel's right edge. Zero-min lets both tracks share the
   row evenly; the label's own ellipsis takes over if space still runs out. */
.rgd-themes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-bottom: 0.75rem; }
.rgd-theme {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: var(--atlas-surface, #12151b);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-md, 0.625rem);
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}
.rgd-theme:hover { border-color: var(--atlas-accent, #8fa1c2); }
.rgd-theme-swatch {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 26px; height: 18px;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--atlas-text-1, #e8eaf0) 22%, transparent);
}
.rgd-theme-swatch span { width: 6px; height: 6px; border-radius: 50%; }
.rgd-theme-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  font-size: 11.5px;
  color: var(--atlas-text-2, #d2d6df);
}
.rgd-key {
  flex: none;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 9px;
  color: var(--atlas-text-5, #565d6b);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: 4px;
  padding: 0 3px;
}
.rgd-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 0.25rem; }
.rgd-chip {
  padding: 0.25rem 0.625rem;
  background: var(--atlas-surface, #12151b);
  border: 1px solid var(--atlas-border, #272d38);
  border-radius: var(--radius-full, 9999px);
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  font-size: 11px;
  color: var(--atlas-text-3, #a6acba);
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
}
.rgd-chip:hover { border-color: var(--atlas-accent, #8fa1c2); color: var(--atlas-text-1, #e8eaf0); }
.rgd-active {
  border-color: var(--atlas-accent, #8fa1c2) !important;
  background: var(--atlas-accent-soft, rgba(143,161,194,0.14));
  color: var(--atlas-text-1, #e8eaf0);
  box-shadow: 0 0 0 1px var(--atlas-accent, #8fa1c2) inset;
}
.rgd-studio {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem 0.625rem;
  background: var(--atlas-accent-soft, rgba(143,161,194,0.14));
  border: 1px solid var(--atlas-accent, #8fa1c2);
  border-radius: var(--radius-md, 0.625rem);
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  font-size: 12px;
  font-weight: 600;
  color: var(--atlas-text-1, #e8eaf0);
  cursor: pointer;
  text-align: center;
  transition: background 120ms ease;
}
.rgd-studio:hover { background: color-mix(in srgb, var(--atlas-accent, #8fa1c2) 24%, transparent); }
.rgd-studio-note {
  display: block;
  margin-top: 2px;
  font-size: 9.5px;
  font-weight: 400;
  color: var(--atlas-text-4, #7c8392);
}
.rgd-hint {
  margin: 0.625rem 0 0;
  font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  font-size: 10px;
  color: var(--atlas-text-5, #565d6b);
  text-align: center;
}
`;
