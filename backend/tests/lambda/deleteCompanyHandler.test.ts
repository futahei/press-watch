import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { handler as deleteCompanyHandler } from "../../src/lambda/deleteCompanyHandler.js";

const mockDelete = vi.fn();

vi.mock("../../src/repository/companyRepository.js", async () => {
  const actual = await vi.importActual<any>(
    "../../src/repository/companyRepository.js"
  );
  return {
    ...actual,
    DynamoDbCompanyRepository: vi.fn().mockImplementation(() => ({
      delete: mockDelete,
    })),
  };
});

describe("deleteCompanyHandler", () => {
  const env = process.env.COMPANIES_TABLE_NAME;
  beforeAll(() => {
    process.env.COMPANIES_TABLE_NAME = "PressWatchCompanies";
  });
  afterAll(() => {
    process.env.COMPANIES_TABLE_NAME = env;
  });

  it("returns 400 when id missing", async () => {
    const res = await deleteCompanyHandler({});
    expect(res.statusCode).toBe(400);
  });

  it("deletes company", async () => {
    const res = await deleteCompanyHandler({
      pathParameters: { companyId: "c1" },
      httpMethod: "DELETE",
    });
    expect(res.statusCode).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith("c1");
  });
});
