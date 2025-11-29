import { COMPANY_CONFIGS } from "../infra/companyConfigs.js";
import { crawlCompanySimpleList } from "../infra/simpleListCrawler.js";
import { DynamoDbArticleRepository } from "../repository/dynamoArticleRepository.js";
import { generateArticleIdFromUrl } from "../domain/articleStorage.js";
import type { ArticleDetail } from "../domain/articleStorage.js";

const TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

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

  const companyId: string | undefined =
    event?.pathParameters?.companyId ?? event?.queryStringParameters?.companyId;
  const groupId: string =
    event?.queryStringParameters?.groupId ??
    event?.pathParameters?.groupId ??
    "default";

  if (!companyId) {
    return jsonResponse(400, { message: "companyId is required" });
  }

  const company = COMPANY_CONFIGS[companyId];
  if (!company) {
    return jsonResponse(404, { message: "company not found" });
  }

  try {
    const snapshots = await crawlCompanySimpleList(company);
    const repo = new DynamoDbArticleRepository({ tableName: TABLE_NAME });

    const toSave: ArticleDetail[] = snapshots.map((snap) => ({
      id: generateArticleIdFromUrl(snap.url),
      groupId,
      companyId: company.id,
      companyName: company.name,
      title: snap.title,
      url: snap.url,
      // publishedAt が無い場合は現在時刻で埋める
      publishedAt: snap.publishedAt ?? new Date().toISOString(),
      summaryText: "要約は未生成です。",
      glossary: [],
    }));

    for (const article of toSave) {
      await repo.put(article);
    }

    return jsonResponse(200, {
      companyId,
      groupId,
      saved: toSave.length,
    });
  } catch (error) {
    console.error("[crawlAndSaveHandler] failed:", error);
    return jsonResponse(500, { message: "Failed to crawl and save" });
  }
};
