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

    const toSave: ArticleDetail[] = snapshots.map((snap) => {
      // 取得した日付文字列（例: "2024年 12月 2日（月）"）を ISO 8601 に揃える
      const parsedPublishedAt = parsePublishedAtToIso(snap.publishedAt);

      return {
        id: generateArticleIdFromUrl(snap.url),
        groupId,
        companyId: company.id,
        companyName: company.name,
        title: snap.title,
        url: snap.url,
        publishedAt: parsedPublishedAt ?? new Date().toISOString(),
        summaryText: "要約は未生成です。",
        glossary: [],
      };
    });

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

//------------------------------------------------------------------------------
// helperBox: このファイル内でのみ使用するユーティリティ
//------------------------------------------------------------------------------
/**
 * 「2024年 12月 2日（月）」のような和暦風フォーマットを ISO 8601 に変換する。
 * - 変換できなければ undefined を返す。
 */
export function parsePublishedAtToIso(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const normalized = raw.replace(/[\u3000\s]+/g, "");
  const m = normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return undefined;

  const [, year, month, day] = m;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (!Number.isFinite(date.getTime())) return undefined;

  return date.toISOString();
}
