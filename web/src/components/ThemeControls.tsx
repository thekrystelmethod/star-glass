import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import RegisterDock, { type DockTheme } from "../portable/RegisterDock";
import ThemeStudio, {
  type StudioBackground,
  type StudioPairing,
} from "../portable/ThemeStudio";
import { useTheme } from "../theme/ThemeProvider";

const PAIRINGS: StudioPairing[] = [
  {
    id: "paper",
    label: "Paper Lab",
    note: "Literary display type with a clear editorial reading face.",
    display: '"Iowan Old Style", Palatino, Georgia, serif',
    body: '"Source Sans 3", "Avenir Next", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  {
    id: "drafting",
    label: "Drafting Table",
    note: "Technical headings and measured, highly legible body copy.",
    display: '"Avenir Next", "Space Grotesk", system-ui, sans-serif',
    body: '"Avenir Next", "IBM Plex Sans", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
];

const REGISTER_PAIRING: Record<string, string> = {
  paperlab: "paper",
  blueprint: "drafting",
  refined: "paper",
  phosphor: "drafting",
};

function QuietPreview() {
  return <span className="environment-preview environment-quiet" aria-hidden="true" />;
}

function ConstellationPreview() {
  return <span className="environment-preview environment-constellation" aria-hidden="true" />;
}

function BreathingPreview() {
  return <span className="environment-preview environment-breathing" aria-hidden="true" />;
}

export const BACKGROUNDS: StudioBackground[] = [
  { id: "quiet", label: "Quiet", note: "The register without an ambient layer.", Component: QuietPreview },
  { id: "constellation", label: "Constellation", note: "A fine celestial drafting field.", Component: ConstellationPreview },
  { id: "breathing", label: "Breathing glow", note: "A slow pool of register light.", Component: BreathingPreview },
];

interface ThemeControlsProps {
  backgroundId: string;
  onBackground: (id: string) => void;
}

export function ThemeControls({ backgroundId, onBackground }: ThemeControlsProps) {
  const { theme, themeId, setThemeId, themes } = useTheme();
  const [studioOpen, setStudioOpen] = useState(false);
  const [pairChoice, setPairChoice] = useState(() => {
    try { return localStorage.getItem("starglass-font-pair") || "register"; }
    catch (_) { return "register"; }
  });

  const effectivePairing = useMemo(() => {
    const id = pairChoice === "register" ? REGISTER_PAIRING[themeId] : pairChoice;
    return PAIRINGS.find((pairing) => pairing.id === id) ?? PAIRINGS[0];
  }, [pairChoice, themeId]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (pairChoice === "register") {
      root.removeProperty("--font-display");
      root.removeProperty("--font-body");
      root.removeProperty("--font-mono");
    } else {
      root.setProperty("--font-display", effectivePairing.display);
      root.setProperty("--font-body", effectivePairing.body);
      root.setProperty("--font-mono", effectivePairing.mono);
    }
    try { localStorage.setItem("starglass-font-pair", pairChoice); } catch (_) {}
  }, [effectivePairing, pairChoice]);

  const dockThemes: DockTheme[] = themes.map((candidate) => ({
    id: candidate.id,
    label: candidate.label,
    note: candidate.note,
    swatch: {
      bg: candidate.tokens["--atlas-panel"],
      accent: candidate.tokens["--atlas-accent"],
      extra: candidate.tokens["--atlas-positive"],
    },
  }));

  return (
    <>
      <div className="theme-controls">
        <RegisterDock
          themes={dockThemes}
          themeId={themeId}
          onTheme={setThemeId}
          backgrounds={BACKGROUNDS.map(({ id, label, note }) => ({ id, label, note }))}
          backgroundId={backgroundId}
          onBackground={onBackground}
          moments={[]}
          momentId=""
          onMoment={() => {}}
          label="Register"
          onStudio={() => setStudioOpen(true)}
        />
      </div>
      {createPortal(
        <ThemeStudio
          open={studioOpen}
          compact
          onClose={() => setStudioOpen(false)}
          themes={themes}
          themeId={themeId}
          onTheme={setThemeId}
          backgrounds={BACKGROUNDS}
          backgroundId={backgroundId}
          onBackground={onBackground}
          moments={[]}
          momentId=""
          onMoment={() => {}}
          pairings={PAIRINGS}
          pairChoice={pairChoice}
          onPairing={setPairChoice}
          followValue="register"
          effectivePairing={effectivePairing}
          registerLabel={theme.label}
          eyebrow="STARGLASS · THEME STUDIO"
          heading="Change how StarGlass catches the light."
          intro="Choose a register, type pairing, and atmosphere. Your chart and wheel retune together; your reading stays exactly the same."
          statusText={`StarGlass is wearing ${theme.label}. Theme changes only the look.`}
          completionLabel={`Keep ${theme.label}`}
        />,
        document.body,
      )}
    </>
  );
}

export function Atmosphere({ id }: { id: string }) {
  return <div className={`app-atmosphere app-atmosphere-${id}`} aria-hidden="true" />;
}
