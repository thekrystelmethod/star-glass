import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, LoaderCircle, Pencil, RefreshCw, RotateCcw } from "lucide-react";
import { activeChartBlock, type ChartResponse, type Placement } from "../api";
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
  wheelSvg: string;
  wheelLoading: boolean;
  reading: GeneratedReading | null;
  readingLoading: boolean;
  readingError: string;
  zodiacBlock: "tropical" | "sidereal";
  onZodiacBlock: (block: "tropical" | "sidereal") => void;
  onEdit: () => void;
  onRetryReading: () => void;
}

export function ReadingWorkspace({
  chart,
  meta,
  wheelSvg,
  wheelLoading,
  reading,
  readingLoading,
  readingError,
  zodiacBlock,
  onZodiacBlock,
  onEdit,
  onRetryReading,
}: ReadingWorkspaceProps) {
  const [movement, setMovement] = useState(0);
  const [apparatusTab, setApparatusTab] = useState<"apparatus" | "notes">("apparatus");
  const [notes, setNotes] = useState("");
  const block = activeChartBlock(chart, zodiacBlock);
  const movements = reading?.movements.length === 6 ? reading.movements : MOVEMENT_PLACEHOLDERS;
  const current = movements[movement];
  const dual = Boolean(chart.tropical && chart.sidereal_lahiri);
  const narrative = reading
    ? [...(movement === 0 && reading.framing ? [reading.framing] : []), ...reading.movements[movement].paragraphs]
    : [];

  const next = () => setMovement((currentIndex) => Math.min(currentIndex + 1, movements.length - 1));
  const previous = () => setMovement((currentIndex) => Math.max(currentIndex - 1, 0));

  return (
    <main className="reading-shell" id="main-content">
      <section className="chart-identity" aria-label="Current chart">
        <div className="mini-wheel" aria-hidden="true">◎</div>
        <div><strong>{meta.dateLabel}</strong><span>Date of birth</span></div>
        <div><strong>{meta.timeLabel}</strong><span>Local time</span></div>
        <div><strong>{meta.placeLabel}</strong><span>Birthplace</span></div>
        <div><strong>{meta.zodiacLabel} · {meta.houseLabel}</strong><span>Zodiac · houses</span></div>
        <button type="button" className="secondary-button edit-button" onClick={onEdit}><Pencil size={15} /> Edit / recast</button>
      </section>

      <div className="reading-grid">
        <nav className="movement-nav" aria-label="Reading movements">
          <p className="eyebrow">The reading</p>
          <ol>
            {movements.map((item, index) => (
              <li key={item.nav}>
                <button type="button" disabled={!reading} className={movement === index ? "active" : ""} aria-current={movement === index ? "step" : undefined} onClick={() => setMovement(index)}>
                  <span>{index + 1}</span>
                  <span><strong>{item.nav}</strong><small>{item.title}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="reading-guide"><BookOpen size={17} /><span><strong>Reading guide</strong><small>Move in order, or follow what calls.</small></span></div>
        </nav>

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

          <div className="movement-hero">
            <div className={`wheel-stage${wheelLoading ? " loading" : ""}`} aria-label="Natal chart wheel">
              {wheelSvg ? <div className="wheel-svg" dangerouslySetInnerHTML={{ __html: wheelSvg }} /> : <div className="wheel-placeholder">Drawing the chart…</div>}
            </div>
            <div className="movement-prose">
              {readingLoading && !reading && (
                <div className="reading-composer" role="status">
                  <LoaderCircle size={22} aria-hidden="true" />
                  <strong>Composing your portrait</strong>
                  <p>StarGlass is weighing the chart, finding repeated themes, and writing each movement fresh.</p>
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

        <aside className="apparatus-panel">
          <div className="apparatus-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={apparatusTab === "apparatus"} className={apparatusTab === "apparatus" ? "active" : ""} onClick={() => setApparatusTab("apparatus")}>Apparatus</button>
            <button type="button" role="tab" aria-selected={apparatusTab === "notes"} className={apparatusTab === "notes" ? "active" : ""} onClick={() => setApparatusTab("notes")}>Notes</button>
          </div>
          {apparatusTab === "apparatus" ? (
            <div className="apparatus-body">
              <h2>Planet positions</h2>
              <table>
                <thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th></tr></thead>
                <tbody>
                  {BODY_ORDER.map((name) => {
                    const placement = block.placements[name];
                    if (!placement) return null;
                    return <tr key={name}><td><span aria-hidden="true">{BODY_GLYPH[name]}</span> {name}</td><td>{placement.sign}</td><td>{degree(placement)}</td><td>{placement.house}</td></tr>;
                  })}
                </tbody>
              </table>
              <details><summary>House cusps</summary><ol className="apparatus-list">{block.house_cusps.map((cusp, index) => <li key={index}><span>House {index + 1}</span><span>{cusp.display}</span></li>)}</ol></details>
              <details><summary>Aspects</summary><ol className="apparatus-list">{block.aspects.slice(0, 12).map((aspect, index) => <li key={index}><span>{aspect.bodies.join(` ${aspect.aspect} `)}</span><span>{aspect.orb.toFixed(2)}°</span></li>)}</ol></details>
              <details><summary>Angles</summary><ol className="apparatus-list">{Object.entries(block.angles).map(([name, placement]) => <li key={name}><span>{name}</span><span>{placement.display}</span></li>)}</ol></details>
              <p className="calculated-stamp">Calculated · never hand-typed</p>
            </div>
          ) : (
            <div className="notes-panel"><label htmlFor="chart-notes">Your notes</label><textarea id="chart-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What feels alive, resistant, or unexpectedly accurate?" /></div>
          )}
        </aside>
      </div>
    </main>
  );
}
