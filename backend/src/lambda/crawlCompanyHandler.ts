import { crawlCompanySimpleList } from "../infra/simpleListCrawler.js";
import { COMPANY_CONFIGS } from "../infra/companyConfigs.js";

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
