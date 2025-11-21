import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { fetchGroupArticles } from "@/lib/apiClient";

// Next 16 (Dynamic APIs as Promise) 仕様に合わせる
interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export async function generateMetadata(
  props: GroupPageProps
): Promise<Metadata> {
  const { groupId } = await props.params;

  return {
    title: `グループ: ${groupId} - PressWatch`,
  };
}

export default async function GroupPage(props: GroupPageProps) {
  const { groupId } = await props.params;

  // API クライアント経由でデータを取得（現時点ではモックが返る）
  const { articles } = await fetchGroupArticles(groupId);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">グループ: {groupId}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          このグループに属する企業の最新プレスリリースを表示します。
          （現在はモックデータを使用しています）
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          このグループには、まだ表示できるプレスリリースがありません。
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              companyName={article.companyName}
              title={article.title}
              url={article.url}
              publishedAt={article.publishedAt}
              summaryText={article.summaryText}
              isNew={article.isNew}
            />
          ))}
        </div>
      )}
    </section>
  );
}
