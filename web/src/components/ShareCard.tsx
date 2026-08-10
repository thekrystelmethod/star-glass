import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import type { CastMeta, GeneratedReading } from "../types";

interface ShareCardProps {
  wheelSvg: string;
  reading: GeneratedReading;
  meta: CastMeta;
  onClose: () => void;
}

type CardFormat = "landscape" | "portrait";
const FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  landscape: { width: 1200, height: 630, label: "Landscape · link preview" },
  portrait: { width: 1080, height: 1350, label: "Portrait · story" },
};

function themeToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

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

export function ShareCard({ wheelSvg, reading, meta, onClose }: ShareCardProps) {
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

    const bg = themeToken("--atlas-bg", "#0e1116");
    const panel = themeToken("--atlas-panel", "#161a21");
    const text1 = themeToken("--atlas-text-1", "#e8eaf0");
    const text4 = themeToken("--atlas-text-4", "#7c8392");
    const accent = themeToken("--atlas-accent", "#8fa1c2");
    const displayFont = themeToken("--font-display", "Georgia, serif");

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

    if (wheelSvg) {
      const blob = new Blob([wheelSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { draw(image); URL.revokeObjectURL(url); };
      image.onerror = () => { draw(); URL.revokeObjectURL(url); };
      image.src = url;
    } else {
      draw();
    }
  }, [sentence, format, wheelSvg, reading.title, meta]);

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
