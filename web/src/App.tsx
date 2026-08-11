import { useEffect, useMemo, useRef, useState } from "react";
import { castChart, checkEngine, renderWheel, type BirthPayload } from "./api";
import { HOUSE_LABELS } from "./components/ChartForm";
import { ThemeControls } from "./components/ThemeControls";
import { Atmosphere, DEFAULT_MOMENT, migrateAtmosphereId } from "./motion/catalog";
import { ChartForm } from "./components/ChartForm";
import { ReadingWorkspace } from "./components/ReadingWorkspace";
import { ReportView } from "./components/ReportView";
import { ShareCard } from "./components/ShareCard";
import { composeReading } from "./interpretation";
import { useTheme } from "./theme/ThemeProvider";
import type { BirthFormState, CastMeta, CastResult, GeneratedReading } from "./types";

const INITIAL_FORM: BirthFormState = {
  month: "3",
  day: "15",
  year: "1986",
  hour: "2",
  minute: "30",
  period: null,
  placeLabel: "Minneapolis, Minnesota, United States",
  lat: 44.98,
  lon: -93.27,
  tz: "America/Chicago",
  essence: null,
  zodiac: "tropical",
  houses: "P",
  orbs: "standard",
  quincunx: false,
  minorAspects: false,
  vedic: false,
};

// The cast chart, the composed portrait, and the person's form all persist
// locally: nothing a visitor makes here should evaporate with the tab.
const SESSION_KEY = "starglass-session-v1";

interface StoredSession {
  form: BirthFormState;
  castResult: CastResult;
  reading: GeneratedReading | null;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.castResult?.chart || !parsed?.castResult?.meta) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function chartKeyOf(meta: CastMeta | undefined): string {
  if (!meta) return "none";
  const source = JSON.stringify(meta.birth);
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash * 33) ^ source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function App() {
  const { theme } = useTheme();
  const restored = useMemo(loadSession, []);
  const [form, setForm] = useState<BirthFormState>(restored?.form ?? INITIAL_FORM);
  const [castResult, setCastResult] = useState<CastResult | null>(restored?.castResult ?? null);
  const [loading, setLoading] = useState(false);
  const [engineNote, setEngineNote] = useState("Cast the chart");
  const [wheelSvg, setWheelSvg] = useState("");
  const [wheelLoading, setWheelLoading] = useState(false);
  const [reading, setReading] = useState<GeneratedReading | null>(restored?.reading ?? null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState("");
  const [zodiacBlock, setZodiacBlock] = useState<"tropical" | "sidereal">(
    restored?.castResult?.chart.tropical ? "tropical" : restored?.castResult ? "sidereal" : "tropical",
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [backgroundId, setBackgroundId] = useState(() => {
    try { return migrateAtmosphereId(localStorage.getItem("starglass-atmosphere")); }
    catch (_) { return migrateAtmosphereId(null); }
  });
  const [momentId, setMomentId] = useState(() => {
    try { return localStorage.getItem("starglass-moment") || DEFAULT_MOMENT; }
    catch (_) { return DEFAULT_MOMENT; }
  });
  // The ceremony fires only when a portrait finishes composing in THIS visit —
  // never on a restored session, so reloads stay calm.
  const [ceremonyTrigger, setCeremonyTrigger] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem("starglass-atmosphere", backgroundId); } catch (_) {}
  }, [backgroundId]);
  useEffect(() => {
    try { localStorage.setItem("starglass-moment", momentId); } catch (_) {}
  }, [momentId]);

  useEffect(() => {
    if (!castResult) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ form, castResult, reading } satisfies StoredSession));
    } catch (_) {}
  }, [castResult, reading, form]);

  // Which bodies the current movement is reading — the wheel spotlights these
  // (the engine's thematic-wheel mode). Null = the full, unfocused wheel.
  const [focusBodies, setFocusBodies] = useState<string[] | null>(null);
  const wheelCache = useRef(new Map<string, string>());
  const focusKey = focusBodies && focusBodies.length ? [...focusBodies].sort().join("+") : "";

  useEffect(() => {
    if (!castResult) return;
    let cancelled = false;
    const cacheKey = `${chartKeyOf(castResult.meta)}|${zodiacBlock}|${theme.id}|${focusKey}`;
    const cached = wheelCache.current.get(cacheKey);
    if (cached) { setWheelSvg(cached); setWheelLoading(false); return; }
    setWheelLoading(true);
    const subtitle = `${castResult.meta.dateLabel} · ${castResult.meta.timeLabel} · ${castResult.meta.placeLabel}`;
    (async () => {
      // On a restored session the engine may still be waking on its free
      // tier, so the wheel retries patiently rather than failing once.
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        try {
          const svg = await renderWheel(castResult.chart, zodiacBlock, theme, subtitle, {
            highlight: focusBodies ?? undefined,
          });
          wheelCache.current.set(cacheKey, svg);
          if (wheelCache.current.size > 40) {
            wheelCache.current.delete(wheelCache.current.keys().next().value as string);
          }
          if (!cancelled) setWheelSvg(svg);
          break;
        } catch (_) {
          if (attempt === 5) { if (!cancelled) setWheelSvg(""); break; }
          await wait(4000 + attempt * 2000);
        }
      }
      if (!cancelled) setWheelLoading(false);
    })();
    return () => { cancelled = true; };
  }, [castResult, theme, zodiacBlock, focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureEngine = async () => {
    const messages = ["Reaching the sky…", "Warming StarGlass…", "Nearly there…"];
    for (let attempt = 0; attempt < 16; attempt += 1) {
      setEngineNote(messages[Math.min(Math.floor(attempt / 4), messages.length - 1)]);
      try {
        await checkEngine();
        return;
      } catch (_) {
        if (attempt === 15) throw new Error("The chart engine is still waking. Please cast again in a moment.");
        await wait(3500);
      }
    }
  };

  const handleCast = async (birth: BirthPayload, meta: CastMeta) => {
    setLoading(true);
    setEngineNote("Reaching the sky…");
    try {
      await ensureEngine();
      setEngineNote("Calculating the chart…");
      const chart = await castChart(birth);
      // The displayed method labels derive from the EFFECTIVE settings the
      // engine says it calculated with — never from what the form asked.
      const effective = (chart.input ?? {}) as { zodiac?: string; house_system?: string; vedic?: boolean };
      const effectiveMeta: CastMeta = {
        ...meta,
        zodiacLabel: effective.zodiac
          ? (effective.zodiac === "dual" ? "Dual · Holistic"
            : effective.zodiac === "sidereal" ? (effective.vedic ? "Sidereal · Lahiri (Jyotish)" : "Sidereal · Lahiri")
            : "Tropical")
          : meta.zodiacLabel,
        houseLabel: effective.house_system ? (HOUSE_LABELS[effective.house_system] ?? effective.house_system) : meta.houseLabel,
      };
      const firstBlock = chart.tropical ? "tropical" : "sidereal";
      setZodiacBlock(firstBlock);
      setCastResult({ chart, meta: effectiveMeta });
      setFocusBodies(null);
      setReading(null);
      setReadingError("");
      setReadingLoading(true);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      composeReading({ chart, zodiac: birth.zodiac, essence: meta.essence })
        .then((composed) => { setReading(composed); setCeremonyTrigger(`portrait-${Date.now()}`); })
        .catch((reason) => setReadingError(reason instanceof Error ? reason.message : "StarGlass could not compose the reading."))
        .finally(() => setReadingLoading(false));
    } finally {
      setLoading(false);
      setEngineNote("Cast the chart");
    }
  };

  const editChart = () => {
    setCastResult(null);
    setFocusBodies(null);
    setWheelSvg("");
    setReading(null);
    setReadingError("");
    setReadingLoading(false);
    setReportOpen(false);
    setShareOpen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const retryReading = async () => {
    if (!castResult || readingLoading) return;
    setReadingError("");
    setReadingLoading(true);
    try {
      const nextReading = await composeReading({
        chart: castResult.chart,
        zodiac: castResult.meta.birth.zodiac,
        essence: castResult.meta.essence,
      });
      setReading(nextReading);
      setCeremonyTrigger(`portrait-${Date.now()}`);
    } catch (reason) {
      setReadingError(reason instanceof Error ? reason.message : "StarGlass could not compose the reading.");
    } finally {
      setReadingLoading(false);
    }
  };

  const chartKey = chartKeyOf(castResult?.meta);

  if (castResult && reading && reportOpen) {
    return (
      <div className="app-shell report-shell">
        <ReportView
          chart={castResult.chart}
          meta={castResult.meta}
          reading={reading}
          zodiacBlock={zodiacBlock}
          onBack={() => setReportOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Atmosphere id={backgroundId} />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <div className="brand-lockup">
          <strong>StarGlass</strong>
          <span>the interpretation engine</span>
        </div>
        <ThemeControls
          backgroundId={backgroundId}
          onBackground={setBackgroundId}
          momentId={momentId}
          onMoment={setMomentId}
        />
      </header>

      {castResult ? (
        <ReadingWorkspace
          chart={castResult.chart}
          meta={castResult.meta}
          chartKey={chartKey}
          wheelSvg={wheelSvg}
          wheelLoading={wheelLoading}
          reading={reading}
          readingLoading={readingLoading}
          readingError={readingError}
          zodiacBlock={zodiacBlock}
          onZodiacBlock={setZodiacBlock}
          onEdit={editChart}
          onRetryReading={retryReading}
          onOpenReport={() => setReportOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          momentId={momentId}
          ceremonyTrigger={ceremonyTrigger}
          onMovementFocus={setFocusBodies}
        />
      ) : (
        <ChartForm
          value={form}
          onChange={setForm}
          onCast={handleCast}
          loading={loading}
          engineNote={engineNote}
        />
      )}

      {castResult && reading && shareOpen && (
        <ShareCard
          wheelSvg={wheelSvg}
          reading={reading}
          meta={castResult.meta}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
