"use client";

import { useState } from "react";
import { summarizeArticle } from "@/lib/apiClient";
import type {
  SummarizeArticleRequest,
  SummarizeArticleResponse,
  GlossaryItem,
} from "@/lib/types";

export default function SummarizeDevPage() {
  const [form, setForm] = useState<SummarizeArticleRequest>({
    title: "",
    companyName: "",
    url: "",
    body: "",
    publishedAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeArticleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const payload: SummarizeArticleRequest = {
        title: form.title.trim(),
        companyName: form.companyName.trim(),
        url: form.url.trim(),
        body: form.body.trim(),
        publishedAt: form.publishedAt?.trim()
          ? form.publishedAt.trim()
          : undefined,
      };

      const res = await summarizeArticle(payload);
      setResult(res);
    } catch (err) {
      console.error("[SummarizeDevPage] summarize failed:", err);
      setError(
        err instanceof Error ? err.message : "要約の呼び出しに失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">要約テストページ（開発用）</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          PressWatch の要約
          Lambda（/summarize）を手動で呼び出して結果を確認するためのページです。
          <br />
          プレスリリースのタイトル・本文などを入力して「要約する」を押すと、サーバー側で
          GPT-4.1 による要約と用語集が生成されます。
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-start">
        {/* 入力フォーム */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">入力</h2>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="title">
              タイトル
            </label>
            <input
              id="title"
              name="title"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="companyName">
              会社名
            </label>
            <input
              id="companyName"
              name="companyName"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="url">
              プレスリリース URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={form.url}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="publishedAt">
              公開日時（任意・ISO 8601）
            </label>
            <input
              id="publishedAt"
              name="publishedAt"
              placeholder="2025-11-28T12:00:00Z"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={form.publishedAt ?? ""}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="body">
              本文
            </label>
            <textarea
              id="body"
              name="body"
              className="w-full min-h-[180px] rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={form.body}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "要約中..." : "要約する"}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          )}
        </form>

        {/* 結果表示 */}
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">結果</h2>

          {!result && !error && !loading && (
            <p className="text-sm text-slate-500">
              右側のフォームから要約を実行すると、ここに要約と用語集が表示されます。
            </p>
          )}

          {loading && (
            <p className="text-sm text-slate-500">要約実行中です...</p>
          )}

          {result && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">要約</h3>
                <p className="whitespace-pre-wrap text-sm">
                  {result.summaryText}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-1">用語集</h3>
                {result.glossary.length === 0 && (
                  <p className="text-sm text-slate-500">
                    特に用語は抽出されませんでした。
                  </p>
                )}
                {result.glossary.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {result.glossary.map((item: GlossaryItem, idx: number) => (
                      <li
                        key={`${item.term}-${idx}`}
                        className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2"
                      >
                        <div className="font-medium">
                          {item.term}
                          {item.reading && (
                            <span className="ml-2 text-xs text-slate-500">
                              ({item.reading})
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1 text-slate-700 dark:text-slate-300">
                          {item.description}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
