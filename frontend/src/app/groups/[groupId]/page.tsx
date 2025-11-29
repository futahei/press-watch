import { fetchGroupArticles } from "@/lib/apiClient";
import type { ArticleSummary } from "@/lib/types";
import Link from "next/link";
import { NotificationToggle } from "@/components/NotificationToggle";

type PageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupPage({ params }: PageProps) {
  // App Router の params は Promise の可能性があるので await する
  const { groupId } = await params;

  const { articles } = await fetchGroupArticles(groupId);
  const isUsingRealApi = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          グループ「{groupId}」のプレスリリース
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          監視対象の企業から取得したプレスリリース一覧です。タイトルをクリックすると詳細を表示します。
        </p>
        <NotificationToggle groupId={groupId} />
        {!isUsingRealApi && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            API が未設定のためモックデータを表示しています。
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 text-[10px] font-semibold">
            NEW
          </span>
          <div className="relative group">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] text-slate-600 dark:border-slate-600 dark:text-slate-300">
              ?
            </span>
            <div className="absolute left-5 top-1/2 z-10 hidden w-56 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-600 shadow-md group-hover:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              公開から48時間以内の記事に表示されます。時差の影響で多少前後する場合があります。
            </div>
          </div>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          現時点でこのグループに表示できる記事はありません。
        </p>
      ) : (
        <ul className="space-y-3">
          {articles.map((article: ArticleSummary) => (
            <li key={article.id}>
              <Link
                href={`/groups/${encodeURIComponent(
                  groupId
                )}/articles/${encodeURIComponent(article.id)}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-sky-400 hover:shadow-sm transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
                      {article.companyName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleString(
                            "ja-JP",
                            {
                              timeZone: "Asia/Tokyo",
                            }
                          )
                        : "公開日不明"}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {article.summaryText && article.summaryText.trim()
                      ? article.summaryText
                      : "要約はまだ生成されていません。"}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{article.companyId ?? "企業ID未設定"}</span>
                    {article.isNew && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
