import { describe, it, expect } from "vitest";
import {
  ExistingArticleRecord,
  CrawledArticleSnapshot,
  NewArticleCandidate,
} from "../../src/domain/models.js";
import { detectNewArticles } from "../../src/domain/articleLogic.js";

describe("detectNewArticles", () => {
  const existing = (urls: string[]): ExistingArticleRecord[] =>
    urls.map((url) => ({ url }));

  const crawled = (
    items: Array<{ url: string; title: string; publishedAt?: string }>
  ): CrawledArticleSnapshot[] =>
    items.map((item) => ({
      url: item.url,
      title: item.title,
      publishedAt: item.publishedAt,
    }));

  it("既存記事がない場合は、クロールした記事をすべて新規として返す", () => {
    const existingArticles: ExistingArticleRecord[] = [];
    const crawledArticles = crawled([
      { url: "https://example.com/a", title: "A" },
      { url: "https://example.com/b", title: "B" },
    ]);

    const result = detectNewArticles(existingArticles, crawledArticles);

    const urls = result.map((r) => r.url);
    expect(urls).toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("既に存在するURLは新規として返さない", () => {
    const existingArticles = existing(["https://example.com/a"]);
    const crawledArticles = crawled([
      { url: "https://example.com/a", title: "A" },
      { url: "https://example.com/b", title: "B" },
    ]);

    const result = detectNewArticles(existingArticles, crawledArticles);

    const urls = result.map((r) => r.url);
    expect(urls).toEqual(["https://example.com/b"]);
  });

  it("クロール結果内に同じURLが重複していても、1件として扱う", () => {
    const existingArticles: ExistingArticleRecord[] = [];
    const crawledArticles = crawled([
      { url: "https://example.com/a", title: "A-1" },
      { url: "https://example.com/a", title: "A-2" }, // 同じURLの重複
    ]);

    const result = detectNewArticles(existingArticles, crawledArticles);

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com/a");
    // どちらのタイトルを採用するかは仕様次第だが、
    // ここでは「最初に登場したもの」を採用する想定とする。
    expect(result[0].title).toBe("A-1");
  });

  it("publishedAt がある場合は、新しいものから順に並ぶ", () => {
    const existingArticles: ExistingArticleRecord[] = [];
    const crawledArticles = crawled([
      {
        url: "https://example.com/old",
        title: "Old",
        publishedAt: "2024-01-01T00:00:00Z",
      },
      {
        url: "https://example.com/new",
        title: "New",
        publishedAt: "2024-02-01T00:00:00Z",
      },
    ]);

    const result = detectNewArticles(existingArticles, crawledArticles);

    expect(result.map((r) => r.url)).toEqual([
      "https://example.com/new",
      "https://example.com/old",
    ]);
  });

  it("publishedAt がない記事は、publishedAt がある記事のあとに並ぶ", () => {
    const existingArticles: ExistingArticleRecord[] = [];
    const crawledArticles = crawled([
      {
        url: "https://example.com/with-date",
        title: "With date",
        publishedAt: "2024-02-01T00:00:00Z",
      },
      {
        url: "https://example.com/without-date",
        title: "Without date",
      },
    ]);

    const result: NewArticleCandidate[] = detectNewArticles(
      existingArticles,
      crawledArticles
    );

    expect(result.map((r) => r.url)).toEqual([
      "https://example.com/with-date",
      "https://example.com/without-date",
    ]);
  });
});
