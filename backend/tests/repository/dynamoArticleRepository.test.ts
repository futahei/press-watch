import { describe, it, expect } from "vitest";
import type { DynamoDbLikeClient } from "../../src/repository/dynamoArticleRepository.js";
import { DynamoDbArticleRepository } from "../../src/repository/dynamoArticleRepository.js";
import type { ArticleRecord } from "../../src/domain/articleStorage.js";

describe("DynamoDbArticleRepository", () => {
  it("listByGroup should query DynamoDB and map records to ArticleDetail", async () => {
    const capturedParams: any[] = [];

    const fakeItems: ArticleRecord[] = [
      {
        pk: "GROUP#default",
        sk: "PUBLISHED#2025-11-01T09:00:00Z#ARTICLE#a1",
        articleId: "a1",
        groupId: "default",
        companyId: "company-1",
        companyName: "Example Corp.",
        title: "新製品リリースのお知らせ",
        url: "https://example.com/press/a1",
        publishedAt: "2025-11-01T09:00:00Z",
        summaryText: "Example Corp. は新製品を発表しました。",
        glossary: [],
        createdAt: "2025-11-01T10:00:00Z",
        updatedAt: "2025-11-01T10:00:00Z",
      },
    ];

    const fakeClient: DynamoDbLikeClient = {
      query: (params: any) => {
        capturedParams.push(params);
        return {
          promise: async () => ({
            Items: fakeItems as any,
          }),
        };
      },
    };

    const repo = new DynamoDbArticleRepository({
      tableName: "PressWatchArticles",
      client: fakeClient,
    });

    const result = await repo.listByGroup("default", { limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "a1",
      groupId: "default",
      companyId: "company-1",
      companyName: "Example Corp.",
      title: "新製品リリースのお知らせ",
      url: "https://example.com/press/a1",
      publishedAt: "2025-11-01T09:00:00Z",
      summaryText: "Example Corp. は新製品を発表しました。",
    });

    // Query パラメータが groupId ベースの PK を使っていることをざっくり検証
    expect(capturedParams[0].TableName).toBe("PressWatchArticles");
    expect(capturedParams[0].ExpressionAttributeValues[":pk"]).toBe(
      "GROUP#default"
    );
    expect(capturedParams[0].Limit).toBe(10);
  });
});
