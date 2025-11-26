export type GroupId = string;
export type CompanyId = string;
export type ArticleId = string;

/**
 * クライアントに返す記事サマリー（一覧用）。
 * 既存の ArticleSummary と近いが、ここではバックエンド側の基準モデルとして定義。
 */
export interface ArticleSummary {
  id: ArticleId;
  groupId: GroupId;
  companyId: CompanyId;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string; // ISO 8601
  summaryText: string;
}

/**
 * 記事詳細用のモデル。
 * 要約に加えて用語解説などを含む。
 */
export interface ArticleDetail extends ArticleSummary {
  glossary: GlossaryItem[];
}

export interface GlossaryItem {
  term: string;
  reading?: string;
  description: string;
}

/**
 * DynamoDB に保存する記事レコードの形。
 * - 物理スキーマ（pk/sk）を含む。
 */
export interface ArticleRecord {
  pk: string;
  sk: string;

  articleId: ArticleId;
  groupId: GroupId;
  companyId: CompanyId;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
  summaryText: string;
  glossary?: GlossaryItem[];

  createdAt: string;
  updatedAt: string;
}

/**
 * DynamoDB の pk/sk 生成規則。
 */
export function buildArticlePk(groupId: GroupId): string {
  return `GROUP#${groupId}`;
}

export function buildArticleSk(
  publishedAt: string,
  articleId: ArticleId
): string {
  return `PUBLISHED#${publishedAt}#ARTICLE#${articleId}`;
}

/**
 * ドメインモデル（ArticleDetail）を ArticleRecord に変換する。
 * - createdAt/updatedAt は呼び出し側から渡す。
 */
export function toArticleRecord(params: {
  article: ArticleDetail;
  createdAt: string;
  updatedAt: string;
}): ArticleRecord {
  const { article, createdAt, updatedAt } = params;

  return {
    pk: buildArticlePk(article.groupId),
    sk: buildArticleSk(article.publishedAt, article.id),
    articleId: article.id,
    groupId: article.groupId,
    companyId: article.companyId,
    companyName: article.companyName,
    title: article.title,
    url: article.url,
    publishedAt: article.publishedAt,
    summaryText: article.summaryText,
    glossary: article.glossary,
    createdAt,
    updatedAt,
  };
}

/**
 * DynamoDB から取得した ArticleRecord を ArticleDetail に変換する。
 */
export function toArticleDetail(record: ArticleRecord): ArticleDetail {
  return {
    id: record.articleId,
    groupId: record.groupId,
    companyId: record.companyId,
    companyName: record.companyName,
    title: record.title,
    url: record.url,
    publishedAt: record.publishedAt,
    summaryText: record.summaryText,
    glossary: record.glossary ?? [],
  };
}

/**
 * ArticleDetail から一覧用の ArticleSummary を切り出す。
 */
export function toArticleSummary(detail: ArticleDetail): ArticleSummary {
  const { glossary: _glossary, ...summary } = detail;
  return summary;
}
