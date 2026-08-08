import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME_ID, THEMES, type StarGlassTheme } from "./themes";

interface ThemeContextValue {
  theme: StarGlassTheme;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: StarGlassTheme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "starglass-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.some((theme) => theme.id === saved)) return saved;
    } catch (_) {}
    return DEFAULT_THEME_ID;
  });

  const theme = useMemo(
    () => THEMES.find((candidate) => candidate.id === themeId) ?? THEMES[0],
    [themeId],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-anim");
    root.dataset.theme = theme.id;
    const timeout = window.setTimeout(() => root.classList.remove("theme-anim"), 420);
    try { localStorage.setItem(STORAGE_KEY, theme.id); } catch (_) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme.tokens["--atlas-bg"]);
    return () => window.clearTimeout(timeout);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
