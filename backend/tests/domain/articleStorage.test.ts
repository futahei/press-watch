import { describe, it, expect } from "vitest";
import {
  buildArticlePk,
  buildArticleSk,
  toArticleRecord,
  toArticleDetail,
  toArticleSummary,
  type ArticleDetail,
} from "../../src/domain/articleStorage.js";

describe("articleStorage mapping", () => {
  it("buildArticlePk should build group-based pk", () => {
    expect(buildArticlePk("default")).toBe("GROUP#default");
    expect(buildArticlePk("manufacturing")).toBe("GROUP#manufacturing");
  });

  it("buildArticleSk should build composite sk from publishedAt and articleId", () => {
    const sk = buildArticleSk("2025-11-01T09:00:00Z", "a1");
    expect(sk).toBe("PUBLISHED#2025-11-01T09:00:00Z#ARTICLE#a1");
  });

  it("toArticleRecord and toArticleDetail should round-trip", () => {
    const detail: ArticleDetail = {
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
          term: "SaaS",
          reading: "サース",
          description: "Software as a Service の略。",
        },
      ],
    };

    const createdAt = "2025-11-01T10:00:00Z";
    const updatedAt = "2025-11-01T10:00:00Z";

    const record = toArticleRecord({
      article: detail,
      createdAt,
      updatedAt,
    });

    expect(record.pk).toBe("GROUP#default");
    expect(record.sk).toBe("PUBLISHED#2025-11-01T09:00:00Z#ARTICLE#a1");
    expect(record.articleId).toBe("a1");
    expect(record.groupId).toBe("default");
    expect(record.companyId).toBe("company-1");

    const roundTripped = toArticleDetail(record);

    expect(roundTripped).toEqual(detail);
  });

  it("toArticleSummary should drop glossary", () => {
    const detail: ArticleDetail = {
      id: "a2",
      groupId: "default",
      companyId: "company-1",
      companyName: "Example Corp.",
      title: "環境対応型生産ラインの拡張について",
      url: "https://example.com/press/a2",
      publishedAt: "2025-10-20T03:00:00Z",
      summaryText: "環境対応型生産ラインの拡張計画を発表しました。",
      glossary: [
        {
          term: "CO2",
          description: "二酸化炭素。",
        },
      ],
    };

    const summary = toArticleSummary(detail);

    expect(summary).toEqual({
      id: "a2",
      groupId: "default",
      companyId: "company-1",
      companyName: "Example Corp.",
      title: "環境対応型生産ラインの拡張について",
      url: "https://example.com/press/a2",
      publishedAt: "2025-10-20T03:00:00Z",
      summaryText: "環境対応型生産ラインの拡張計画を発表しました。",
    });
  });
});
