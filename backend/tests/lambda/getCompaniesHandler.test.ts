import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { handler as getCompaniesHandler } from "../../src/lambda/getCompaniesHandler.js";
import type { DynamoDbCompanyRepository } from "../../src/repository/companyRepository.js";

vi.mock("../../src/repository/companyRepository.js", async () => {
  const actual = await vi.importActual<any>(
    "../../src/repository/companyRepository.js"
  );
  return {
    ...actual,
    DynamoDbCompanyRepository: vi.fn().mockImplementation(() => ({
      list: vi.fn(async () => [
        {
          id: "db-company",
          name: "DB Company",
          pressReleaseUrl: "https://example.com/db",
          crawlConfig: {
            type: "simpleList",
            itemSelector: "li",
            titleSelector: "a",
            urlSelector: "a",
          },
        },
      ]),
      getById: vi.fn(async (id: string) =>
        id === "db-company"
          ? {
              id: "db-company",
              name: "DB Company",
              pressReleaseUrl: "https://example.com/db",
              crawlConfig: {
                type: "simpleList",
                itemSelector: "li",
                titleSelector: "a",
                urlSelector: "a",
              },
            }
          : null
      ),
    })),
  };
});

describe("getCompaniesHandler", () => {
  const env = process.env.COMPANIES_TABLE_NAME;
  beforeAll(() => {
    process.env.COMPANIES_TABLE_NAME = "PressWatchCompanies";
  });
  afterAll(() => {
    process.env.COMPANIES_TABLE_NAME = env;
  });

  it("returns list including defaults", async () => {
    const res = await getCompaniesHandler({
      pathParameters: null,
    });
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.companies.length).toBeGreaterThan(1); // includes hardcoded defaults
  });

  it("returns single company", async () => {
    const res = await getCompaniesHandler({
      pathParameters: { companyId: "db-company" },
    });
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.id).toBe("db-company");
  });
});
