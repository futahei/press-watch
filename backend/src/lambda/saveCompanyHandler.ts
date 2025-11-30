import { DynamoDbCompanyRepository } from "../repository/companyRepository.js";
import type { CompanyConfig } from "../domain/models.js";

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

function validate(payload: any): { ok: boolean; message?: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "invalid body" };
  }
  const required = ["id", "name", "pressReleaseUrl", "crawlConfig"];
  for (const key of required) {
    if (!payload[key]) return { ok: false, message: `${key} is required` };
  }
  const crawl = payload.crawlConfig;
  const crawlKeys = ["itemSelector", "titleSelector", "urlSelector"];
  for (const key of crawlKeys) {
    if (!crawl?.[key])
      return { ok: false, message: `crawlConfig.${key} is required` };
  }
  return { ok: true };
}

export const handler = async (event: any) => {
  const tableName = process.env.COMPANIES_TABLE_NAME;
  if (!tableName) {
    console.error("COMPANIES_TABLE_NAME is not set");
    return jsonResponse(500, { message: "Server configuration error" });
  }

  const method = event?.httpMethod ?? event?.requestContext?.http?.method;
  if (method && method.toUpperCase() !== "POST") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }

  if (!event?.body) {
    return jsonResponse(400, { message: "body is required" });
  }

  let payload: CompanyConfig;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, { message: "invalid JSON body" });
  }

  const v = validate(payload);
  if (!v.ok) {
    return jsonResponse(400, { message: v.message });
  }

  const repo = new DynamoDbCompanyRepository({ tableName });
  await repo.put(payload);

  return jsonResponse(200, { id: payload.id });
};
