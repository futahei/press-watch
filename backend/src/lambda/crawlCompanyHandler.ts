import type { CompanyConfig } from "../domain/models.js";
import { crawlCompanySimpleList } from "../infra/simpleListCrawler.js";

// 暫定の会社設定（後で管理画面や設定ファイルから取得する想定）
const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  "example-corp": {
    id: "example-corp",
    name: "Example Corp.",
    pressReleaseUrl: "https://example.com/press",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "ul.press > li",
      titleSelector: "a.title",
      urlSelector: "a.title",
      dateSelector: ".date",
      maxItems: 10,
    },
  },
};

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
  const companyId: string | undefined =
    event?.pathParameters?.companyId ?? event?.queryStringParameters?.companyId;

  if (!companyId) {
    return jsonResponse(400, { message: "companyId is required" });
  }

  const company = COMPANY_CONFIGS[companyId];
  if (!company) {
    return jsonResponse(404, { message: "company not found" });
  }

  try {
    const articles = await crawlCompanySimpleList(company);
    return jsonResponse(200, {
      companyId,
      articles,
    });
  } catch (error) {
    console.error("[crawlCompanyHandler] failed:", error);
    return jsonResponse(500, { message: "Failed to crawl company" });
  }
};
