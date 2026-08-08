import { useEffect, useMemo, useState, type FormEvent, type SelectHTMLAttributes } from "react";
import { BookOpenCheck, CalendarDays, ChevronDown, Crosshair, LockKeyhole, Orbit, TableProperties } from "lucide-react";
import type { BirthPayload } from "../api";
import type { BirthFormState, CastMeta } from "../types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOUSE_LABELS: Record<string, string> = {
  P: "Placidus", W: "Whole sign", K: "Koch", E: "Equal",
  C: "Campanus", R: "Regiomontanus", O: "Porphyry",
};

interface GeocodeResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface ChartFormProps {
  value: BirthFormState;
  onChange: (next: BirthFormState) => void;
  onCast: (birth: BirthPayload, meta: CastMeta) => Promise<void>;
  loading: boolean;
  engineNote: string;
}

function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select-shell">
      <select {...props} />
      <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

export function ChartForm({ value, onChange, onCast, loading, engineNote }: ChartFormProps) {
  const [error, setError] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [placeConfirmed, setPlaceConfirmed] = useState(true);
  const [searching, setSearching] = useState(false);

  const update = <K extends keyof BirthFormState>(key: K, next: BirthFormState[K]) => {
    onChange({ ...value, [key]: next });
    setError("");
  };

  useEffect(() => {
    const query = value.placeLabel.trim();
    if (placeConfirmed || query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
          { signal: controller.signal },
        );
        const data = await response.json();
        setResults(data.results || []);
      } catch (reason) {
        if ((reason as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [placeConfirmed, value.placeLabel]);

  const timeOptions = useMemo(() => Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")), []);

  const selectPlace = (place: GeocodeResult) => {
    const label = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
    onChange({
      ...value,
      placeLabel: label,
      lat: place.latitude,
      lon: place.longitude,
      tz: place.timezone,
    });
    setPlaceConfirmed(true);
    setResults([]);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const month = Number(value.month);
      const day = Number(value.day);
      const year = Number(value.year);
      let hour = Number(value.hour);
      const minute = Number(value.minute);
      if (!value.period) throw new Error("Choose AM or PM before casting the chart.");
      if (!month || !day || !year) throw new Error("Enter a complete birth date.");
      if (Number.isNaN(hour) || Number.isNaN(minute)) throw new Error("Enter a complete local birth time.");
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        throw new Error("That birth date does not exist on the calendar.");
      }
      if (!placeConfirmed || !value.tz) throw new Error("Choose a birthplace from the suggestions, or fine-tune the location.");
      hour %= 12;
      if (value.period === "PM") hour += 12;
      const pad = (number: number) => String(number).padStart(2, "0");
      const birth: BirthPayload = {
        date: `${year}-${pad(month)}-${pad(day)}`,
        time: `${pad(hour)}:${pad(minute)}`,
        tz: value.tz,
        lat: value.lat,
        lon: value.lon,
        zodiac: value.zodiac,
        house_system: value.houses,
        orbs: value.orbs,
        quincunx: value.quincunx,
        minor_aspects: value.minorAspects,
        vedic: value.vedic,
      };
      const meta: CastMeta = {
        dateLabel: `${MONTHS[month - 1]} ${day}, ${year}`,
        timeLabel: `${value.hour}:${value.minute} ${value.period}`,
        placeLabel: value.placeLabel,
        zodiacLabel: value.zodiac === "dual" ? "Dual · Holistic" : value.zodiac[0].toUpperCase() + value.zodiac.slice(1),
        houseLabel: HOUSE_LABELS[value.houses] || value.houses,
        birth,
        essence: value.essence,
      };
      await onCast(birth, meta);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The chart could not be cast.");
    }
  };

  return (
    <main className="creation-layout" id="main-content">
      <section className="creation-form-panel">
        <div className="creation-heading">
          <p className="eyebrow">Birth data</p>
          <h1>Cast a chart</h1>
          <p>Enter the moment and place of birth. The interpretation comes after the chart is cast.</p>
        </div>

        <form onSubmit={submit} className="birth-form" noValidate>
          <fieldset>
            <legend>Date of birth</legend>
            <div className="date-grid">
              <label>
                <span className="sr-only">Month</span>
                <SelectField value={value.month} onChange={(event) => update("month", event.target.value)}>
                  {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                </SelectField>
              </label>
              <label><span className="sr-only">Day</span><input value={value.day} inputMode="numeric" aria-label="Day" onChange={(event) => update("day", event.target.value)} /></label>
              <label><span className="sr-only">Year</span><input value={value.year} inputMode="numeric" aria-label="Year" onChange={(event) => update("year", event.target.value)} /></label>
              <CalendarDays className="field-icon" size={17} aria-hidden="true" />
            </div>
          </fieldset>

          <fieldset>
            <legend>Time of birth <span>(local)</span></legend>
            <div className="time-grid">
              <SelectField aria-label="Hour" value={value.hour} onChange={(event) => update("hour", event.target.value)}>
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
              </SelectField>
              <SelectField aria-label="Minute" value={value.minute} onChange={(event) => update("minute", event.target.value)}>
                {timeOptions.map((minute) => <option key={minute}>{minute}</option>)}
              </SelectField>
              <div className="segmented period-toggle" aria-label="AM or PM">
                {(["AM", "PM"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={value.period === period ? "active" : ""}
                    aria-pressed={value.period === period}
                    onClick={() => update("period", value.period === period ? null : period)}
                  >{period}</button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Birthplace</legend>
            <div className="place-field">
              <input
                value={value.placeLabel}
                autoComplete="off"
                aria-label="Birthplace"
                onChange={(event) => {
                  update("placeLabel", event.target.value);
                  setPlaceConfirmed(false);
                }}
              />
              <Crosshair size={17} aria-hidden="true" />
              {!placeConfirmed && (searching || results.length > 0) && (
                <div className="place-results" role="listbox" aria-label="Birthplace suggestions">
                  {searching && <p>Searching…</p>}
                  {results.map((result) => (
                    <button key={`${result.latitude}-${result.longitude}`} type="button" onClick={() => selectPlace(result)}>
                      <strong>{result.name}</strong>
                      <span>{[result.admin1, result.country].filter(Boolean).join(", ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend>Essence <span>optional · tunes the archetypal voice</span></legend>
            <div className="segmented essence-toggle" aria-label="Essence">
              <button type="button" aria-label="Venus essence" aria-pressed={value.essence === "venus"} className={value.essence === "venus" ? "active" : ""} onClick={() => update("essence", value.essence === "venus" ? null : "venus")}>
                <span aria-hidden="true">♀</span>
              </button>
              <button type="button" aria-label="Mars essence" aria-pressed={value.essence === "mars"} className={value.essence === "mars" ? "active" : ""} onClick={() => update("essence", value.essence === "mars" ? null : "mars")}>
                <span aria-hidden="true">♂</span>
              </button>
            </div>
          </fieldset>

          <div className="settings-grid">
            <label><span>Zodiac</span><SelectField value={value.zodiac} onChange={(event) => update("zodiac", event.target.value as BirthFormState["zodiac"])}><option value="tropical">Tropical</option><option value="sidereal">Sidereal · Lahiri</option><option value="dual">Dual · Holistic</option></SelectField></label>
            <label><span>Houses</span><SelectField value={value.houses} onChange={(event) => update("houses", event.target.value)}>{Object.entries(HOUSE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField></label>
            <label><span>Orbs</span><SelectField value={value.orbs} onChange={(event) => update("orbs", event.target.value as BirthFormState["orbs"])}><option value="tight">Tight</option><option value="standard">Standard</option><option value="wide">Wide</option></SelectField></label>
          </div>

          <details className="fine-tune">
            <summary>Fine-tune coordinates &amp; timezone</summary>
            <div className="fine-tune-grid">
              <label><span>Latitude</span><input type="number" step="any" value={value.lat} onChange={(event) => update("lat", Number(event.target.value))} /></label>
              <label><span>Longitude</span><input type="number" step="any" value={value.lon} onChange={(event) => update("lon", Number(event.target.value))} /></label>
              <label><span>Timezone</span><input value={value.tz} onChange={(event) => update("tz", event.target.value)} /></label>
            </div>
          </details>

          <details className="fine-tune">
            <summary>Aspects <span>optional</span></summary>
            <div className="aspect-options">
              <label><input type="checkbox" checked={value.quincunx} onChange={(event) => update("quincunx", event.target.checked)} /> Quincunx</label>
              <label><input type="checkbox" checked={value.minorAspects} onChange={(event) => update("minorAspects", event.target.checked)} /> Minor aspects</label>
              <label><input type="checkbox" checked={value.vedic} onChange={(event) => update("vedic", event.target.checked)} /> Vedic apparatus</label>
            </div>
          </details>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button cast-button" type="submit" disabled={loading}>
            {loading ? engineNote : "Cast the chart"}
          </button>
          <p className="deterministic-note"><LockKeyhole size={14} /> Calculated positions are deterministic.</p>
        </form>
      </section>

      <section className="creation-promise" aria-labelledby="after-cast-title">
        <div className="promise-copy">
          <p className="eyebrow">After you cast</p>
          <h2 id="after-cast-title">StarGlass will calculate your chart and prepare a six-movement reading.</h2>
          <div className="promise-list">
            <div><Orbit size={25} /><span><strong>Your natal wheel</strong><small>Planetary positions and houses set the stage.</small></span></div>
            <div><TableProperties size={25} /><span><strong>Calculated apparatus</strong><small>Precise positions, degrees, houses, and aspects.</small></span></div>
            <div><BookOpenCheck size={25} /><span><strong>Six-movement reading</strong><small>A path from overture to integration.</small></span></div>
          </div>
          <blockquote>Take a breath. Enter what’s true.<br />StarGlass will do the rest.</blockquote>
        </div>
      </section>
    </main>
  );
}
