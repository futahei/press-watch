export interface ExistingArticleRecord {
  /** 既に保存済みの記事のURL（URLで一意とみなす） */
  url: string;
  // 今後 id や companyId などを追加予定
}

export interface CrawledArticleSnapshot {
  /** クロールで取得した記事URL */
  url: string;
  /** クロール時に取得したタイトル */
  title: string;
  /** 公開日時（取得できない場合もある） */
  publishedAt?: string; // ISO 8601 文字列を想定
}

/**
 * DBに保存する前の「新規記事候補」。
 * 基本的には CrawledArticleSnapshot と同じだが、
 * 拡張の余地を残す。
 */
export interface NewArticleCandidate {
  url: string;
  title: string;
  publishedAt?: string;
}

/**
 * フロントエンドに返す記事のサマリ情報。
 * ArticleCard コンポーネントがそのまま表示に使える形にする。
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
 * グループ単位で記事一覧を返すレスポンス。
 */
export interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}
