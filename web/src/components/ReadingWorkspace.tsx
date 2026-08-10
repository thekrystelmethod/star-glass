import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, BookOpenText, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, FileDown, ImageDown, LoaderCircle, PanelLeftClose, PanelLeftOpen, Pencil, RefreshCw, RotateCcw, ScanSearch, Sparkles } from "lucide-react";
import { activeChartBlock, type ChartResponse, type Placement } from "../api";
import { hasCodexEntry } from "../codex";
import { CeremonyMoment } from "../motion/catalog";
import { useArchetypes } from "../useArchetypes";
import { CodexPanel, type CodexTarget } from "./CodexPanel";
import type { CastMeta, GeneratedReading } from "../types";

const MOVEMENT_PLACEHOLDERS = [
  { nav: "Overture", title: "The orchestral score", subtitle: "A panoramic view of the whole chart and the relationships that set your life in motion." },
  { nav: "The Ground Floor", title: "The implicit terrain", subtitle: "Element, mode, temperament, and the inner climate beneath conscious intention." },
  { nav: "The Inner Cast", title: "The essential dynamics", subtitle: "Sun, Moon, and the personal planets as a living inner ensemble." },
  { nav: "The Mirror", title: "Relationships & reflection", subtitle: "The patterns that become visible through encounter, projection, and intimacy." },
  { nav: "The Summit", title: "Your high vantage point", subtitle: "Vocation, visibility, and the work that asks to be carried into the world." },
  { nav: "Integration", title: "Weaving it together", subtitle: "The chart as one developmental instruction rather than a list of separate traits." },
];

const BODY_GLYPH: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Chiron: "⚷",
  "North Node": "☊", "South Node": "☋",
};

const BODY_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "North Node"];

function degree(placement?: Placement) {
  if (!placement) return "—";
  return `${placement.degree_in_sign}°${String(placement.minute).padStart(2, "0")}′${placement.retrograde ? " ℞" : ""}`;
}

interface ReadingWorkspaceProps {
  chart: ChartResponse;
  meta: CastMeta;
  chartKey: string;
  wheelSvg: string;
  wheelLoading: boolean;
  reading: GeneratedReading | null;
  readingLoading: boolean;
  readingError: string;
  zodiacBlock: "tropical" | "sidereal";
  onZodiacBlock: (block: "tropical" | "sidereal") => void;
  onEdit: () => void;
  onRetryReading: () => void;
  onOpenReport: () => void;
  onOpenShare: () => void;
  momentId: string;
  ceremonyTrigger: string | null;
  onMovementFocus: (bodies: string[] | null) => void;
}

const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 10 > 3 || Math.floor(n / 10) === 1) ? 0 : n % 10]}`;

export function ReadingWorkspace({
  chart,
  meta,
  chartKey,
  wheelSvg,
  wheelLoading,
  reading,
  readingLoading,
  readingError,
  zodiacBlock,
  onZodiacBlock,
  onEdit,
  onRetryReading,
  onOpenReport,
  onOpenShare,
  momentId,
  ceremonyTrigger,
  onMovementFocus,
}: ReadingWorkspaceProps) {
  const [movement, setMovement] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [apparatusTab, setApparatusTab] = useState<"apparatus" | "notes">("apparatus");

  // The chart-identity strip condenses once it sticks: a 1px sentinel above it
  // leaves the viewport exactly when the strip reaches the top edge.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [apparatusExpanded, setApparatusExpanded] = useState(true);
  const [codexTarget, setCodexTarget] = useState<CodexTarget | null>(null);
  // Notes persist per chart: what someone writes about a reading is part of
  // the reading, and must survive the tab closing.
  const notesKey = `starglass-notes:${chartKey}`;
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(notesKey) ?? ""; } catch (_) { return ""; }
  });
  useEffect(() => {
    try { setNotes(localStorage.getItem(notesKey) ?? ""); } catch (_) { setNotes(""); }
  }, [notesKey]);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      try { localStorage.setItem(notesKey, notes); } catch (_) {}
    }, 400);
    return () => window.clearTimeout(handle);
  }, [notes, notesKey]);
  const block = activeChartBlock(chart, zodiacBlock);
  const movements = reading?.movements.length === 6 ? reading.movements : MOVEMENT_PLACEHOLDERS;
  const current = movements[movement];
  const currentBodies = (reading && reading.movements[movement]?.bodies) || [];

  // Tell the app which geometry this movement reads, so the wheel spotlights it.
  useEffect(() => {
    onMovementFocus(reading && currentBodies.length ? currentBodies : null);
  }, [movement, reading]); // eslint-disable-line react-hooks/exhaustive-deps

  // The mythic layer: archetype titles for every placement in this chart.
  const archetypeRequests = useMemo(
    () => Object.entries(block.placements).map(([body, placement]) => ({ body, sign: placement.sign })),
    [block],
  );
  const archetypes = useArchetypes(archetypeRequests);
  const dual = Boolean(chart.tropical && chart.sidereal_lahiri);
  const narrative = reading
    ? [...(movement === 0 && reading.framing ? [reading.framing] : []), ...reading.movements[movement].paragraphs]
    : [];

  const next = () => setMovement((currentIndex) => Math.min(currentIndex + 1, movements.length - 1));
  const previous = () => setMovement((currentIndex) => Math.max(currentIndex - 1, 0));

  return (
    <main className="reading-shell" id="main-content">
      <div className="identity-sentinel" aria-hidden="true" ref={sentinelRef} />
      <section className={`chart-identity${condensed ? " condensed" : ""}`} aria-label="Current chart">
        <div className="mini-wheel" aria-hidden="true">◎</div>
        <div><strong>{meta.dateLabel}</strong><span>Date of birth</span></div>
        <div><strong>{meta.timeLabel}</strong><span>Local time</span></div>
        <div><strong>{meta.placeLabel}</strong><span>Birthplace</span></div>
        <div><strong>{meta.zodiacLabel} · {meta.houseLabel}</strong><span>Zodiac · houses</span></div>
        <div className="identity-actions">
          {reading && (
            <>
              <button type="button" className="secondary-button" onClick={onOpenReport} title="A print-quality report of the full portrait"><FileDown size={15} /> Save report</button>
              <button type="button" className="secondary-button" onClick={onOpenShare} title="A card carrying one line of the portrait"><ImageDown size={15} /> Share card</button>
            </>
          )}
          <button type="button" className="secondary-button edit-button" onClick={onEdit}><Pencil size={15} /> Edit / recast</button>
        </div>
      </section>

      <div className={`reading-grid${navigatorCollapsed ? " navigator-collapsed" : ""}`}>
        <div className="movement-nav-column">
          <nav className={`movement-nav${navigatorCollapsed ? " collapsed" : ""}`} aria-label="Reading movements">
            <div className="movement-nav-header">
              <p className="eyebrow">The reading</p>
              <button
                type="button"
                className="navigator-toggle"
                aria-expanded={!navigatorCollapsed}
                aria-label={navigatorCollapsed ? "Expand reading navigator" : "Collapse reading navigator"}
                title={navigatorCollapsed ? "Expand reading navigator" : "Collapse reading navigator"}
                onClick={() => setNavigatorCollapsed((collapsed) => !collapsed)}
              >
                {navigatorCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>
            <ol>
              {movements.map((item, index) => (
                <li key={item.nav}>
                  <button type="button" disabled={!reading} className={movement === index ? "active" : ""} aria-current={movement === index ? "step" : undefined} aria-label={navigatorCollapsed ? `${index + 1}. ${item.nav}: ${item.title}` : undefined} title={navigatorCollapsed ? item.nav : undefined} onClick={() => setMovement(index)}>
                    <span>{index + 1}</span>
                    <span className="movement-nav-copy"><strong>{item.nav}</strong><small>{item.title}</small></span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="reading-guide"><BookOpen size={17} /><span><strong>Reading guide</strong><small>Move in order, or follow what calls.</small></span></div>
          </nav>
        </div>

        <article className="movement-content">
          <header className="movement-heading">
            {reading && <p className="portrait-title">{reading.title}</p>}
            <p className="eyebrow">{movement + 1}. {current.nav}</p>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </header>

          {dual && (
            <div className="zodiac-switch" aria-label="Zodiac view">
              <button type="button" className={zodiacBlock === "tropical" ? "active" : ""} onClick={() => onZodiacBlock("tropical")}>Tropical</button>
              <button type="button" className={zodiacBlock === "sidereal" ? "active" : ""} onClick={() => onZodiacBlock("sidereal")}>Sidereal</button>
            </div>
          )}

          <div className={`movement-hero${reading ? " reading-ready" : ""}`}>
            <div className="wheel-column">
              <div className={`wheel-stage${wheelLoading ? " loading" : ""}`} aria-label="Natal chart wheel">
                <CeremonyMoment momentId={momentId} trigger={ceremonyTrigger} />
                {wheelSvg ? <div className="wheel-svg" dangerouslySetInnerHTML={{ __html: wheelSvg }} /> : <div className="wheel-placeholder">Drawing the chart…</div>}
              </div>
              {reading && currentBodies.length > 0 && (
                <div className="movement-constellation" aria-label="Placements this movement reads">
                  <p className="eyebrow">This movement's sky</p>
                  <div className="constellation-chips">
                    {currentBodies.map((name) => {
                      const placement = block.placements[name];
                      if (!placement) return null;
                      const deeper = hasCodexEntry(name);
                      const technical = `${name} in ${placement.sign} · ${ordinal(placement.house)} house`;
                      return (
                        <button
                          key={name}
                          type="button"
                          className="constellation-chip"
                          disabled={!deeper}
                          title={deeper ? "Open this placement in the Codex" : undefined}
                          onClick={deeper ? () => setCodexTarget({ kind: "placement", body: name, sign: placement.sign, house: placement.house }) : undefined}
                        >
                          <span className="chip-glyph" aria-hidden="true">{BODY_GLYPH[name]}&#xFE0E;</span>
                          <span className="chip-copy">
                            <strong>{archetypes[name] ?? technical}</strong>
                            {archetypes[name] && <small>{technical}</small>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="movement-prose">
              {readingLoading && !reading && (
                <div className="reading-composer" role="status">
                  <div className="composer-mark">
                    <LoaderCircle size={22} aria-hidden="true" />
                    <span>Portrait in progress</span>
                  </div>
                  <strong>Composing your portrait</strong>
                  <p>StarGlass is weighing the chart, listening for repeated themes, and writing each movement fresh.</p>
                  <ol className="composer-stages" aria-label="Portrait composition stages">
                    <li><ScanSearch size={15} aria-hidden="true" /><span>Reading the chart’s architecture</span></li>
                    <li><Sparkles size={15} aria-hidden="true" /><span>Finding the patterns that repeat</span></li>
                    <li><BookOpenText size={15} aria-hidden="true" /><span>Composing the six movements</span></li>
                  </ol>
                  <p className="composer-wait"><Clock3 size={15} aria-hidden="true" /><span>A full portrait usually takes 1–3 minutes. Keep this tab open—you can switch away and return shortly.</span></p>
                </div>
              )}
              {readingError && !reading && (
                <div className="reading-composer reading-composer-error" role="alert">
                  <strong>The chart is safe. The prose needs another pass.</strong>
                  <p>{readingError}</p>
                  <button type="button" className="secondary-button" onClick={onRetryReading} disabled={readingLoading}><RefreshCw size={15} /> Try the reading again</button>
                </div>
              )}
              {narrative.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>

          {reading && <blockquote className="reading-quote">“{reading.movements[movement].quote}”</blockquote>}
          {reading && (
            <section className="development-invitation">
              <span aria-hidden="true">✦</span>
              <div><p className="eyebrow">Development invitation</p><p>{reading.movements[movement].invitation}</p></div>
            </section>
          )}

          {reading && <footer className="movement-actions">
            <button type="button" className="secondary-button" onClick={previous} disabled={movement === 0}><ChevronLeft size={15} /> Previous</button>
            {movement < movements.length - 1 ? (
              <button type="button" className="primary-button" onClick={next}>Next: {movements[movement + 1].nav} <ChevronRight size={15} /></button>
            ) : (
              <button type="button" className="primary-button" onClick={() => setMovement(0)}><RotateCcw size={15} /> Return to Overture</button>
            )}
          </footer>}
        </article>

        <aside className={`apparatus-panel${apparatusExpanded ? "" : " collapsed"}`}>
          <div className="apparatus-bar">
            <div className="apparatus-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={apparatusTab === "apparatus"} className={apparatusTab === "apparatus" ? "active" : ""} onClick={() => { setApparatusTab("apparatus"); setApparatusExpanded(true); }}>Apparatus</button>
              <button type="button" role="tab" aria-selected={apparatusTab === "notes"} className={apparatusTab === "notes" ? "active" : ""} onClick={() => { setApparatusTab("notes"); setApparatusExpanded(true); }}>Notes</button>
            </div>
            <button
              type="button"
              className="apparatus-collapse-toggle"
              aria-expanded={apparatusExpanded}
              aria-controls="apparatus-content"
              onClick={() => setApparatusExpanded((expanded) => !expanded)}
            >
              <span>{apparatusExpanded ? "Hide panel" : "Show panel"}</span>
              {apparatusExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
          <div id="apparatus-content" className="apparatus-content" hidden={!apparatusExpanded}>
            {apparatusTab === "apparatus" ? (
              <div className="apparatus-body">
                <h2>Planet positions</h2>
                <p className="codex-hint">Click a placement to open the Codex — its deeper page, authored for exactly that symbol.</p>
                <table>
                  <thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th></tr></thead>
                  <tbody>
                    {BODY_ORDER.map((name) => {
                      const placement = block.placements[name];
                      if (!placement) return null;
                      const deeper = hasCodexEntry(name);
                      return (
                        <tr
                          key={name}
                          className={deeper ? "codex-row" : ""}
                          onClick={deeper ? () => setCodexTarget({ kind: "placement", body: name, sign: placement.sign, house: placement.house }) : undefined}
                        >
                          <td>
                            {deeper ? (
                              <button type="button" className="codex-link" onClick={(event) => { event.stopPropagation(); setCodexTarget({ kind: "placement", body: name, sign: placement.sign, house: placement.house }); }}>
                                <span aria-hidden="true">{BODY_GLYPH[name]}</span> {name}
                              </button>
                            ) : (
                              <><span aria-hidden="true">{BODY_GLYPH[name]}</span> {name}</>
                            )}
                            {archetypes[name] && <span className="row-archetype">{archetypes[name]}</span>}
                          </td>
                          <td>{placement.sign}</td><td>{degree(placement)}</td><td>{placement.house}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <details><summary>House cusps</summary><ol className="apparatus-list">{block.house_cusps.map((cusp, index) => <li key={index}><span>House {index + 1}</span><span>{cusp.display}</span></li>)}</ol></details>
                <details><summary>Aspects</summary><ol className="apparatus-list">{block.aspects.slice(0, 12).map((aspect, index) => <li key={index}><span>{aspect.bodies.join(` ${aspect.aspect} `)}</span><span>{aspect.orb.toFixed(2)}°</span></li>)}</ol></details>
                <details>
                  <summary>Angles</summary>
                  <ol className="apparatus-list">
                    {Object.entries(block.angles).map(([name, placement]) => (
                      <li key={name}>
                        {name === "Ascendant" ? (
                          <button type="button" className="codex-link" onClick={() => setCodexTarget({ kind: "rising", sign: placement.sign })}>{name}</button>
                        ) : (
                          <span>{name}</span>
                        )}
                        <span>{placement.display}</span>
                      </li>
                    ))}
                  </ol>
                </details>
                <p className="calculated-stamp">Calculated · never hand-typed</p>
              </div>
            ) : (
              <div className="notes-panel"><label htmlFor="chart-notes">Your notes</label><textarea id="chart-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What feels alive, resistant, or unexpectedly accurate?" /></div>
            )}
          </div>
        </aside>
      </div>

      {codexTarget && <CodexPanel target={codexTarget} onClose={() => setCodexTarget(null)} />}
    </main>
  );
}
