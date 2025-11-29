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

      <ArticleDetailView groupId={groupId} articleId={articleId} />
    </main>
  );
}
