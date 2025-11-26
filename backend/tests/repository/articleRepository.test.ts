import { describe, it, expect } from "vitest";
import { buildGroupArticlesQueryInput } from "../../src/repository/articleRepository.js";

describe("buildGroupArticlesQueryInput", () => {
  it("should build query input for given groupId without limit", () => {
    const input = buildGroupArticlesQueryInput({
      tableName: "PressWatchArticles",
      groupId: "default",
    });

    expect(input).toEqual({
      TableName: "PressWatchArticles",
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": "GROUP#default",
        ":skPrefix": "PUBLISHED#",
      },
      ScanIndexForward: false,
    });
  });

  it("should include Limit when a positive finite limit is provided", () => {
    const input = buildGroupArticlesQueryInput({
      tableName: "PressWatchArticles",
      groupId: "manufacturing",
      limit: 20,
    });

    expect(input.TableName).toBe("PressWatchArticles");
    expect(input.ExpressionAttributeValues?.[":pk"]).toBe(
      "GROUP#manufacturing"
    );
    expect(input.Limit).toBe(20);
    expect(input.ScanIndexForward).toBe(false);
  });

  it("should ignore non-positive or invalid limit", () => {
    const inputZero = buildGroupArticlesQueryInput({
      tableName: "PressWatchArticles",
      groupId: "default",
      limit: 0,
    });

    const inputNegative = buildGroupArticlesQueryInput({
      tableName: "PressWatchArticles",
      groupId: "default",
      limit: -5,
    });

    expect(inputZero.Limit).toBeUndefined();
    expect(inputNegative.Limit).toBeUndefined();
  });
});
