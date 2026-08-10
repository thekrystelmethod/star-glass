import { useEffect, useMemo, useState } from "react";
import { castChart, checkEngine, renderWheel, type BirthPayload } from "./api";
import { Atmosphere, ThemeControls } from "./components/ThemeControls";
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
    try { return localStorage.getItem("starglass-atmosphere") || "quiet"; }
    catch (_) { return "quiet"; }
  });

  useEffect(() => {
    try { localStorage.setItem("starglass-atmosphere", backgroundId); } catch (_) {}
  }, [backgroundId]);

  useEffect(() => {
    if (!castResult) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ form, castResult, reading } satisfies StoredSession));
    } catch (_) {}
  }, [castResult, reading, form]);

  useEffect(() => {
    if (!castResult) return;
    let cancelled = false;
    setWheelLoading(true);
    const subtitle = `${castResult.meta.dateLabel} · ${castResult.meta.timeLabel} · ${castResult.meta.placeLabel}`;
    (async () => {
      // On a restored session the engine may still be waking on its free
      // tier, so the wheel retries patiently rather than failing once.
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        try {
          const svg = await renderWheel(castResult.chart, zodiacBlock, theme, subtitle);
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
  }, [castResult, theme, zodiacBlock]);

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
      const firstBlock = chart.tropical ? "tropical" : "sidereal";
      setZodiacBlock(firstBlock);
      setCastResult({ chart, meta });
      setReading(null);
      setReadingError("");
      setReadingLoading(true);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      composeReading({ chart, zodiac: birth.zodiac, essence: meta.essence })
        .then(setReading)
        .catch((reason) => setReadingError(reason instanceof Error ? reason.message : "StarGlass could not compose the reading."))
        .finally(() => setReadingLoading(false));
    } finally {
      setLoading(false);
      setEngineNote("Cast the chart");
    }
  };

  const editChart = () => {
    setCastResult(null);
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
        <ThemeControls backgroundId={backgroundId} onBackground={setBackgroundId} />
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
