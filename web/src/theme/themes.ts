/**
 * StarGlass — register library, v1 (final field).
 *
 * Eleven registers. Eight are user-pickable in the studio; three attach to an
 * artifact or a reading mode instead of taste (see BOUND_REGISTERS). Three
 * shipping registers were retired — see RETIRED.
 *
 * A register is DATA, not a stylesheet. Every color token and every type token
 * lives here, and `registerStyleSheet()` compiles the whole field into one CSS
 * text blob keyed by [data-theme="<id>"]. Two consequences worth knowing:
 *
 *   1. styles.css no longer carries per-theme blocks. Adding a register is a
 *      data edit; nothing downstream has to be told.
 *   2. The selector is an attribute, not `html`. Any element can wear a
 *      register — which is how the bound three work: the report wraps itself
 *      in Impression, the share card in Emissary, a sidereal reading in
 *      Sidereal, all without disturbing the register the user picked.
 *
 * One deviation from the authored palette, recorded rather than buried:
 * --atlas-text-5 in Observatory, Manuscript, Atelier, Blue Hour, Phosphor and
 * Emissary sat between 2.33:1 and 2.96:1 against its own panel, and that tier
 * carries provenance stamps and hints at 9–11px. Each was moved the minimum
 * distance toward that register's OWN primary ink to reach 3:1 — hue held,
 * value lifted. Plate is the reference the field measures against and it
 * clears AAA; test-registers.mjs now holds every register to the floor.
 */

export interface StarGlassTheme {
  id: string;
  label: string;
  note: string;
  tokens: Record<string, string>;
  wheel: {
    ink: string;
    paper: string;
    faint: string;
    mid: string;
    element: Record<"fire" | "earth" | "air" | "water", string>;
    aspect: Record<string, string>;
    theme_palette: string[];
  };
}

export interface RegisterPairing {
  id: string;
  label: string;
  note: string;
  display: string;
  body: string;
  mono: string;
}

const aspect = (conjunction: string, dynamic: string, flowing: string, mid: string) => ({
  conjunction,
  opposition: dynamic,
  square: dynamic,
  trine: flowing,
  sextile: flowing,
  quincunx: mid,
});

/* ────────────────────────────── registers ────────────────────────────── */

export const REGISTERS: StarGlassTheme[] = [
  {
    id: "observatory",
    label: "Luminous Observatory",
    note: "Daylight in a domed room — high-rag paper, cold sky blue, one brass fitting.",
    tokens: {
      "--atlas-bg": "#fbfaf7",
      "--atlas-panel": "#fffdfa",
      "--atlas-surface": "#f1eee7",
      "--atlas-border": "#d9e2e8",
      "--atlas-text-1": "#1b2434",
      "--atlas-text-2": "#2a3446",
      "--atlas-text-3": "#4a5468",
      "--atlas-text-4": "#6c7686",
      "--atlas-text-5": "#8a94a1",
      "--atlas-accent": "#2e5a7a",
      "--atlas-accent-soft": "rgba(46,90,122,.10)",
      "--atlas-positive": "#4f6f52",
      "--atlas-warning": "#b26b3a",
      "--atlas-info": "#5688b6",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1.2",
    },
    wheel: {
      ink: "#1b2434", paper: "#fbfaf7", faint: "#d9e2e8", mid: "#6c7686",
      element: { fire: "#b26b3a", earth: "#6d7b49", air: "#5688b6", water: "#3e6e9c" },
      aspect: aspect("#c6a15b", "#b26b3a", "#2e5a7a", "#6c7686"),
      theme_palette: ["#2e5a7a", "#b26b3a", "#6d7b49", "#7b6590", "#5688b6", "#c6a15b"],
    },
  },
  {
    id: "manuscript",
    label: "Warm Celestial Manuscript",
    note: "Lamplight and rag paper — a reading that arrives as correspondence.",
    tokens: {
      "--atlas-bg": "#f6efe3",
      "--atlas-panel": "#fbf6ec",
      "--atlas-surface": "#eadfcb",
      "--atlas-border": "#ddcfb6",
      "--atlas-text-1": "#2a1e17",
      "--atlas-text-2": "#3a2a20",
      "--atlas-text-3": "#6b5540",
      "--atlas-text-4": "#8a7458",
      "--atlas-text-5": "#a08c71",
      "--atlas-accent": "#7c2f26",
      "--atlas-accent-soft": "rgba(124,47,38,.10)",
      "--atlas-positive": "#3e5147",
      "--atlas-warning": "#a97a2f",
      "--atlas-info": "#6f7e86",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1.35",
    },
    wheel: {
      ink: "#2a1e17", paper: "#f6efe3", faint: "#ddcfb6", mid: "#8a7458",
      element: { fire: "#9c4a2a", earth: "#6b6238", air: "#6f7e86", water: "#3e5147" },
      aspect: aspect("#a97a2f", "#7c2f26", "#3e5147", "#8a7458"),
      theme_palette: ["#7c2f26", "#a97a2f", "#3e5147", "#6f7e86", "#9c4a2a", "#5b4a6e"],
    },
  },
  {
    id: "atelier",
    label: "Modern Astronomical Atelier",
    note: "A studio, not a shrine — limewashed cool greys and one copper object.",
    tokens: {
      "--atlas-bg": "#f4f5f3",
      "--atlas-panel": "#fbfcfa",
      "--atlas-surface": "#e3e5e1",
      "--atlas-border": "#d5d8d3",
      "--atlas-text-1": "#14171a",
      "--atlas-text-2": "#23272b",
      "--atlas-text-3": "#5b6167",
      "--atlas-text-4": "#7c838a",
      "--atlas-text-5": "#8d9398",
      "--atlas-accent": "#0f2e2a",
      "--atlas-accent-soft": "rgba(15,46,42,.09)",
      "--atlas-positive": "#6e8a72",
      "--atlas-warning": "#b4744c",
      "--atlas-info": "#4f7f7a",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1",
    },
    wheel: {
      ink: "#14171a", paper: "#f4f5f3", faint: "#d5d8d3", mid: "#7c838a",
      element: { fire: "#b4744c", earth: "#7e8c6a", air: "#6d8e96", water: "#4f7f7a" },
      aspect: aspect("#b4744c", "#a2543a", "#0f2e2a", "#8c9a8e"),
      theme_palette: ["#0f2e2a", "#b4744c", "#7e8c6a", "#6d8e96", "#8c9a8e", "#a2543a"],
    },
  },
  {
    id: "bluehour",
    label: "Blue Hour",
    note: "The hour you can see both the sky and the page — mid-value ground, one low amber, a written hand on the headings.",
    tokens: {
      "--atlas-bg": "#3f4a5c",
      "--atlas-panel": "#48546a",
      "--atlas-surface": "#37414f",
      "--atlas-border": "#5b6880",
      "--atlas-text-1": "#f4eee5",
      "--atlas-text-2": "#e6dfd4",
      "--atlas-text-3": "#cdc6bc",
      "--atlas-text-4": "#b0aaa4",
      "--atlas-text-5": "#a7a29d",
      "--atlas-accent": "#d9a26b",
      "--atlas-accent-soft": "rgba(217,162,107,.16)",
      "--atlas-positive": "#9fb79a",
      "--atlas-warning": "#e08e6f",
      "--atlas-info": "#a8bdd2",
      "--atlas-blend": "screen",
      "--atlas-tempo": "1.1",
    },
    wheel: {
      ink: "#f4eee5", paper: "#37414f", faint: "#5b6880", mid: "#b0aaa4",
      element: { fire: "#d9a26b", earth: "#9fb79a", air: "#a8bdd2", water: "#8f9fc4" },
      aspect: aspect("#d9a26b", "#e08e6f", "#a8bdd2", "#b0aaa4"),
      theme_palette: ["#d9a26b", "#a8bdd2", "#9fb79a", "#e08e6f", "#8f9fc4", "#c7a9c0"],
    },
  },
  {
    id: "nocturne",
    label: "Nocturne Meridian",
    note: "Night without the occult — blue-black air, violet light used once.",
    tokens: {
      "--atlas-bg": "#0b1020",
      "--atlas-panel": "#141b32",
      "--atlas-surface": "#10162a",
      "--atlas-border": "#232a44",
      "--atlas-text-1": "#e8e6f0",
      "--atlas-text-2": "#dad8e6",
      "--atlas-text-3": "#b4b7cc",
      "--atlas-text-4": "#9aa0bd",
      "--atlas-text-5": "#6e7495",
      "--atlas-accent": "#b9a7d6",
      "--atlas-accent-soft": "rgba(185,167,214,.14)",
      "--atlas-positive": "#7fa6b8",
      "--atlas-warning": "#d8b26a",
      "--atlas-info": "#8fb8c9",
      "--atlas-blend": "screen",
      "--atlas-tempo": ".95",
    },
    wheel: {
      ink: "#e8e6f0", paper: "#0b1020", faint: "#232a44", mid: "#9aa0bd",
      element: { fire: "#d8b26a", earth: "#8fa382", air: "#7fa6b8", water: "#8a93d4" },
      aspect: aspect("#d8b26a", "#c97f8a", "#7fa6b8", "#9aa0bd"),
      theme_palette: ["#b9a7d6", "#7fa6b8", "#d8b26a", "#c97f8a", "#8a93d4", "#8fa382"],
    },
  },
  {
    id: "glassgraphite",
    label: "Glass & Graphite",
    note: "Ground glass and cold metal, warmed from inside — the instrument body.",
    tokens: {
      "--atlas-bg": "#101617",
      "--atlas-panel": "#1a2325",
      "--atlas-surface": "#151d1f",
      "--atlas-border": "#253133",
      "--atlas-text-1": "#edeae4",
      "--atlas-text-2": "#dcd8d0",
      "--atlas-text-3": "#b0b8b7",
      "--atlas-text-4": "#93a0a0",
      "--atlas-text-5": "#6e7b7b",
      "--atlas-accent": "#7fbfb3",
      "--atlas-accent-soft": "rgba(127,191,179,.14)",
      "--atlas-positive": "#9dbe8a",
      "--atlas-warning": "#c9765a",
      "--atlas-info": "#6fa8b8",
      "--atlas-blend": "screen",
      "--atlas-tempo": ".9",
    },
    wheel: {
      ink: "#edeae4", paper: "#101617", faint: "#253133", mid: "#93a0a0",
      element: { fire: "#c9765a", earth: "#9dbe8a", air: "#6fa8b8", water: "#5e93a8" },
      aspect: aspect("#c9a45a", "#c9765a", "#7fbfb3", "#93a0a0"),
      theme_palette: ["#7fbfb3", "#c9765a", "#9dbe8a", "#6fa8b8", "#c9a45a", "#9b8fb5"],
    },
  },
  {
    id: "plate",
    label: "Plate",
    note: "A photographic plate — white stock, dense black, two saturated inks. Nothing recedes.",
    tokens: {
      "--atlas-bg": "#ffffff",
      "--atlas-panel": "#ffffff",
      "--atlas-surface": "#f2f2f4",
      "--atlas-border": "#6b6f76",
      "--atlas-text-1": "#101014",
      "--atlas-text-2": "#1c1f26",
      "--atlas-text-3": "#33383f",
      "--atlas-text-4": "#4a5058",
      "--atlas-text-5": "#5d646d",
      "--atlas-accent": "#1c3f8f",
      "--atlas-accent-soft": "rgba(28,63,143,.08)",
      "--atlas-positive": "#1f5c3a",
      "--atlas-warning": "#8a4b12",
      "--atlas-info": "#0f5f6e",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1",
    },
    wheel: {
      ink: "#101014", paper: "#ffffff", faint: "#9aa0a8", mid: "#4a5058",
      element: { fire: "#8a4b12", earth: "#1f5c3a", air: "#1c3f8f", water: "#0f5f6e" },
      aspect: aspect("#7a3b8f", "#8a4b12", "#1c3f8f", "#4a5058"),
      theme_palette: ["#1c3f8f", "#8a4b12", "#1f5c3a", "#7a3b8f", "#0f5f6e", "#101014"],
    },
  },
  {
    id: "phosphor",
    label: "Phosphor",
    note: "Green-on-black observatory terminal — fast, focused, nocturnal. A working mode, not a brand voice.",
    tokens: {
      "--atlas-bg": "#05080a",
      "--atlas-panel": "#0b1310",
      "--atlas-surface": "#080e0b",
      "--atlas-border": "#17301f",
      "--atlas-text-1": "#d7ffe6",
      "--atlas-text-2": "#b7f5cd",
      "--atlas-text-3": "#86c79c",
      "--atlas-text-4": "#5a8f6c",
      "--atlas-text-5": "#446951",
      "--atlas-accent": "#38e08a",
      "--atlas-accent-soft": "rgba(56,224,138,.14)",
      "--atlas-positive": "#9be34a",
      "--atlas-warning": "#e0b23a",
      "--atlas-info": "#5ed7b0",
      "--atlas-blend": "screen",
      "--atlas-tempo": ".85",
    },
    wheel: {
      ink: "#d7ffe6", paper: "#080e0b", faint: "#17301f", mid: "#5a8f6c",
      element: { fire: "#e0b23a", earth: "#9be34a", air: "#5ed7b0", water: "#5ea6a0" },
      aspect: aspect("#9be34a", "#e0b23a", "#38e08a", "#5a8f6c"),
      theme_palette: ["#38e08a", "#e0b23a", "#9be34a", "#70aa73", "#5ed7b0", "#d4cf62"],
    },
  },

  /* ── bound registers: not user-pickable, see BOUND_REGISTERS ── */
  {
    id: "sidereal",
    label: "Sidereal",
    note: "Malachite ground, vermilion and marigold — the register that tells you which sky you are reading.",
    tokens: {
      "--atlas-bg": "#10251f",
      "--atlas-panel": "#16332a",
      "--atlas-surface": "#132a23",
      "--atlas-border": "#244a3c",
      "--atlas-text-1": "#f1ece0",
      "--atlas-text-2": "#e2dbca",
      "--atlas-text-3": "#c2c4b2",
      "--atlas-text-4": "#96a496",
      "--atlas-text-5": "#6f8378",
      "--atlas-accent": "#d8502f",
      "--atlas-accent-soft": "rgba(216,80,47,.15)",
      "--atlas-positive": "#9fc07a",
      "--atlas-warning": "#e4a93c",
      "--atlas-info": "#6fa89a",
      "--atlas-blend": "screen",
      "--atlas-tempo": "1.25",
    },
    wheel: {
      ink: "#f1ece0", paper: "#10251f", faint: "#244a3c", mid: "#96a496",
      // agni / prithvi / vayu / jala — same four slots, the tradition's own terms
      element: { fire: "#c9412a", earth: "#b08a3c", air: "#9dbdc4", water: "#4f86a8" },
      aspect: aspect("#e4a93c", "#c9412a", "#6fa89a", "#96a496"),
      theme_palette: ["#d8502f", "#e4a93c", "#6fa89a", "#4f86a8", "#9fc07a", "#b47fa8"],
    },
  },
  {
    id: "impression",
    label: "Impression",
    note: "Ink on paper — Observatory's print sibling. True white stock, rules instead of panels.",
    tokens: {
      "--atlas-bg": "#ffffff",
      "--atlas-panel": "#ffffff",
      "--atlas-surface": "#f7f4ec",
      "--atlas-border": "#cfc7b6",
      "--atlas-text-1": "#23201b",
      "--atlas-text-2": "#34302a",
      "--atlas-text-3": "#5a544a",
      "--atlas-text-4": "#7d7568",
      "--atlas-text-5": "#9a9284",
      "--atlas-accent": "#2b4f6b",
      "--atlas-accent-soft": "rgba(43,79,107,.07)",
      "--atlas-positive": "#4a5f3f",
      "--atlas-warning": "#8a5a2a",
      "--atlas-info": "#3b5e6b",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1",
    },
    wheel: {
      ink: "#23201b", paper: "#ffffff", faint: "#cfc7b6", mid: "#7d7568",
      element: { fire: "#8a5a2a", earth: "#4a5f3f", air: "#2b4f6b", water: "#3b5e6b" },
      aspect: aspect("#8a5a2a", "#8a3a2a", "#2b4f6b", "#7d7568"),
      theme_palette: ["#2b4f6b", "#8a5a2a", "#4a5f3f", "#6b4a6b", "#3b5e6b", "#23201b"],
    },
  },
  {
    id: "emissary",
    label: "Emissary",
    note: "Share-card export only — deeper and cooler than Nocturne so the card reads as an object.",
    tokens: {
      "--atlas-bg": "#171226",
      "--atlas-panel": "#221a35",
      "--atlas-surface": "#1d1730",
      "--atlas-border": "#352a4e",
      "--atlas-text-1": "#f2ece2",
      "--atlas-text-2": "#ddd5c9",
      "--atlas-text-3": "#b6aec4",
      "--atlas-text-4": "#8c85a0",
      "--atlas-text-5": "#6b6581",
      "--atlas-accent": "#cf9b52",
      "--atlas-accent-soft": "rgba(207,155,82,.16)",
      "--atlas-positive": "#8fb8a8",
      "--atlas-warning": "#cf7a52",
      "--atlas-info": "#a892c9",
      "--atlas-blend": "screen",
      "--atlas-tempo": ".8",
    },
    wheel: {
      ink: "#f2ece2", paper: "#171226", faint: "#352a4e", mid: "#8c85a0",
      element: { fire: "#cf7a52", earth: "#9aa87e", air: "#a892c9", water: "#7f9bc4" },
      aspect: aspect("#cf9b52", "#cf7a52", "#a892c9", "#8c85a0"),
      theme_palette: ["#cf9b52", "#a892c9", "#8fb8a8", "#cf7a52", "#7f9bc4", "#e0d5c2"],
    },
  },
];

/* ─────────────────────────────── pairings ─────────────────────────────── */

export const PAIRINGS: RegisterPairing[] = [
  {
    id: "meridian",
    label: "Meridian",
    note: "Didone display authorship over a screen-tuned literary reading face.",
    display: '"Bodoni Moda", "Bodoni 72", Didot, Georgia, serif',
    body: '"Newsreader", "Iowan Old Style", Palatino, Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "scriptorium",
    label: "Scriptorium",
    note: "A humanist italic hand for display; low-contrast serif for long passages.",
    display: '"EB Garamond", "Iowan Old Style", Palatino, serif',
    body: '"Spectral", "Iowan Old Style", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "atelier",
    label: "Atelier",
    note: "Tight contemporary serif display, screen-engineered body, measured labels.",
    display: '"Instrument Serif", "Iowan Old Style", Georgia, serif',
    body: '"Literata", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "bluehour",
    label: "Blue Hour",
    note: "A written hand on the headings over a screen-tuned reading serif; the hand has a 40px floor.",
    display: '"Gwendolyn", "Pinyon Script", cursive',
    body: '"Newsreader", "Iowan Old Style", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "nocturne",
    label: "Nocturne",
    note: "Inscriptional display with an airy old-style body for late reading.",
    display: '"Marcellus", "Trajan Pro", Palatino, serif',
    body: '"Crimson Pro", "Iowan Old Style", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "groundglass",
    label: "Ground Glass",
    note: "Blunt, slightly archaic display; sober workhorse serif and grotesque labels.",
    display: '"Young Serif", "Iowan Old Style", Georgia, serif',
    body: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "plate",
    label: "Plate",
    note: "One sturdy serif at two weights; sans only for metadata, never below 13px.",
    display: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
    body: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "drafting",
    label: "Drafting Table",
    note: "Mono display and measured sans body — the terminal voice, carried over unchanged.",
    display: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
    body: '"IBM Plex Sans", "Avenir Next", system-ui, sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
  },
  {
    id: "sidereal",
    label: "Sidereal",
    note: "An Indic-rooted display face with a wide-coverage book serif for transliterated terms.",
    display: '"Eczar", "Gentium Book Plus", Georgia, serif',
    body: '"Gentium Book Plus", "Gentium Book Basic", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "impression",
    label: "Impression",
    note: "Observatory's voice at print sizes: 11pt body, 8.5pt small-caps metadata.",
    display: '"Bodoni Moda", Didot, Georgia, serif',
    body: '"Newsreader", "Iowan Old Style", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "emissary",
    label: "Emissary",
    note: "Display italic only — the card has no paragraphs, so there is no body face.",
    display: '"Bodoni Moda", Didot, Georgia, serif',
    body: '"Jost", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
];

/** Which pairing a register wears when the studio is set to "follow register". */
export const REGISTER_PAIRING: Record<string, string> = {
  observatory: "meridian",
  manuscript: "scriptorium",
  atelier: "atelier",
  bluehour: "bluehour",
  nocturne: "nocturne",
  glassgraphite: "groundglass",
  plate: "plate",
  phosphor: "drafting",
  sidereal: "sidereal",
  impression: "impression",
  emissary: "emissary",
};

/* ────────────────────────────── font tokens ───────────────────────────── */
/**
 * Every type property the app reads per register. --font-label is the
 * "engraved coordinates" face: always small, tracked, never used for reading
 * text. --font-display-sm / --font-display-min exist only where the display
 * face cannot hold at small sizes (bluehour's script).
 */
export const FONT_TOKENS: Record<string, Record<string, string>> = {
  observatory: {
    "--font-display": '"Bodoni Moda", Didot, Georgia, serif',
    "--font-body": '"Newsreader", "Iowan Old Style", Georgia, serif',
    "--font-label": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"IBM Plex Mono", ui-monospace, monospace',
    "--label-size": "10.5px",
    "--label-weight": "500",
    "--label-style": "normal",
    "--label-tracking": "0.18em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "normal",
    "--action-tracking": "0.18em",
    "--shadow-soft": "0 14px 40px rgba(27,36,52,.08)",
  },
  manuscript: {
    "--font-display": '"EB Garamond", Palatino, serif',
    "--font-body": '"Spectral", Georgia, serif',
    "--font-label": '"Spectral", Georgia, serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"EB Garamond", Palatino, serif',
    "--label-size": "12px",
    "--label-weight": "400",
    "--label-style": "normal",
    "--label-tracking": "0.2em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "italic",
    "--action-tracking": "0.14em",
    "--shadow-soft": "0 14px 40px rgba(42,30,23,.10)",
  },
  atelier: {
    "--font-display": '"Instrument Serif", Georgia, serif',
    "--font-body": '"Literata", Georgia, serif',
    "--font-label": '"Archivo", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"Archivo", system-ui, sans-serif',
    "--label-size": "10.5px",
    "--label-weight": "500",
    "--label-style": "normal",
    "--label-tracking": "0.16em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "normal",
    "--action-tracking": "0.16em",
    "--shadow-soft": "0 14px 40px rgba(20,23,26,.07)",
  },
  bluehour: {
    // The script is display-only and has a size floor: anything rendering
    // below --font-display-min (movement nav, chart identity, small headings)
    // must use --font-display-sm, or the hand becomes illegible.
    "--font-display": '"Gwendolyn", "Pinyon Script", cursive',
    "--font-display-sm": '"Newsreader", Georgia, serif',
    "--font-display-min": "40px",
    "--font-body": '"Newsreader", Georgia, serif',
    "--font-label": '"Jost", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"Jost", system-ui, sans-serif',
    "--label-size": "11px",
    "--label-weight": "400",
    "--label-style": "normal",
    "--label-tracking": "0.2em",
    "--label-transform": "uppercase",
    "--action-weight": "400",
    "--action-style": "normal",
    "--action-tracking": "0.16em",
    "--shadow-soft": "0 18px 48px rgba(20,26,36,.24)",
  },
  nocturne: {
    "--font-display": '"Marcellus", Palatino, serif',
    "--font-body": '"Crimson Pro", Georgia, serif',
    "--font-label": '"Jost", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"Jost", system-ui, sans-serif',
    "--label-size": "11.5px",
    "--label-weight": "400",
    "--label-style": "normal",
    "--label-tracking": "0.2em",
    "--label-transform": "uppercase",
    "--action-weight": "400",
    "--action-style": "normal",
    "--action-tracking": "0.2em",
    "--shadow-soft": "0 18px 48px rgba(0,0,0,.28)",
  },
  glassgraphite: {
    "--font-display": '"Young Serif", Georgia, serif',
    "--font-body": '"Source Serif 4", Georgia, serif',
    "--font-label": '"IBM Plex Sans", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"IBM Plex Sans", system-ui, sans-serif',
    "--label-size": "11px",
    "--label-weight": "500",
    "--label-style": "normal",
    "--label-tracking": "0.16em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "normal",
    "--action-tracking": "0.16em",
    "--shadow-soft": "0 18px 48px rgba(0,0,0,.3)",
  },
  plate: {
    "--font-display": '"Source Serif 4", Georgia, serif',
    "--font-body": '"Source Serif 4", Georgia, serif',
    "--font-label": '"IBM Plex Sans", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"IBM Plex Sans", system-ui, sans-serif',
    "--label-size": "13px",
    "--label-weight": "600",
    "--label-style": "normal",
    "--label-tracking": "0.12em",
    "--label-transform": "uppercase",
    "--action-weight": "600",
    "--action-style": "normal",
    "--action-tracking": "0.06em",
    "--shadow-soft": "none",
  },
  phosphor: {
    "--font-display": '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
    "--font-body": '"IBM Plex Sans", "Avenir Next", system-ui, sans-serif',
    "--font-label": '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
    "--font-mono": '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
    "--font-action": '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
    "--label-size": "10.5px",
    "--label-weight": "400",
    "--label-style": "normal",
    "--label-tracking": "0.095em",
    "--label-transform": "uppercase",
    "--action-weight": "400",
    "--action-style": "normal",
    "--action-tracking": "0.02em",
    "--shadow-soft": "0 18px 48px rgba(0,0,0,.32)",
  },
  sidereal: {
    "--font-display": '"Eczar", Georgia, serif',
    "--font-body": '"Gentium Book Plus", Georgia, serif',
    "--font-label": '"IBM Plex Sans", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"IBM Plex Sans", system-ui, sans-serif',
    "--label-size": "11px",
    "--label-weight": "500",
    "--label-style": "normal",
    "--label-tracking": "0.16em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "normal",
    "--action-tracking": "0.14em",
    "--shadow-soft": "0 18px 48px rgba(0,0,0,.3)",
  },
  impression: {
    "--font-display": '"Bodoni Moda", Didot, Georgia, serif',
    "--font-body": '"Newsreader", Georgia, serif',
    "--font-label": '"Newsreader", Georgia, serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"Newsreader", Georgia, serif',
    "--label-size": "8.5pt",
    "--label-weight": "500",
    "--label-style": "normal",
    "--label-tracking": "0.18em",
    "--label-transform": "uppercase",
    "--action-weight": "500",
    "--action-style": "normal",
    "--action-tracking": "0.18em",
    "--shadow-soft": "none",
  },
  emissary: {
    "--font-display": '"Bodoni Moda", Didot, Georgia, serif',
    "--font-body": '"Jost", system-ui, sans-serif',
    "--font-label": '"Jost", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", ui-monospace, monospace',
    "--font-action": '"Jost", system-ui, sans-serif',
    "--label-size": "10px",
    "--label-weight": "400",
    "--label-style": "normal",
    "--label-tracking": "0.28em",
    "--label-transform": "uppercase",
    "--action-weight": "400",
    "--action-style": "normal",
    "--action-tracking": "0.28em",
    "--shadow-soft": "none",
  },
};

/* ──────────────────────────── bindings & roles ────────────────────────── */

export type BindingKind = "print" | "share" | "zodiac";

/**
 * Registers that are NOT user-pickable — they attach to an artifact or a
 * reading mode instead of to taste.
 */
export const BOUND_REGISTERS: Record<string, BindingKind> = {
  impression: "print",
  emissary: "share",
  sidereal: "zodiac",
};

/** One role each — the test a new register has to pass to join the field. */
export const REGISTER_ROLES: Record<string, string> = {
  observatory: "The light default — first run, daytime reading, anything shared as paper.",
  manuscript: "The intimate one — long-form portrait and gifted readings.",
  atelier: "The credible one — skeptics, apparatus, tables.",
  bluehour: "The comfortable middle — evening reading at length.",
  nocturne: "The atmospheric one — late, one passage at a time.",
  glassgraphite: "The dark default — the same product after dark.",
  plate: "The accessibility reference — and the audit the others are measured against.",
  phosphor: "The instrument mode — deliberately off-brand, for chart data.",
  sidereal: "The lens — applies with a sidereal or Vedic reading.",
  impression: "The printed artifact.",
  emissary: "The travelling artifact.",
};

/** Registers the studio offers, in order. */
export const PICKABLE_REGISTERS = REGISTERS.filter((register) => !(register.id in BOUND_REGISTERS));
export const PICKABLE_REGISTER_IDS = PICKABLE_REGISTERS.map((register) => register.id);
export const BOUND_REGISTER_LIST = REGISTERS.filter((register) => register.id in BOUND_REGISTERS);

/**
 * Retired from the shipping set. paperlab's hexes survive as print stock —
 * the report view was hard-coded to them, and Impression replaces that.
 */
export const RETIRED: { id: string; label: string; supersededBy: string; because: string }[] = [
  {
    id: "paperlab",
    label: "Paper Lab",
    supersededBy: "observatory",
    because: "Same room; Observatory has display authorship and a reading serif for body.",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    supersededBy: "atelier",
    because: "Precision from saturation rather than proportion; accent and info were near-duplicates, and it duplicated Phosphor's role.",
  },
  {
    id: "refined",
    label: "Refined Instrument",
    supersededBy: "glassgraphite",
    because: "Accent and info were one hue at two lightnesses, and gold did duty as positive.",
  },
];

export const DEFAULT_REGISTER_ID = "observatory";
export const DEFAULT_DARK_REGISTER_ID = "glassgraphite";

/** Registers whose ground is dark — drives `color-scheme` and the dark default. */
export const DARK_REGISTER_IDS = [
  "bluehour", "nocturne", "glassgraphite", "phosphor", "sidereal", "emissary",
];

/* ────────────────────────────── resolution ────────────────────────────── */

const BY_ID = new Map(REGISTERS.map((register) => [register.id, register]));
const SUPERSEDED = new Map(RETIRED.map((entry) => [entry.id, entry.supersededBy]));

/**
 * Turn any stored or passed id into a live register id. A "paperlab" saved
 * before the field was finalized lands on Observatory rather than nothing.
 */
export function resolveRegisterId(id: string | null | undefined): string {
  if (!id) return DEFAULT_REGISTER_ID;
  if (BY_ID.has(id)) return id;
  const superseded = SUPERSEDED.get(id);
  if (superseded && BY_ID.has(superseded)) return superseded;
  return DEFAULT_REGISTER_ID;
}

export function getRegister(id: string | null | undefined): StarGlassTheme {
  return BY_ID.get(resolveRegisterId(id)) ?? REGISTERS[0];
}

export function pairingForRegister(id: string): RegisterPairing {
  const pairingId = REGISTER_PAIRING[resolveRegisterId(id)];
  return PAIRINGS.find((pairing) => pairing.id === pairingId) ?? PAIRINGS[0];
}

/* ───────────────────────── register stylesheet ────────────────────────── */

/**
 * Compile the field into CSS. One rule per register, selected by attribute so
 * a register can be worn by `html` (the user's pick) or by any container (a
 * bound register on the report, the share card, a sidereal reading).
 */
/**
 * Two selectors per register, and the pair matters.
 *
 * `:root[data-theme=x]` (0,2,0) is what beats the pre-paint defaults in
 * styles.css. A bare `[data-theme=x]` ties `:root` at (0,1,0) and then loses
 * on source order — which is exactly what happened: every register rendered as
 * Observatory while `color-scheme` (an element selector, so no tie) correctly
 * flipped to dark. The symptom looked like the sheet wasn't loading. It was.
 *
 * `[data-theme=x]` on its own is still needed for containers — the report
 * shell, the share card — where the only competition is inherited values,
 * which a matching rule always outranks.
 */
const selector = (id: string) => `:root[data-theme="${id}"], [data-theme="${id}"]`;

export function registerStyleSheet(): string {
  const blocks = REGISTERS.map((register) => {
    const type = FONT_TOKENS[register.id] ?? {};
    /**
     * Every register declares its OWN small-display face and floor, even when
     * they are just the display face and zero. A bound register worn by a
     * container would otherwise inherit --font-display-sm from <html> and
     * quietly print the outer register's face.
     */
    const floor: Record<string, string> = {
      "--font-display-sm": type["--font-display-sm"] ?? type["--font-display"] ?? "inherit",
      "--font-display-min": type["--font-display-min"] ?? "0px",
    };
    const declarations = [
      ...Object.entries(register.tokens),
      ...Object.entries({ ...type, ...floor }),
    ]
      .map(([property, value]) => `  ${property}: ${value};`)
      .join("\n");
    return `${selector(register.id)} {\n${declarations}\n}`;
  });

  const dark = DARK_REGISTER_IDS.map(selector).join(", ");
  const light = REGISTERS.filter((register) => !DARK_REGISTER_IDS.includes(register.id))
    .map((register) => selector(register.id))
    .join(", ");

  return [
    "/* generated from web/src/theme/themes.ts — do not hand-edit */",
    ...blocks,
    `${dark} { color-scheme: dark; }`,
    `${light} { color-scheme: light; }`,
  ].join("\n\n");
}

const SHEET_ID = "starglass-registers";

/**
 * Inject the compiled field once. Placement is deliberately not load-bearing —
 * `selector()` wins on specificity — because import order differs between the
 * dev server and a production build, and a rule that depends on which happens
 * first is a rule that works on your machine.
 */
export function installRegisterStyles(doc: Document = document): void {
  if (doc.getElementById(SHEET_ID)) return;
  const style = doc.createElement("style");
  style.id = SHEET_ID;
  style.textContent = registerStyleSheet();
  doc.head.appendChild(style);
}
