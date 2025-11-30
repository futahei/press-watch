import { crawlCompanySimpleList } from "../infra/simpleListCrawler.js";
import { COMPANY_CONFIGS } from "../infra/companyConfigs.js";
import { DynamoDbCompanyRepository } from "../repository/companyRepository.js";
import type { CompanyConfig } from "../domain/models.js";

const COMPANIES_TABLE_NAME = process.env.COMPANIES_TABLE_NAME;

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

  let company: CompanyConfig | undefined = COMPANY_CONFIGS[companyId];

  if (!company && COMPANIES_TABLE_NAME) {
    const repo = new DynamoDbCompanyRepository({
      tableName: COMPANIES_TABLE_NAME,
    });
    const found = await repo.getById(companyId);
    company = found || undefined;
  }

  if (!company) {
    return jsonResponse(404, { message: "company not found" });
  }

  const targetCompany: CompanyConfig = company;

  try {
    const articles = await crawlCompanySimpleList(targetCompany);
    return jsonResponse(200, {
      companyId,
      articles,
    });
  } catch (error) {
    console.error("[crawlCompanyHandler] failed:", error);
    return jsonResponse(500, { message: "Failed to crawl company" });
  }
};
