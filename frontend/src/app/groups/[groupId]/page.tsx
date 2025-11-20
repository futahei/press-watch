import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";

interface GroupPageProps {
  params: { groupId: string };
}

export function generateMetadata({ params }: GroupPageProps): Metadata {
  return {
    title: `グループ: ${params.groupId} - PressWatch`,
  };
}

// 仮のダミーデータ（後で API 経由に差し替える）
const dummyArticles = [
  {
    id: "a1",
    companyName: "Example Corp.",
    title: "新製品「PressWatch AI」リリースのお知らせ",
    url: "https://example.com/press/presswatch-ai",
    publishedAt: "2025-11-01T09:00:00Z",
    summaryText:
      "Example Corp. は、企業のプレスリリースを自動監視し、AI 要約を提供する新サービス「PressWatch AI」を発表しました。本サービスは複数企業のサイトを横断的に監視し、重要な情報を素早くキャッチアップできることを特徴としています。",
    isNew: true,
  },
  {
    id: "a2",
    companyName: "Sample Industries",
    title: "環境対応型生産ラインの拡張について",
    url: "https://example.com/press/eco-line",
    publishedAt: "2025-10-20T03:00:00Z",
    summaryText:
      "Sample Industries は CO2 排出削減を目的とした環境対応型生産ラインの拡張計画を発表しました。これにより年間 30% の排出量削減を見込んでいます。",
    isNew: false,
  },
];

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId } = params;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">グループ: {groupId}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          このグループに属する企業の最新プレスリリース（ダミーデータ）を表示しています。
        </p>
      </header>

      <div className="space-y-3">
        {dummyArticles.map((article) => (
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
    </section>
  );
}
