// 記事一覧で使うサマリ情報
export interface ArticleSummary {
  id: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string; // ISO 8601 文字列
  summaryText: string;
  isNew: boolean;
}

// グループ別の記事一覧レスポンス
export interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}

// Push 通知購読リクエスト
export interface PushSubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  // 将来的に groupId や userId などを紐づけるならここに追加
}

// Push 通知購読レスポンス（必要に応じて拡張）
export interface PushSubscribeResponse {
  success: boolean;
}

// ---- 要約 API 用の型 ----

// 用語集アイテム
export interface GlossaryItem {
  term: string;
  reading?: string | null;
  description: string;
}

// /summarize に投げるリクエストボディ
export interface SummarizeArticleRequest {
  title: string;
  companyName: string;
  url: string;
  body: string;
  publishedAt?: string;
}

// /summarize のレスポンスボディ
export interface SummarizeArticleResponse {
  summaryText: string;
  glossary: GlossaryItem[];
}
