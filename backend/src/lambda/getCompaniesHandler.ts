import { DynamoDbCompanyRepository } from "../repository/companyRepository.js";
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
  const tableName = process.env.COMPANIES_TABLE_NAME;
  if (!tableName) {
    console.error("COMPANIES_TABLE_NAME is not set");
    return jsonResponse(500, { message: "Server configuration error" });
  }

  const companyId: string | undefined =
    event?.pathParameters?.companyId ?? event?.queryStringParameters?.companyId;

  const repo = new DynamoDbCompanyRepository({ tableName });

  if (companyId) {
    const found = (await repo.getById(companyId)) ?? COMPANY_CONFIGS[companyId];
    if (!found) {
      return jsonResponse(404, { message: "company not found" });
    }
    return jsonResponse(200, found);
  }

  const list = await repo.list();
  // 既定ハードコード分も補完する（DBと重複しないもののみ）
  const merged = [
    ...list,
    ...Object.values(COMPANY_CONFIGS).filter(
      (c) => !list.find((x) => x.id === c.id)
    ),
  ];

  return jsonResponse(200, { companies: merged });
};
