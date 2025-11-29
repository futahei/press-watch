import { describe, it, expect, vi } from "vitest";
import { saveSummarizedArticle } from "../../src/application/saveSummarizedArticle.js";
import type { ArticleRepository } from "../../src/repository/articleRepository.js";
import type { ArticleDetail } from "../../src/domain/articleStorage.js";

class FakeArticleRepository implements ArticleRepository {
  public saved: ArticleDetail | null = null;

  async listByGroup(): Promise<ArticleDetail[]> {
    return [];
  }

  async put(article: ArticleDetail): Promise<void> {
    this.saved = article;
  }

  async getByGroupAndId(): Promise<ArticleDetail | null> {
    return null;
  }
}

describe("saveSummarizedArticle", () => {
  it("should generate articleId from URL and save article via repository", async () => {
    const repo = new FakeArticleRepository();
    const spy = vi.spyOn(repo, "put");

    const result = await saveSummarizedArticle(
      {
        groupId: "default",
        companyId: "c1",
        companyName: "Example Corp.",
        title: "新製品リリースのお知らせ",
        url: "https://example.com/press/a1",
        publishedAt: "2025-11-01T09:00:00Z",
        summary: {
          summaryText: "要約テキスト",
          glossary: [
            {
              term: "PressWatch",
              reading: "プレスウォッチ",
              description: "プレスリリース要約サービス。",
            },
          ],
        },
      },
      repo
    );

    expect(result.articleId).toMatch(/^url_[0-9a-f]{24}$/);
    expect(repo.saved).not.toBeNull();
    expect(repo.saved?.id).toBe(result.articleId);
    expect(repo.saved?.glossary[0].reading).toBe("プレスウォッチ");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
