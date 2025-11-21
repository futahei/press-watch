import type { ArticleSummary, GetGroupArticlesResponse } from "./types";

/**
 * 将来的には AWS API Gateway 経由のエンドポイントになる想定。
 * 例: https://api.presswatch.example.com/groups/{groupId}/articles
 *
 * 現時点では:
 * - NEXT_PUBLIC_API_BASE_URL が設定されていれば、その URL へ fetch を行う
 * - 設定されていなければ、ローカルのモックデータを返す
 */

const MOCK_ARTICLES: Record<string, ArticleSummary[]> = {
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

function getMockGroupArticles(groupId: string): GetGroupArticlesResponse {
  const articles = MOCK_ARTICLES[groupId] ?? [];
  return {
    groupId,
    articles,
  };
}

export async function fetchGroupArticles(
  groupId: string
): Promise<GetGroupArticlesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // AWS 側の API がまだ用意されていない間は、モックを使う
  if (!baseUrl) {
    return getMockGroupArticles(groupId);
  }

  // 将来的な本番/ステージング接続用のコード（まだ実際には叩かれない想定）
  const url = new URL(
    `/groups/${encodeURIComponent(groupId)}/articles`,
    baseUrl
  );

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Next.js のサーバーコンポーネントから呼ぶことを想定しているので、
    // キャッシュ戦略などは必要に応じて後で調整
    cache: "no-store",
  });

  if (!res.ok) {
    // エラーハンドリングの方針は後で細かく決める
    throw new Error(`Failed to fetch articles for group: ${groupId}`);
  }

  const data = (await res.json()) as GetGroupArticlesResponse;
  return data;
}
