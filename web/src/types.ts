import type { BirthPayload, ChartResponse } from "./api";

export interface BirthFormState {
  month: string;
  day: string;
  year: string;
  hour: string;
  minute: string;
  period: "AM" | "PM" | null;
  placeLabel: string;
  lat: number;
  lon: number;
  tz: string;
  essence: "venus" | "mars" | null;
  zodiac: "tropical" | "sidereal" | "dual";
  houses: string;
  orbs: "tight" | "standard" | "wide";
  quincunx: boolean;
  minorAspects: boolean;
  vedic: boolean;
}

export interface CastMeta {
  dateLabel: string;
  timeLabel: string;
  placeLabel: string;
  zodiacLabel: string;
  houseLabel: string;
  birth: BirthPayload;
  essence: "venus" | "mars" | null;
}

export interface CastResult {
  chart: ChartResponse;
  meta: CastMeta;
}

export interface ReadingMovement {
  nav: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  quote: string;
  invitation: string;
}

export interface GeneratedReading {
  title: string;
  framing: string;
  movements: ReadingMovement[];
}
