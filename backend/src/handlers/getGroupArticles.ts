import { ArticleSummary, GetGroupArticlesResponse } from "../domain/models.js";

/**
 * 現時点では DynamoDB はまだ使わず、
 * インメモリのダミーデータを返すだけの skeleton 実装にしておく。
 *
 * 今後:
 * - groupId に紐づく企業リストを取得
 * - それらの企業の記事を DynamoDB からクエリ
 * - detectNewArticles などのロジックで新着フラグを付与
 * という処理に差し替える予定。
 */
export async function getGroupArticles(
  groupId: string
): Promise<GetGroupArticlesResponse> {
  // TODO: 後で DB or Repository から取得する
  const dummyData: Record<string, ArticleSummary[]> = {
    default: [
      {
        id: "a1",
        companyName: "Example Corp.",
        title: "新製品「PressWatch AI」リリースのお知らせ",
        url: "https://example.com/press/presswatch-ai",
        publishedAt: "2025-11-01T09:00:00Z",
        summaryText:
          "Example Corp. は、企業のプレスリリースを自動監視し、AI 要約を提供する新サービス「PressWatch AI」を発表しました。",
        isNew: true,
      },
      {
        id: "a2",
        companyName: "Sample Industries",
        title: "環境対応型生産ラインの拡張について",
        url: "https://example.com/press/eco-line",
        publishedAt: "2025-10-20T03:00:00Z",
        summaryText:
          "Sample Industries は CO2 排出削減を目的とした環境対応型生産ラインの拡張計画を発表しました。",
        isNew: false,
      },
    ],
    manufacturing: [
      {
        id: "m1",
        companyName: "Meiden Manufacturing",
        title: "生産ライン向け品質管理ソリューションの提供開始",
        url: "https://example.com/press/qm-solution",
        publishedAt: "2025-11-10T01:00:00Z",
        summaryText:
          "Meiden Manufacturing は試験課の業務をデジタル化する品質管理ソリューションの提供を開始しました。",
        isNew: true,
      },
    ],
  };

  const articles: ArticleSummary[] = dummyData[groupId] ?? [];

  return {
    groupId,
    articles,
  };
}
