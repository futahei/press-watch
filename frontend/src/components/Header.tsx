"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-semibold text-lg tracking-tight">
            PressWatch
          </span>
          <span className="text-xs text-gray-500">
            プレスリリース監視 &amp; 要約
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {/* 将来的に: グループ一覧や設定ページへのリンク */}
          {/* <Link href="/groups/default" className="text-sm text-gray-600 dark:text-gray-300">
            グループ
          </Link> */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
