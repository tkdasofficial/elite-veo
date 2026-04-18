import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemeMode) => void;
}

const STORAGE_KEY = "app-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

const applyTheme = (mode: ThemeMode): ResolvedTheme => {
  const resolved: ResolvedTheme = mode === "system" ? getSystemTheme() : mode;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  return resolved;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "dark";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "dark" : applyTheme((localStorage.getItem(STORAGE_KEY) as ThemeMode) || "dark"),
  );

  // Re-apply when theme changes
  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
  }, [theme]);

  // Listen to system changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
