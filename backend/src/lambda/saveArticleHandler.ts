import type { ArticleDetail, GlossaryItem } from "../domain/articleStorage.js";
import { generateArticleIdFromUrl } from "../domain/articleStorage.js";
import { DynamoDbArticleRepository } from "../repository/dynamoArticleRepository.js";
import type { ArticleRepository } from "../repository/articleRepository.js";

const TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

interface SaveArticleRequestBody {
  groupId: string;
  companyId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
  summaryText: string;
  glossary?: GlossaryItem[];
}

interface SaveArticleResponseBody {
  articleId: string;
  groupId: string;
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseGlossary(raw: unknown): GlossaryItem[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;

  const parsed: GlossaryItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const { term, reading, description } = item as GlossaryItem;

    if (!isNonEmptyString(term) || !isNonEmptyString(description)) {
      return null;
    }

    if (
      reading !== undefined &&
      reading !== null &&
      typeof reading !== "string"
    ) {
      return null;
    }

    parsed.push({
      term: term.trim(),
      description: description.trim(),
      reading:
        reading === undefined || reading === null ? undefined : reading.trim(),
    });
  }

  return parsed;
}

function validateRequestBody(
  raw: any
): { ok: true; value: ArticleDetail } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      message: "リクエストボディは JSON オブジェクトである必要があります。",
    };
  }

  const {
    groupId,
    companyId,
    companyName,
    title,
    url,
    publishedAt,
    summaryText,
    glossary,
  } = raw as SaveArticleRequestBody;

  const requiredFields: Array<[string, unknown]> = [
    ["groupId", groupId],
    ["companyId", companyId],
    ["companyName", companyName],
    ["title", title],
    ["url", url],
    ["publishedAt", publishedAt],
    ["summaryText", summaryText],
  ];

  for (const [key, value] of requiredFields) {
    if (!isNonEmptyString(value)) {
      return { ok: false, message: `${key} は必須です。` };
    }
  }

  const parsedGlossary = parseGlossary(glossary);
  if (parsedGlossary === null) {
    return { ok: false, message: "glossary の形式が不正です。" };
  }

  const articleId = generateArticleIdFromUrl(url.trim());

  const article: ArticleDetail = {
    id: articleId,
    groupId: groupId.trim(),
    companyId: companyId.trim(),
    companyName: companyName.trim(),
    title: title.trim(),
    url: url.trim(),
    publishedAt: publishedAt.trim(),
    summaryText: summaryText.trim(),
    glossary: parsedGlossary,
  };

  return { ok: true, value: article };
}

export const handler = async (event: any) => {
  if (!TABLE_NAME) {
    console.error("ARTICLES_TABLE_NAME is not set");
    return jsonResponse(500, { message: "Server configuration error" });
  }

  const repo = new DynamoDbArticleRepository({ tableName: TABLE_NAME });
  return handleSaveArticle(event, repo);
};

export async function handleSaveArticle(event: any, repo: ArticleRepository) {
  const method = event?.httpMethod ?? event?.requestContext?.http?.method;
  if (method && method.toUpperCase() !== "POST") {
    console.warn("[saveArticleHandler] method not allowed:", method);
    return jsonResponse(405, { message: "Method Not Allowed" });
  }

  if (!event?.body) {
    console.warn("[saveArticleHandler] missing body");
    return jsonResponse(400, { message: "リクエストボディがありません。" });
  }

  let parsed: unknown;
  try {
    parsed =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    console.error("[saveArticleHandler] JSON parse error:", error);
    return jsonResponse(400, {
      message: "リクエストボディの JSON パースに失敗しました。",
    });
  }

  const validation = validateRequestBody(parsed);
  if (!validation.ok) {
    console.warn("[saveArticleHandler] validation failed:", validation.message);
    return jsonResponse(400, { message: validation.message });
  }

  try {
    await repo.put(validation.value);
  } catch (error) {
    console.error("[saveArticleHandler] failed to save article:", error);
    return jsonResponse(500, { message: "記事の保存に失敗しました。" });
  }

  const responseBody: SaveArticleResponseBody = {
    articleId: validation.value.id,
    groupId: validation.value.groupId,
  };

  return jsonResponse(200, responseBody);
}
