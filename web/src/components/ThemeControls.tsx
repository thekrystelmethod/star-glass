import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ATMOSPHERES, MOMENTS } from "../motion/catalog";
import RegisterDock, { type DockTheme } from "../portable/RegisterDock";
import ThemeStudio from "../portable/ThemeStudio";
import { useTheme } from "../theme/ThemeProvider";
import {
  BOUND_REGISTERS,
  BOUND_REGISTER_LIST,
  PAIRINGS,
  REGISTER_ROLES,
  pairingForRegister,
} from "../theme/themes";

/**
 * The type pairing is a SEPARATE axis from the register. "Follow register"
 * (the default) resolves through REGISTER_PAIRING; an explicit pick overrides
 * the register's own type tokens with inline custom properties on <html>.
 *
 * The override sets --font-display-sm and --font-display-min too. Without
 * them a pairing chosen over Blue Hour would inherit Blue Hour's 40px script
 * floor and shove every small heading up to 40px in a face that doesn't need
 * it — the floor belongs to the script, not to the register.
 */
const OVERRIDES = [
  "--font-display", "--font-display-sm", "--font-display-min", "--font-body", "--font-mono",
] as const;

const FOLLOW = "register";

interface ThemeControlsProps {
  backgroundId: string;
  onBackground: (id: string) => void;
  momentId: string;
  onMoment: (id: string) => void;
}

export function ThemeControls({ backgroundId, onBackground, momentId, onMoment }: ThemeControlsProps) {
  const { theme, themeId, setThemeId, themes, lensId } = useTheme();
  const [studioOpen, setStudioOpen] = useState(false);
  const [pairChoice, setPairChoice] = useState(() => {
    try { return localStorage.getItem("starglass-font-pair") || FOLLOW; }
    catch (_) { return FOLLOW; }
  });

  const effectivePairing = useMemo(() => {
    if (pairChoice === FOLLOW) return pairingForRegister(theme.id);
    return PAIRINGS.find((pairing) => pairing.id === pairChoice) ?? pairingForRegister(theme.id);
  }, [pairChoice, theme.id]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (pairChoice === FOLLOW) {
      for (const property of OVERRIDES) root.removeProperty(property);
    } else {
      root.setProperty("--font-display", effectivePairing.display);
      root.setProperty("--font-body", effectivePairing.body);
      root.setProperty("--font-mono", effectivePairing.mono);
      // Blue Hour's pairing is the only one carrying a script; every other
      // pairing's display face holds at any size.
      const script = effectivePairing.id === "bluehour";
      root.setProperty("--font-display-sm", script ? effectivePairing.body : effectivePairing.display);
      root.setProperty("--font-display-min", script ? "40px" : "0px");
    }
    try { localStorage.setItem("starglass-font-pair", pairChoice); } catch (_) {}
  }, [effectivePairing, pairChoice]);

  const dockThemes: DockTheme[] = themes.map((candidate) => ({
    id: candidate.id,
    label: candidate.label,
    note: REGISTER_ROLES[candidate.id] ?? candidate.note,
    swatch: {
      bg: candidate.tokens["--atlas-panel"],
      accent: candidate.tokens["--atlas-accent"],
      extra: candidate.tokens["--atlas-positive"],
    },
  }));

  const lensNote = lensId
    ? `${theme.label} is applying — it travels with a ${BOUND_REGISTERS[lensId] === "zodiac" ? "sidereal" : "bound"} reading, not with your pick.`
    : undefined;

  return (
    <>
      <div className="theme-controls">
        <RegisterDock
          themes={dockThemes}
          themeId={themeId}
          onTheme={setThemeId}
          backgrounds={ATMOSPHERES.map(({ id, label, note }) => ({ id, label, note }))}
          backgroundId={backgroundId}
          onBackground={onBackground}
          moments={MOMENTS.map(({ id, label, note }) => ({ id, label, note }))}
          momentId={momentId}
          onMoment={onMoment}
          label="Register"
          hint={lensNote}
          onStudio={() => setStudioOpen(true)}
        />
      </div>
      {createPortal(
        <ThemeStudio
          open={studioOpen}
          onClose={() => setStudioOpen(false)}
          themes={themes}
          themeId={themeId}
          onTheme={setThemeId}
          roles={REGISTER_ROLES}
          boundThemes={BOUND_REGISTER_LIST}
          bindings={BOUND_REGISTERS}
          backgrounds={ATMOSPHERES}
          backgroundId={backgroundId}
          onBackground={onBackground}
          moments={MOMENTS}
          momentId={momentId}
          onMoment={onMoment}
          pairings={PAIRINGS}
          pairChoice={pairChoice}
          onPairing={setPairChoice}
          followValue={FOLLOW}
          effectivePairing={effectivePairing}
          registerLabel={theme.label}
          eyebrow="STARGLASS · THEME STUDIO"
          heading="Change how StarGlass catches the light."
          intro="Eight registers, each with one job. Pick the room, then the voice it speaks in — type pairing, atmosphere, and the moment a portrait lands. Three more registers aren't yours to pick: they belong to the printed page, the shared card, and the sidereal sky."
          statusText={
            lensId
              ? `${theme.label} is applying to this reading. Your pick, ${themes.find((t) => t.id === themeId)?.label}, returns with a tropical chart.`
              : `StarGlass is wearing ${theme.label}. Theme changes only the look.`
          }
          completionLabel={`Keep ${themes.find((t) => t.id === themeId)?.label ?? theme.label}`}
        />,
        document.body,
      )}
    </>
  );
}
