import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { renderWheel, type ChartResponse } from "../api";
import { getRegister } from "../theme/themes";
import type { CastMeta, GeneratedReading } from "../types";

/**
 * The card is a travelling artifact: it lands in someone else's timeline, on
 * someone else's ground, so it wears a bound register — Emissary, deeper and
 * cooler than Nocturne so the card reads as an object rather than a screenshot
 * of an app. Reading the live --atlas-* tokens off <html> (what this did
 * before) meant the card inherited whatever register the sender happened to be
 * in, and a Plate card exported as white-on-white.
 */
const CARD = getRegister("emissary");
/**
 * Canvas measures text against a real font stack, not a custom property, so
 * the card names Emissary's display face directly. The face has to be LOADED
 * before the first measureText, or the lines are broken against Georgia's
 * metrics and the exported PNG wraps in the wrong places — hence the
 * document.fonts wait before drawing.
 */
const CARD_FONT = '"Bodoni Moda", Didot, Georgia, serif';

interface ShareCardProps {
  /** The on-screen wheel, in the sender's register — the fallback only. */
  wheelSvg: string;
  chart: ChartResponse;
  zodiacBlock: "tropical" | "sidereal";
  reading: GeneratedReading;
  meta: CastMeta;
  onClose: () => void;
}

type CardFormat = "landscape" | "portrait";
const FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  landscape: { width: 1200, height: 630, label: "Landscape · link preview" },
  portrait: { width: 1080, height: 1350, label: "Portrait · story" },
};

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ShareCard({ wheelSvg, chart, zodiacBlock, reading, meta, onClose }: ShareCardProps) {
  const sentences = useMemo(() => {
    const collected: string[] = [];
    if (reading.framing) collected.push(reading.framing);
    for (const movement of reading.movements) {
      if (movement.quote) collected.push(movement.quote);
    }
    return collected;
  }, [reading]);

  const [sentence, setSentence] = useState(sentences[1] ?? sentences[0] ?? "");
  const [format, setFormat] = useState<CardFormat>("landscape");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The wheel behind the quote is drawn in Emissary too. Reusing the on-screen
  // SVG would put the sender's register on the card — a Plate wheel is nearly
  // black, and at 34% alpha on Emissary's violet ground it disappears. If the
  // engine is asleep the on-screen wheel is still better than nothing.
  const [cardWheel, setCardWheel] = useState(wheelSvg);
  useEffect(() => {
    let cancelled = false;
    renderWheel(chart, zodiacBlock, CARD, `${meta.dateLabel} · ${meta.placeLabel}`, {
      transparent: true, size: 1100, palette: CARD.wheel,
    })
      .then((svg) => { if (!cancelled) setCardWheel(svg); })
      .catch(() => { if (!cancelled) setCardWheel(wheelSvg); });
    return () => { cancelled = true; };
  }, [chart, zodiacBlock, wheelSvg, meta.dateLabel, meta.placeLabel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = FORMATS[format];
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    const bg = CARD.tokens["--atlas-bg"];
    const panel = CARD.tokens["--atlas-panel"];
    const text1 = CARD.tokens["--atlas-text-1"];
    const text4 = CARD.tokens["--atlas-text-4"];
    const accent = CARD.tokens["--atlas-accent"];
    // Canvas takes a font stack, not a CSS custom property.
    const displayFont = CARD_FONT;

    const draw = (wheelImage?: HTMLImageElement) => {
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, bg);
      gradient.addColorStop(1, panel);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      if (wheelImage) {
        const size = format === "landscape" ? height * 1.5 : width * 1.35;
        context.save();
        context.globalAlpha = 0.34;
        context.drawImage(
          wheelImage,
          format === "landscape" ? width - size * 0.72 : width / 2 - size / 2,
          format === "landscape" ? height / 2 - size / 2 : height - size * 0.62,
          size, size,
        );
        context.restore();
      }

      const margin = Math.round(width * 0.07);
      const textWidth = format === "landscape" ? width * 0.56 : width - margin * 2;

      context.fillStyle = accent;
      context.font = `600 ${Math.round(width * 0.016)}px ${displayFont}`;
      context.fillText("S T A R G L A S S", margin, margin + width * 0.01);

      context.fillStyle = text4;
      context.font = `italic ${Math.round(width * 0.018)}px ${displayFont}`;
      context.fillText(reading.title, margin, margin + width * 0.045);

      context.fillStyle = text1;
      const quoteSize = Math.round(width * (format === "landscape" ? 0.037 : 0.045));
      context.font = `italic ${quoteSize}px ${displayFont}`;
      const lines = wrapText(context, `“${sentence}”`, textWidth);
      const lineHeight = quoteSize * 1.38;
      const blockHeight = lines.length * lineHeight;
      let cursorY = format === "landscape"
        ? Math.max(height / 2 - blockHeight / 2 + quoteSize, margin + width * 0.1)
        : margin + width * 0.14;
      for (const line of lines) {
        context.fillText(line, margin, cursorY);
        cursorY += lineHeight;
      }

      context.fillStyle = text4;
      context.font = `${Math.round(width * 0.0155)}px ${displayFont}`;
      context.fillText(`${meta.dateLabel} · ${meta.placeLabel}`, margin, height - margin * 0.9);
      context.fillStyle = accent;
      context.fillText("star-glass.netlify.app", margin, height - margin * 0.9 + width * 0.024);
    };

    // Wait for the card's own face before measuring a single line. Both
    // weights the card uses, at a nominal size — the promise resolves
    // immediately once they are in the document's font set.
    const ready = document.fonts?.load
      ? Promise.all([
        document.fonts.load(`italic 40px ${CARD_FONT}`),
        document.fonts.load(`600 20px ${CARD_FONT}`),
      ]).catch(() => undefined)
      : Promise.resolve(undefined);

    let cancelled = false;
    ready.then(() => {
      if (cancelled) return;
      if (cardWheel) {
        const blob = new Blob([cardWheel], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => { if (!cancelled) draw(image); URL.revokeObjectURL(url); };
        image.onerror = () => { if (!cancelled) draw(); URL.revokeObjectURL(url); };
        image.src = url;
      } else {
        draw();
      }
    });
    return () => { cancelled = true; };
  }, [sentence, format, cardWheel, reading.title, meta]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `starglass-card-${format}.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  };

  return createPortal(
    <>
      <div className="codex-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="share-card-modal" role="dialog" aria-modal="true" aria-label="Share card">
        <header className="share-card-header">
          <div>
            <p className="eyebrow">Share a line of your portrait</p>
            <h2>The card carries one sentence</h2>
          </div>
          <button type="button" className="codex-icon-button" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </header>

        <div className="share-card-body">
          <div className="share-card-controls">
            <p className="share-card-hint">Choosing the line is part of the reading: which sentence is yours today?</p>
            <div className="share-card-sentences" role="radiogroup" aria-label="Sentence for the card">
              {sentences.map((candidate) => (
                <button
                  key={candidate.slice(0, 40)}
                  type="button"
                  role="radio"
                  aria-checked={candidate === sentence}
                  className={candidate === sentence ? "active" : ""}
                  onClick={() => setSentence(candidate)}
                >
                  {candidate}
                </button>
              ))}
            </div>
            <div className="share-card-formats" role="radiogroup" aria-label="Card format">
              {(Object.keys(FORMATS) as CardFormat[]).map((key) => (
                <button key={key} type="button" role="radio" aria-checked={format === key} className={format === key ? "active" : ""} onClick={() => setFormat(key)}>
                  {FORMATS[key].label}
                </button>
              ))}
            </div>
            <button type="button" className="primary-button" onClick={download}><Download size={15} /> Download PNG</button>
          </div>
          <div className="share-card-preview">
            <canvas ref={canvasRef} aria-label="Share card preview" />
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
