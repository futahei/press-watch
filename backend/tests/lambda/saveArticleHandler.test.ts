import { describe, it, expect } from "vitest";
import type { ArticleDetail } from "../../src/domain/articleStorage.js";
import { generateArticleIdFromUrl } from "../../src/domain/articleStorage.js";
import type { ArticleRepository } from "../../src/repository/articleRepository.js";
import { handleSaveArticle } from "../../src/lambda/saveArticleHandler.js";

class FakeArticleRepository implements ArticleRepository {
  public saved: ArticleDetail | null = null;

  async listByGroup(): Promise<ArticleDetail[]> {
    return [];
  }

  async put(article: ArticleDetail): Promise<void> {
    this.saved = article;
  }
}

describe("saveArticleHandler.handleSaveArticle", () => {
  it("should return 400 when body is missing", async () => {
    const repo = new FakeArticleRepository();

    const res = await handleSaveArticle({ httpMethod: "POST" }, repo);

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("リクエストボディ");
  });

  it("should return 400 when required fields are missing", async () => {
    const repo = new FakeArticleRepository();

    const res = await handleSaveArticle(
      {
        httpMethod: "POST",
        body: JSON.stringify({
          // summaryText がない
          groupId: "default",
          companyId: "c1",
          companyName: "Example Corp.",
          title: "タイトル",
          url: "https://example.com/press/a1",
          publishedAt: "2025-11-01T09:00:00Z",
        }),
      },
      repo
    );

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("summaryText");
    expect(repo.saved).toBeNull();
  });

  it("should save article and return 200 when input is valid", async () => {
    const repo = new FakeArticleRepository();
    const url = "https://example.com/press/a1";
    const expectedId = generateArticleIdFromUrl(url);

    const res = await handleSaveArticle(
      {
        httpMethod: "POST",
        body: JSON.stringify({
          groupId: "default",
          companyId: "c1",
          companyName: "Example Corp.",
          title: "新製品リリースのお知らせ",
          url,
          publishedAt: "2025-11-01T09:00:00Z",
          summaryText: "要約テキスト",
          glossary: [
            {
              term: "PressWatch",
              reading: "プレスウォッチ",
              description: "プレスリリース要約サービス。",
            },
          ],
        }),
      },
      repo
    );

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.articleId).toBe(expectedId);
    expect(body.groupId).toBe("default");

    expect(repo.saved).not.toBeNull();
    expect(repo.saved?.id).toBe(expectedId);
    expect(repo.saved?.glossary[0].reading).toBe("プレスウォッチ");
  });
});
