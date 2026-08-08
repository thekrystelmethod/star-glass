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

const aspect = (conjunction: string, dynamic: string, flowing: string, mid: string) => ({
  conjunction,
  opposition: dynamic,
  square: dynamic,
  trine: flowing,
  sextile: flowing,
  quincunx: mid,
});

export const THEMES: StarGlassTheme[] = [
  {
    id: "paperlab",
    label: "Paper Lab",
    note: "Warm paper and precise ink — contemplative, literary, print-friendly.",
    tokens: {
      "--atlas-bg": "#f4f1ea",
      "--atlas-panel": "#fbf9f4",
      "--atlas-surface": "#efece3",
      "--atlas-border": "#d9d3c6",
      "--atlas-text-1": "#18263a",
      "--atlas-text-2": "#2c3947",
      "--atlas-text-3": "#536171",
      "--atlas-text-4": "#728090",
      "--atlas-text-5": "#9aa3ad",
      "--atlas-accent": "#2f6fab",
      "--atlas-accent-soft": "rgba(47,111,171,.11)",
      "--atlas-positive": "#6d7b49",
      "--atlas-warning": "#b95d37",
      "--atlas-info": "#5688b6",
      "--atlas-blend": "multiply",
      "--atlas-tempo": "1.2",
    },
    wheel: {
      ink: "#18263a", paper: "#fbf9f4", faint: "#d9d3c6", mid: "#728090",
      element: { fire: "#b95d37", earth: "#6d7b49", air: "#5688b6", water: "#4c6f9e" },
      aspect: aspect("#a77b31", "#b95d37", "#5688b6", "#728090"),
      theme_palette: ["#2f6fab", "#b95d37", "#6d7b49", "#7b6590", "#5688b6", "#a77b31"],
    },
  },
  {
    id: "blueprint",
    label: "Blueprint",
    note: "Celestial drafting table — technical, cool, exacting.",
    tokens: {
      "--atlas-bg": "#061322",
      "--atlas-panel": "#0a1b2e",
      "--atlas-surface": "#0c2035",
      "--atlas-border": "#1b3b55",
      "--atlas-text-1": "#e7f3ff",
      "--atlas-text-2": "#c9dff1",
      "--atlas-text-3": "#9ebbd1",
      "--atlas-text-4": "#6e8ea8",
      "--atlas-text-5": "#46657e",
      "--atlas-accent": "#36b8ff",
      "--atlas-accent-soft": "rgba(54,184,255,.13)",
      "--atlas-positive": "#5dd0b4",
      "--atlas-warning": "#e1a047",
      "--atlas-info": "#62d8f2",
      "--atlas-blend": "screen",
      "--atlas-tempo": "1",
    },
    wheel: {
      ink: "#e7f3ff", paper: "#08182a", faint: "#1b3b55", mid: "#6e8ea8",
      element: { fire: "#e88d55", earth: "#99b56e", air: "#62d8f2", water: "#5b8fd8" },
      aspect: aspect("#e1a047", "#e16d58", "#36b8ff", "#6e8ea8"),
      theme_palette: ["#36b8ff", "#e16d58", "#5dd0b4", "#9b7bd0", "#62d8f2", "#e1a047"],
    },
  },
  {
    id: "refined",
    label: "Refined Instrument",
    note: "Calm slate and warm gold — editorial, scientific, credible.",
    tokens: {
      "--atlas-bg": "#0e1116", "--atlas-panel": "#161a21", "--atlas-surface": "#12151b",
      "--atlas-border": "#272d38", "--atlas-text-1": "#e8eaf0", "--atlas-text-2": "#d2d6df",
      "--atlas-text-3": "#a6acba", "--atlas-text-4": "#7c8392", "--atlas-text-5": "#565d6b",
      "--atlas-accent": "#8fa1c2", "--atlas-accent-soft": "rgba(143,161,194,.14)",
      "--atlas-positive": "#cda24a", "--atlas-warning": "#c47f45", "--atlas-info": "#7f96c4",
      "--atlas-blend": "screen", "--atlas-tempo": "1",
    },
    wheel: {
      ink: "#e8eaf0", paper: "#12151b", faint: "#272d38", mid: "#7c8392",
      element: { fire: "#c47f45", earth: "#94a66f", air: "#7f96c4", water: "#7892c9" },
      aspect: aspect("#cda24a", "#c47f45", "#7f96c4", "#7c8392"),
      theme_palette: ["#8fa1c2", "#c47f45", "#94a66f", "#8d729e", "#7f96c4", "#cda24a"],
    },
  },
  {
    id: "phosphor",
    label: "Phosphor",
    note: "Green-on-black observatory terminal — fast, focused, nocturnal.",
    tokens: {
      "--atlas-bg": "#05080a", "--atlas-panel": "#0b1310", "--atlas-surface": "#080e0b",
      "--atlas-border": "#17301f", "--atlas-text-1": "#d7ffe6", "--atlas-text-2": "#b7f5cd",
      "--atlas-text-3": "#86c79c", "--atlas-text-4": "#5a8f6c", "--atlas-text-5": "#3c6149",
      "--atlas-accent": "#38e08a", "--atlas-accent-soft": "rgba(56,224,138,.14)",
      "--atlas-positive": "#9be34a", "--atlas-warning": "#e0b23a", "--atlas-info": "#5ed7b0",
      "--atlas-blend": "screen", "--atlas-tempo": ".85",
    },
    wheel: {
      ink: "#d7ffe6", paper: "#080e0b", faint: "#17301f", mid: "#5a8f6c",
      element: { fire: "#e0b23a", earth: "#9be34a", air: "#5ed7b0", water: "#5ea6a0" },
      aspect: aspect("#9be34a", "#e0b23a", "#38e08a", "#5a8f6c"),
      theme_palette: ["#38e08a", "#e0b23a", "#9be34a", "#70aa73", "#5ed7b0", "#d4cf62"],
    },
  },
];

export const DEFAULT_THEME_ID = "paperlab";
