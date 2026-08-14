import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { activeChartBlock, renderWheel, type ChartResponse, type Placement } from "../api";
import { getRegister } from "../theme/themes";
import type { CastMeta, GeneratedReading } from "../types";

/**
 * The report is a printed artifact, so it wears a bound register: Impression,
 * Observatory's print sibling — true white stock, rules instead of panels.
 * That is a fact about paper, not a matter of taste, so the register on screen
 * has no say here. App puts data-theme="impression" on the report shell, which
 * is what makes every --atlas-* token inside this component resolve to
 * Impression's ink; the wheel is handed the same register's palette below.
 */
const PRINT = getRegister("impression");

const BODY_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "North Node", "South Node"];
const BODY_GLYPH: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Chiron: "⚷",
  "North Node": "☊", "South Node": "☋",
};

function degreeLabel(placement?: Placement) {
  if (!placement) return "—";
  return `${placement.degree_in_sign}°${String(placement.minute).padStart(2, "0")}′${placement.retrograde ? " ℞" : ""}`;
}

interface ReportViewProps {
  chart: ChartResponse;
  meta: CastMeta;
  reading: GeneratedReading;
  /** True when this portrait was HELD by the audit rather than published.
      The prose is complete; one factual claim in it did not reconcile with
      the calculated chart. It prints, but it prints saying so. */
  unverified?: boolean;
  zodiacBlock: "tropical" | "sidereal";
  onBack: () => void;
}

export function ReportView({ chart, meta, reading, unverified = false, zodiacBlock, onBack }: ReportViewProps) {
  const [wheelSvg, setWheelSvg] = useState("");
  const [movementWheels, setMovementWheels] = useState<Record<number, string>>({});
  const block = activeChartBlock(chart, zodiacBlock);
  const birthLine = `${meta.dateLabel} · ${meta.timeLabel} · ${meta.placeLabel}`;
  const castStamp = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  // The wheel is drawn on Impression's stock too, whatever the screen wears.
  // Each movement that names its bodies also gets a thematic wheel — the
  // geometry that movement reads, everything else receded.
  useEffect(() => {
    let cancelled = false;
    renderWheel(chart, zodiacBlock, PRINT, birthLine, { transparent: false, size: 1300, palette: PRINT.wheel })
      .then((svg) => { if (!cancelled) setWheelSvg(svg); })
      .catch(() => { if (!cancelled) setWheelSvg(""); });
    reading.movements.forEach((movement, index) => {
      if (!movement.bodies || movement.bodies.length === 0) return;
      renderWheel(chart, zodiacBlock, PRINT, movement.nav, {
        transparent: false, size: 820, palette: PRINT.wheel, highlight: movement.bodies,
      })
        .then((svg) => { if (!cancelled) setMovementWheels((prior) => ({ ...prior, [index]: svg })); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [chart, zodiacBlock]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.add("report-open");
    return () => document.body.classList.remove("report-open");
  }, []);

  return (
    <div className="report-view">
      <div className="report-toolbar no-print">
        <button type="button" className="secondary-button" onClick={onBack}><ArrowLeft size={15} /> Back to the reading</button>
        <p>Use your browser's print dialog to save this as a PDF.</p>
        <button type="button" className="primary-button" onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</button>
      </div>

      <article className="report-page">
        <section className="report-cover">
          <p className="report-eyebrow">STARGLASS · NATAL PORTRAIT</p>
          <h1>{reading.title}</h1>
          <p className="report-birth-line">{birthLine}</p>
          <p className="report-settings-line">{meta.zodiacLabel} zodiac · {meta.houseLabel} houses</p>
          {unverified && (
            <p className="report-unverified">Unverified draft — one claim in this portrait could not be reconciled with the calculated chart.</p>
          )}
          {wheelSvg
            ? <div className="report-wheel" dangerouslySetInnerHTML={{ __html: wheelSvg }} />
            : <p className="report-wheel-placeholder no-print">Drawing the wheel for print…</p>}
          {reading.framing && <p className="report-framing">{reading.framing}</p>}
        </section>

        {reading.movements.map((movement, index) => (
          <section key={movement.nav} className="report-movement">
            <p className="report-eyebrow">{index + 1} · {movement.nav}</p>
            <h2>{movement.title}</h2>
            <p className="report-subtitle">{movement.subtitle}</p>
            {movementWheels[index] && (
              <figure className="report-movement-wheel">
                <div dangerouslySetInnerHTML={{ __html: movementWheels[index] }} />
                <figcaption>The geometry this movement reads: {movement.bodies?.join(", ")}.</figcaption>
              </figure>
            )}
            {movement.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)}
            <blockquote>“{movement.quote}”</blockquote>
            <p className="report-invitation"><span aria-hidden="true">✦</span> <strong>Development invitation.</strong> {movement.invitation}</p>
            {movement.bridge && <p className="report-bridge">{movement.bridge}</p>}
          </section>
        ))}

        <section className="report-apparatus">
          <p className="report-eyebrow">APPARATUS</p>
          <h2>The calculated chart</h2>
          <table>
            <thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th></tr></thead>
            <tbody>
              {BODY_ORDER.map((name) => {
                const placement = block.placements[name];
                if (!placement) return null;
                return <tr key={name}><td><span aria-hidden="true">{BODY_GLYPH[name]}&#xFE0E;</span> {name}</td><td>{placement.sign}</td><td>{degreeLabel(placement)}</td><td>{placement.house}</td></tr>;
              })}
            </tbody>
          </table>

          <div className="report-tables">
            <div>
              <h3>Angles</h3>
              <ol>{Object.entries(block.angles).map(([name, placement]) => <li key={name}><span>{name}</span><span>{placement.display}</span></li>)}</ol>
            </div>
            <div>
              <h3>House cusps</h3>
              <ol>{block.house_cusps.map((cusp, index) => <li key={index}><span>House {index + 1}</span><span>{cusp.display}</span></li>)}</ol>
            </div>
          </div>

          <h3>Aspects</h3>
          <ol className="report-aspects">
            {block.aspects.map((aspect, index) => (
              <li key={index}><span>{aspect.bodies.join(` ${aspect.aspect} `)}</span><span>{aspect.orb.toFixed(2)}° orb</span></li>
            ))}
          </ol>
        </section>

        <footer className="report-colophon">
          <p>Cast by StarGlass on {castStamp}. Positions computed with the Swiss Ephemeris — calculated, never hand-typed.</p>
          {unverified && (
            <p>This copy did not pass the calculation audit. Every position above is computed; one interpretive claim in the prose makes a geometric statement the ledger does not support. Read it as a draft.</p>
          )}
          <p>The portrait is a field guide, not a verdict: test it against the actual texture of your days.</p>
        </footer>
      </article>
    </div>
  );
}
