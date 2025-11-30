import { DynamoDbCompanyRepository } from "../repository/companyRepository.js";

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

  const method = event?.httpMethod ?? event?.requestContext?.http?.method;
  if (method && method.toUpperCase() !== "DELETE") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }

  const companyId: string | undefined =
    event?.pathParameters?.companyId ?? event?.queryStringParameters?.companyId;

  if (!companyId) {
    return jsonResponse(400, { message: "companyId is required" });
  }

  const repo = new DynamoDbCompanyRepository({ tableName });
  await repo.delete(companyId);

  return jsonResponse(200, { id: companyId, deleted: true });
};
