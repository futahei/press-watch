"use client";

import { useTheme } from "./ThemeProvider";

const THEME_LABEL: Record<"light" | "dark" | "system", string> = {
  light: "ライト",
  dark: "ダーク",
  system: "システム",
};

export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const handleToggle = () => {
    const order: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = order.indexOf(theme);
    const next = order[(currentIndex + 1) % order.length];
    setTheme(next);
  };

  const icon =
    effectiveTheme === "dark" ? (
      <span aria-hidden="true">🌙</span>
    ) : (
      <span aria-hidden="true">☀️</span>
    );

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="テーマを切り替え"
    >
      {icon}
      <span>{THEME_LABEL[theme]}</span>
    </button>
  );
}
