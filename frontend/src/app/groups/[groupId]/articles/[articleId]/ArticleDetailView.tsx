"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArticleDetail } from "@/lib/types";
import { fetchArticleDetail } from "@/lib/apiClient";
import Link from "next/link";

type Props = {
  groupId: string;
  articleId: string;
};

export function ArticleDetailView({ groupId, articleId }: Props) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // 取得処理を共通化して、初回とリトライで使い回す
  const loadArticle = useCallback(
    async (cancelState?: { cancelled: boolean }) => {
      setArticle(null);
      setLoading(true);
      setError(null);
      setFallbackUsed(false);

      try {
        const res = await fetchArticleDetail(groupId, articleId);
        if (cancelState?.cancelled) return;

        if (!res) {
          setError("記事が見つかりませんでした。");
          return;
        }

        setArticle(res);

        // モックフォールバックを判定（API 未設定時は mock を返す仕様）
        if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
          setFallbackUsed(true);
        }
      } catch (e) {
        console.error("[ArticleDetailView] fetch failed:", e);
        if (cancelState?.cancelled) return;
        setError("記事の取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        if (cancelState?.cancelled) return;
        setLoading(false);
      }
    },
    [articleId, groupId]
  );

  useEffect(() => {
    const state = { cancelled: false };
    void loadArticle(state);
    return () => {
      state.cancelled = true;
    };
  }, [loadArticle]);

  const handleRetry = () => {
    void loadArticle();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">記事を読み込み中です...</p>;
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <p>{error}</p>
        <div className="flex items-center gap-3 text-xs">
          <Link
            href={`/groups/${encodeURIComponent(groupId)}`}
            className="text-sky-700 hover:underline dark:text-sky-300"
          >
            ← 一覧に戻る
          </Link>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            再読み込み
          </button>
        </div>
        <p className="text-[11px] text-red-600/80 dark:text-red-200/90">
          API
          が未設定の場合や一時的な障害で取得できないことがあります。時間をおいて再度お試しください。
        </p>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="space-y-6">
      {fallbackUsed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          API が設定されていないためモックデータを表示しています。
        </div>
      )}

      <header className="space-y-2">
        <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
          {article.companyName}
        </p>
        <h1 className="text-2xl font-bold leading-snug">{article.title}</h1>
        {article.publishedAt && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            公開日時:{" "}
            {new Date(article.publishedAt).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
            })}
          </p>
        )}
      </header>

      <section className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 leading-relaxed space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          要約
        </h2>
        <p className="text-sm whitespace-pre-wrap">{article.summaryText}</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            用語集
          </h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {article.glossary.length} 件
          </span>
        </div>
        {article.glossary.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            特に用語は登録されていません。
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {article.glossary.map((item, idx) => (
              <li
                key={`${item.term}-${idx}`}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2 space-y-1"
              >
                <div className="text-sm font-medium">
                  {item.term}
                  {item.reading && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({item.reading})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline"
        >
          元のプレスリリースを開く
        </a>
      </section>
    </div>
  );
}
