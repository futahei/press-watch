"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: "light" | "dark"; // 実際に適用されているテーマ
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "presswatch-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    "light"
  );

  // 初期化：localStorage or system
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY
    ) as Theme | null;

    const initialTheme: Theme = stored ?? "system";
    setThemeState(initialTheme);

    const nextEffective =
      initialTheme === "system" ? getSystemTheme() : initialTheme;
    setEffectiveTheme(nextEffective);
    applyThemeClass(nextEffective);
  }, []);

  // OS 設定が変わった場合 (theme === "system" のときだけ反映)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const nextEffective: "light" | "dark" = event.matches ? "dark" : "light";
      setEffectiveTheme(nextEffective);
      applyThemeClass(nextEffective);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window === "undefined") return;

    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    const nextEffective = next === "system" ? getSystemTheme() : next;
    setEffectiveTheme(nextEffective);
    applyThemeClass(nextEffective);
  }, []);

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function applyThemeClass(effective: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
