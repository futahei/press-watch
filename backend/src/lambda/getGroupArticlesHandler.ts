import { DynamoDbArticleRepository } from "../repository/dynamoArticleRepository.js";
import type { ArticleDetail } from "../domain/articleStorage.js";
import { parsePublishedAtToIso } from "./crawlAndSaveHandler.js";

const TABLE_NAME = process.env.ARTICLES_TABLE_NAME;
const NEW_THRESHOLD_HOURS =
  process.env.NEW_THRESHOLD_HOURS && Number(process.env.NEW_THRESHOLD_HOURS) > 0
    ? Number(process.env.NEW_THRESHOLD_HOURS)
    : 48;

/**
 * フロントエンドが期待する ArticleSummary 相当の型。
 * （backend 側でも明示しておく）
 */
interface ArticleSummary {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
  summaryText: string;
  isNew: boolean;
}

interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}

/**
 * API Gateway HTTP API から呼ばれる想定の Lambda ハンドラ。
 * 型依存を減らすため、event は any で受けつつ必要な部分だけ読む。
 */
export const handler = async (event: any) => {
  if (!TABLE_NAME) {
    console.error("ARTICLES_TABLE_NAME is not set");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Server configuration error" }),
    };
  }

  const groupId: string | undefined =
    event?.pathParameters?.groupId ?? event?.queryStringParameters?.groupId;

  if (!groupId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "groupId is required" }),
    };
  }

  const repo = new DynamoDbArticleRepository({
    tableName: TABLE_NAME,
  });

  let articles: ArticleDetail[] = [];
  try {
    // ひとまず最新 50 件程度に絞る
    articles = await repo.listByGroup(groupId, { limit: 50 });
  } catch (err) {
    console.error("[getGroupArticlesHandler] Failed to list articles:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to fetch articles" }),
    };
  }

  const summaries: ArticleSummary[] = articles.map((a) => {
    const normalizedPublishedAt = normalizePublishedAt(a.publishedAt) ?? a.publishedAt;

    return {
      id: a.id,
      companyId: a.companyId,
      companyName: a.companyName,
      title: a.title,
      url: a.url,
      publishedAt: normalizedPublishedAt,
      summaryText: a.summaryText,
      isNew: isNewWithinHours(normalizedPublishedAt, NEW_THRESHOLD_HOURS),
    };
  });

  const response: GetGroupArticlesResponse = {
    groupId,
    articles: summaries,
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // CORS 対応（必要に応じて調整）
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(response),
  };
};

/**
 * 公開から一定時間以内を新着とみなす簡易判定。
 * publishedAt が不正や未来の場合は false。
 */
export function isNewWithinHours(
  publishedAt: string | undefined,
  hours: number
): boolean {
  if (!publishedAt) return false;
  const publishedTime = new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedTime)) return false;

  const now = Date.now();
  if (publishedTime > now) return false;

  const diffMs = now - publishedTime;
  return diffMs <= hours * 60 * 60 * 1000;
}

//------------------------------------------------------------------------------
// helperBox: このファイル内でのみ使用するユーティリティ
//------------------------------------------------------------------------------
function normalizePublishedAt(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  const ja = parsePublishedAtToIso(raw);
  if (ja) return ja;

  return undefined;
}
