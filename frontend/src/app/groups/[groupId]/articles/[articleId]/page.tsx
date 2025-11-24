import Link from "next/link";
import { fetchGroupArticles } from "@/lib/apiClient";
import type { ArticleSummary } from "@/lib/types";

type PageProps = {
  params: Promise<{
    groupId: string;
    articleId: string;
  }>;
};

export default async function ArticleDetailPage({ params }: PageProps) {
  // ★ params は Promise なので必ず await する
  const { groupId, articleId } = await params;

  const { articles } = await fetchGroupArticles(groupId);

  const article: ArticleSummary | undefined = articles.find(
    (a) => a.id === articleId
  );

  if (!article) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <Link
            href={`/groups/${encodeURIComponent(groupId)}`}
            className="hover:underline"
          >
            ← グループ「{groupId}」の記事一覧に戻る
          </Link>
        </div>
        <h1 className="text-xl font-bold">記事が見つかりませんでした</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          groupId: <code>{String(groupId)}</code>
          <br />
          articleId: <code>{String(articleId)}</code>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <Link
          href={`/groups/${encodeURIComponent(groupId)}`}
          className="hover:underline"
        >
          ← グループ「{groupId}」の記事一覧に戻る
        </Link>
      </div>

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

      {article.summaryText && (
        <section className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 leading-relaxed">
          <h2 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
            要約
          </h2>
          <p className="text-sm whitespace-pre-wrap">{article.summaryText}</p>
        </section>
      )}

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
    </main>
  );
}
