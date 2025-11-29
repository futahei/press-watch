import { DynamoDbArticleRepository } from "../repository/dynamoArticleRepository.js";
import type { ArticleRepository } from "../repository/articleRepository.js";

const TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

interface ArticleDetailResponse {
  id: string;
  groupId: string;
  companyId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
  summaryText: string;
  glossary: {
    term: string;
    reading?: string;
    description: string;
  }[];
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

export const handler = async (event: any) => {
  if (!TABLE_NAME) {
    console.error("ARTICLES_TABLE_NAME is not set");
    return jsonResponse(500, { message: "Server configuration error" });
  }

  const repo = new DynamoDbArticleRepository({ tableName: TABLE_NAME });
  return handleGetArticleDetail(event, repo);
};

export async function handleGetArticleDetail(
  event: any,
  repo: ArticleRepository
) {
  const method = event?.httpMethod ?? event?.requestContext?.http?.method;
  if (method && method.toUpperCase() !== "GET") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }

  const groupId =
    event?.pathParameters?.groupId ?? event?.queryStringParameters?.groupId;
  const articleId =
    event?.pathParameters?.articleId ?? event?.queryStringParameters?.articleId;

  if (!groupId || !articleId) {
    return jsonResponse(400, { message: "groupId と articleId は必須です。" });
  }

  try {
    const article = await repo.getByGroupAndId(groupId, articleId);
    if (!article) {
      return jsonResponse(404, { message: "記事が見つかりませんでした。" });
    }

    const response: ArticleDetailResponse = {
      id: article.id,
      groupId: article.groupId,
      companyId: article.companyId,
      companyName: article.companyName,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      summaryText: article.summaryText,
      glossary: article.glossary ?? [],
    };

    return jsonResponse(200, response);
  } catch (error) {
    console.error("[getArticleDetailHandler] failed to fetch article:", error);
    return jsonResponse(500, { message: "記事の取得に失敗しました。" });
  }
}
