import Link from "next/link";
import { fetchArticleDetail } from "@/lib/apiClient";
import type { ArticleDetail } from "@/lib/types";

type PageProps = {
  params: Promise<{
    groupId: string;
    articleId: string;
  }>;
};

export default async function ArticleDetailPage({ params }: PageProps) {
  // ★ params は Promise なので必ず await する
  const { groupId, articleId } = await params;

  const article: ArticleDetail | null = await fetchArticleDetail(
    groupId,
    articleId
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

      <section className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 leading-relaxed space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          要約
        </h2>
        <p className="text-sm whitespace-pre-wrap">{article.summaryText}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          用語集
        </h2>
        {article.glossary.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            特に用語は登録されていません。
          </p>
        ) : (
          <ul className="space-y-2">
            {article.glossary.map((item, idx) => (
              <li
                key={`${item.term}-${idx}`}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2"
              >
                <div className="text-sm font-medium">
                  {item.term}
                  {item.reading && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({item.reading})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
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
    </main>
  );
}
