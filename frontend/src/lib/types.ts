// 記事一覧で使うサマリ情報
export interface ArticleSummary {
  id: string;
  companyId?: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt?: string; // ISO 8601 文字列
  summaryText?: string;
  isNew?: boolean;
}

// 記事詳細
export interface ArticleDetail extends ArticleSummary {
  groupId: string;
  summaryText: string;
  publishedAt: string;
  glossary: GlossaryItem[];
}

// グループ別の記事一覧レスポンス
export interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}

export type GetArticleDetailResponse = ArticleDetail;

// Push 通知購読リクエスト
export interface PushSubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  groupIds: string[];
  userAgent?: string;
}

// Push 通知購読レスポンス
export interface PushSubscribeResponse {
  subscriptionId: string;
  groupIds: string[];
}

// ---- 要約 API 用の型 ----

// 用語集アイテム
export interface GlossaryItem {
  term: string;
  reading?: string;
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

// ---- 企業設定 ----
export interface SimpleListCrawlConfig {
  type: "simpleList";
  itemSelector: string;
  titleSelector: string;
  urlSelector: string;
  dateSelector?: string;
  dateFormatHint?: string;
  timezone?: string;
  maxItems?: number;
}

export interface CompanyConfig {
  id: string;
  name: string;
  homepageUrl?: string;
  pressReleaseUrl: string;
  crawlConfig: SimpleListCrawlConfig;
}
