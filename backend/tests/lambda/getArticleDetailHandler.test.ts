import { describe, it, expect } from "vitest";
import type { ArticleDetail } from "../../src/domain/articleStorage.js";
import type { ArticleRepository } from "../../src/repository/articleRepository.js";
import { handleGetArticleDetail } from "../../src/lambda/getArticleDetailHandler.js";

class FakeArticleRepository implements ArticleRepository {
  constructor(private readonly articles: ArticleDetail[] = []) {}

  async listByGroup(): Promise<ArticleDetail[]> {
    return [];
  }

  async put(): Promise<void> {
    throw new Error("not implemented in fake");
  }

  async getByGroupAndId(
    groupId: string,
    articleId: string
  ): Promise<ArticleDetail | null> {
    return (
      this.articles.find((a) => a.groupId === groupId && a.id === articleId) ??
      null
    );
  }
}

const sampleArticle: ArticleDetail = {
  id: "a1",
  groupId: "default",
  companyId: "company-1",
  companyName: "Example Corp.",
  title: "新製品リリースのお知らせ",
  url: "https://example.com/press/a1",
  publishedAt: "2025-11-01T09:00:00Z",
  summaryText: "Example Corp. は新製品を発表しました。",
  glossary: [
    {
      term: "PressWatch",
      reading: "プレスウォッチ",
      description: "プレスリリース要約サービス。",
    },
  ],
};

describe("getArticleDetailHandler.handleGetArticleDetail", () => {
  it("should return 400 if params are missing", async () => {
    const repo = new FakeArticleRepository();
    const res = await handleGetArticleDetail({}, repo);
    expect(res.statusCode).toBe(400);
  });

  it("should return 404 when article is not found", async () => {
    const repo = new FakeArticleRepository([]);
    const res = await handleGetArticleDetail(
      {
        httpMethod: "GET",
        pathParameters: { groupId: "default", articleId: "missing" },
      },
      repo
    );
    expect(res.statusCode).toBe(404);
  });

  it("should return article detail when found", async () => {
    const repo = new FakeArticleRepository([sampleArticle]);
    const res = await handleGetArticleDetail(
      {
        httpMethod: "GET",
        pathParameters: { groupId: "default", articleId: "a1" },
      },
      repo
    );

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe("a1");
    expect(body.glossary[0].term).toBe("PressWatch");
  });
});
