import Link from "next/link";
import { ArticleDetailView } from "./ArticleDetailView";

type PageProps = {
  params: Promise<{
    groupId: string;
    articleId: string;
  }>;
};

export default async function ArticleDetailPage({ params }: PageProps) {
  // ★ params は Promise なので必ず await する
  const { groupId, articleId } = await params;
  const isUsingRealApi = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href={`/groups/${encodeURIComponent(groupId)}`}
          className="hover:underline"
        >
          ← グループ「{groupId}」の記事一覧に戻る
        </Link>
        {!isUsingRealApi && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            モックデータを表示中
          </span>
        )}
      </div>

      <ArticleDetailView groupId={groupId} articleId={articleId} />
    </main>
  );
}
