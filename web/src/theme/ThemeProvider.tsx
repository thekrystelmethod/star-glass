import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_REGISTER_ID,
  PICKABLE_REGISTERS,
  getRegister,
  installRegisterStyles,
  resolveRegisterId,
  type StarGlassTheme,
} from "./themes";

interface ThemeContextValue {
  /** The register actually on screen — the lens if one is applied, else the pick. */
  theme: StarGlassTheme;
  themeId: string;
  setThemeId: (id: string) => void;
  /** Registers the user may choose. Bound registers are deliberately absent. */
  themes: StarGlassTheme[];
  /** The user's own pick, unchanged while a lens is applied. */
  pick: StarGlassTheme;
  /** A register the reading mode is imposing (Sidereal), or null. */
  lensId: string | null;
  setLensId: (id: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "starglass-theme";

// The compiled field has to exist before the first render reads a token.
installRegisterStyles();

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdRaw] = useState(() => {
    try {
      // resolveRegisterId carries a retired id forward: a "paperlab" saved
      // before the field was finalized lands on Observatory, not on nothing.
      return resolveRegisterId(localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      return DEFAULT_REGISTER_ID;
    }
  });
  const [lensId, setLensId] = useState<string | null>(null);

  const pick = useMemo(() => getRegister(themeId), [themeId]);
  const theme = useMemo(() => (lensId ? getRegister(lensId) : pick), [lensId, pick]);

  useEffect(() => {
    const root = document.documentElement;
    // index.html paints the ground inline to kill the pre-hydration flash.
    // That inline pair outranks every stylesheet, so it has to be released the
    // moment the compiled field is live — otherwise the very first register
    // the visitor picks leaves the page background behind.
    root.style.removeProperty("background");
    root.style.removeProperty("color");
    root.classList.add("theme-anim");
    root.dataset.theme = theme.id;
    const timeout = window.setTimeout(() => root.classList.remove("theme-anim"), 420);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme.tokens["--atlas-bg"]);
    return () => window.clearTimeout(timeout);
  }, [theme]);

  // Only the PICK persists. A lens belongs to the reading, not to taste, so it
  // never survives a reload — the next visit opens in the register they chose.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, pick.id); } catch (_) {}
  }, [pick]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeId: pick.id,
      setThemeId: (id: string) => setThemeIdRaw(resolveRegisterId(id)),
      themes: PICKABLE_REGISTERS,
      pick,
      lensId,
      setLensId,
    }),
    [theme, pick, lensId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
