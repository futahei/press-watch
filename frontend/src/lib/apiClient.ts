import type {
  ArticleSummary,
  GetGroupArticlesResponse,
  PushSubscribeRequest,
  PushSubscribeResponse,
} from "./types";

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

  // API のベースURLが未設定なら、モックを返す
  if (!baseUrl) {
    console.info(
      "[fetchGroupArticles] NEXT_PUBLIC_API_BASE_URL が未設定のため、モックデータを返します。groupId=",
      groupId
    );
    return getMockGroupArticles(groupId);
  }

  const url = new URL(
    `/groups/${encodeURIComponent(groupId)}/articles`,
    baseUrl
  );

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // 必要なら credentials や Authorization も後で追加
    });

    if (!res.ok) {
      console.error(
        "[fetchGroupArticles] API error:",
        res.status,
        res.statusText
      );
      // フロントが完全に死なないように、モックにフォールバック
      return getMockGroupArticles(groupId);
    }

    const data = (await res.json()) as GetGroupArticlesResponse;

    // 最低限のバリデーション（articles が配列かどうか）
    if (!Array.isArray(data.articles)) {
      console.error(
        "[fetchGroupArticles] Unexpected response shape, falling back to mock:",
        data
      );
      return getMockGroupArticles(groupId);
    }

    return data;
  } catch (error) {
    console.error(
      "[fetchGroupArticles] Fetch failed, falling back to mock:",
      error
    );
    return getMockGroupArticles(groupId);
  }
}

export async function subscribePush(
  payload: PushSubscribeRequest
): Promise<PushSubscribeResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    console.info(
      "[subscribePush] NEXT_PUBLIC_API_BASE_URL が未設定のため、購読情報はサーバーには送信しません。",
      payload
    );
    return null;
  }

  const url = new URL("/push/subscribe", baseUrl);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to subscribe push: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as PushSubscribeResponse;
  return data;
}
