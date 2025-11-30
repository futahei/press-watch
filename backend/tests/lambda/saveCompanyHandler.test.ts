import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { handler as saveCompanyHandler } from "../../src/lambda/saveCompanyHandler.js";

const mockPut = vi.fn();

vi.mock("../../src/repository/companyRepository.js", async () => {
  const actual = await vi.importActual<any>(
    "../../src/repository/companyRepository.js"
  );
  return {
    ...actual,
    DynamoDbCompanyRepository: vi.fn().mockImplementation(() => ({
      put: mockPut,
    })),
  };
});

describe("saveCompanyHandler", () => {
  const env = process.env.COMPANIES_TABLE_NAME;
  beforeAll(() => {
    process.env.COMPANIES_TABLE_NAME = "PressWatchCompanies";
  });
  afterAll(() => {
    process.env.COMPANIES_TABLE_NAME = env;
  });

  it("returns 400 when body missing", async () => {
    const res = await saveCompanyHandler({ body: undefined });
    expect(res.statusCode).toBe(400);
  });

  it("saves valid company", async () => {
    const res = await saveCompanyHandler({
      body: JSON.stringify({
        id: "new-co",
        name: "New Co",
        pressReleaseUrl: "https://example.com/pr",
        crawlConfig: {
          type: "simpleList",
          itemSelector: "li",
          titleSelector: "a",
          urlSelector: "a",
        },
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(mockPut).toHaveBeenCalledOnce();
  });
});
