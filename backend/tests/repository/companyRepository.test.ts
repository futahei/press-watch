import { describe, it, expect } from "vitest";
import { DynamoDbCompanyRepository } from "../../src/repository/companyRepository.js";
import type { CompanyConfig } from "../../src/domain/models.js";

describe("DynamoDbCompanyRepository", () => {
  const sample: CompanyConfig = {
    id: "sample",
    name: "Sample Corp",
    pressReleaseUrl: "https://example.com/news",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "li",
      titleSelector: "a",
      urlSelector: "a",
      dateSelector: "time",
    },
  };

  it("put and getById work with fake client", async () => {
    const store: Record<string, CompanyConfig> = {};
    const fakeClient: any = {
      put: ({ Item }: any) => ({
        promise: async () => {
          store[Item.id] = Item;
          return {};
        },
      }),
      get: ({ Key }: any) => ({
        promise: async () => ({ Item: store[Key.id] }),
      }),
      scan: () => ({
        promise: async () => ({ Items: Object.values(store) }),
      }),
    };

    const repo = new DynamoDbCompanyRepository({
      tableName: "PressWatchCompanies",
      client: fakeClient,
    });

    await repo.put(sample);
    const found = await repo.getById("sample");

    expect(found?.name).toBe("Sample Corp");
    expect(await repo.list()).toHaveLength(1);
  });
});
