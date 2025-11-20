"use client";

import Link from "next/link";

export interface ArticleCardProps {
  companyName: string;
  title: string;
  url: string;
  publishedAt?: string;
  summaryText?: string;
  isNew?: boolean;
}

/**
 * プレスリリース1件分を表示するカードコンポーネント。
 */
export function ArticleCard(props: ArticleCardProps) {
  const { companyName, title, url, publishedAt, summaryText, isNew } = props;

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "公開日不明";

  const summary =
    summaryText && summaryText.length > 140
      ? summaryText.slice(0, 140) + "…"
      : summaryText ?? "要約はまだ生成されていません。";

  return (
    <article className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col gap-2 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {companyName}
        </div>
        <div className="flex items-center gap-2">
          <time
            dateTime={publishedAt}
            className="text-xs text-slate-400 dark:text-slate-500"
          >
            {formattedDate}
          </time>
          {isNew && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              NEW
            </span>
          )}
        </div>
      </div>

      <h2 className="text-sm font-semibold leading-snug">
        <Link
          href={url}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          {title}
        </Link>
      </h2>

      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
        {summary}
      </p>
    </article>
  );
}
