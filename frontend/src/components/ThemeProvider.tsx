"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "presswatch-theme";

function getSystemTheme(): "light" | "dark" {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia === "undefined"
  ) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. 初期テーマは useState の初期値関数で決定（effect では setState しない）
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      // SSR/初回レンダリング時は system として扱う
      return "system";
    }
    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY
    ) as Theme | null;
    return stored ?? "system";
  });

  // 2. 有効なテーマはレンダリング時に計算（state にはしない）
  const effectiveTheme: "light" | "dark" =
    theme === "system" ? getSystemTheme() : theme;

  // 3. DOM クラスと localStorage を同期するだけの effect（setState は呼ばない）
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (typeof window !== "undefined") {
      if (theme === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    }
  }, [theme, effectiveTheme]);

  // 4. system テーマの変化（OS 設定変更）に追従するための監視
  //    ここでは OS 側の変化を検出して再レンダリングを促すが、
  //    theme 自体は変えない（"system" のまま）という方針。
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      // theme は "system" のままなので、実質「再レンダリングを促す」だけ
      // （state 値は変わらないが、setTheme を呼ぶことで React が再評価して effectiveTheme を計算し直す）
      setTheme((current) => current);
    };

    media.addEventListener("change", handleChange);
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme は ThemeProvider の内部でのみ使用できます。");
  }
  return ctx;
}
