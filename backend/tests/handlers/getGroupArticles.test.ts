import { describe, it, expect } from "vitest";
import { getGroupArticles } from "../../src/handlers/getGroupArticles.js";
import type { GetGroupArticlesResponse } from "../../src/domain/models.js";

describe("getGroupArticles", () => {
  it("指定したグループIDに対応する記事一覧を返す", async () => {
    const groupId = "default";

    const result: GetGroupArticlesResponse = await getGroupArticles(groupId);

    expect(result.groupId).toBe(groupId);
    expect(result.articles.length).toBeGreaterThan(0);

    const first = result.articles[0];

    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("companyName");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("url");
  });

  it("定義されていないグループIDの場合は空配列を返す", async () => {
    const groupId = "unknown-group";

    const result: GetGroupArticlesResponse = await getGroupArticles(groupId);

    expect(result.groupId).toBe(groupId);
    expect(result.articles).toEqual([]);
  });
});
