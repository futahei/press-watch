/**
 * フロントエンドで扱う記事サマリの型。
 * backend/src/domain/models.ts の ArticleSummary と対応する。
 */
export interface ArticleSummary {
  id: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt?: string;
  summaryText?: string;
  isNew?: boolean;
}

/**
 * グループ単位の API レスポンス。
 * backend/src/domain/models.ts の GetGroupArticlesResponse に対応する。
 */
export interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}
