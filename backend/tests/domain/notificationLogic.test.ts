import { describe, it, expect } from "vitest";
import type { ArticleSummary } from "../../src/domain/models.js";
import { decideArticlesToNotify } from "../../src/domain/notificationLogic.js";

const article = (overrides: Partial<ArticleSummary>): ArticleSummary => {
  return {
    id: overrides.id ?? "a1",
    companyName: overrides.companyName ?? "Example",
    title: overrides.title ?? "title",
    url: overrides.url ?? "https://example.com/a1",
    publishedAt: overrides.publishedAt,
    summaryText: overrides.summaryText,
    isNew: overrides.isNew,
  };
};

describe("decideArticlesToNotify", () => {
  it("lastNotifiedAt が null の場合は、すべての記事を新しい順に通知対象とする", () => {
    const lastNotifiedAt: string | null = null;
    const articles: ArticleSummary[] = [
      article({
        id: "old",
        publishedAt: "2024-01-01T00:00:00Z",
        title: "Old",
      }),
      article({
        id: "new",
        publishedAt: "2024-02-01T00:00:00Z",
        title: "New",
      }),
    ];

    const { toNotify, nextLastNotifiedAt } = decideArticlesToNotify(
      lastNotifiedAt,
      articles,
      10
    );

    expect(toNotify.map((a) => a.id)).toEqual(["new", "old"]);
    expect(nextLastNotifiedAt).toBe("2024-02-01T00:00:00Z");
  });

  it("lastNotifiedAt より古い記事は通知しない", () => {
    const lastNotifiedAt = "2024-01-15T00:00:00Z";
    const articles: ArticleSummary[] = [
      article({
        id: "old",
        publishedAt: "2024-01-10T00:00:00Z",
        title: "Old",
      }),
      article({
        id: "new",
        publishedAt: "2024-01-20T00:00:00Z",
        title: "New",
      }),
    ];

    const { toNotify, nextLastNotifiedAt } = decideArticlesToNotify(
      lastNotifiedAt,
      articles,
      10
    );

    expect(toNotify.map((a) => a.id)).toEqual(["new"]);
    expect(nextLastNotifiedAt).toBe("2024-01-20T00:00:00Z");
  });

  it("maxPerRun より多い場合は、新しいものから maxPerRun 件だけ通知する", () => {
    const lastNotifiedAt: string | null = null;
    const articles: ArticleSummary[] = [
      article({
        id: "a1",
        publishedAt: "2024-01-01T00:00:00Z",
      }),
      article({
        id: "a2",
        publishedAt: "2024-02-01T00:00:00Z",
      }),
      article({
        id: "a3",
        publishedAt: "2024-03-01T00:00:00Z",
      }),
    ];

    const { toNotify, nextLastNotifiedAt } = decideArticlesToNotify(
      lastNotifiedAt,
      articles,
      2
    );

    expect(toNotify.map((a) => a.id)).toEqual(["a3", "a2"]);
    expect(nextLastNotifiedAt).toBe("2024-03-01T00:00:00Z");
  });

  it("すべての publishedAt が lastNotifiedAt 以下の場合、何も通知せず nextLastNotifiedAt は元のまま", () => {
    const lastNotifiedAt = "2024-03-01T00:00:00Z";
    const articles: ArticleSummary[] = [
      article({
        id: "a1",
        publishedAt: "2024-01-01T00:00:00Z",
      }),
      article({
        id: "a2",
        publishedAt: "2024-02-01T00:00:00Z",
      }),
    ];

    const { toNotify, nextLastNotifiedAt } = decideArticlesToNotify(
      lastNotifiedAt,
      articles,
      10
    );

    expect(toNotify).toEqual([]);
    expect(nextLastNotifiedAt).toBe(lastNotifiedAt);
  });

  it("publishedAt が undefined の記事は、原則通知対象外とする", () => {
    const lastNotifiedAt: string | null = null;
    const articles: ArticleSummary[] = [
      article({
        id: "with-date",
        publishedAt: "2024-02-01T00:00:00Z",
      }),
      article({
        id: "without-date",
        publishedAt: undefined,
      }),
    ];

    const { toNotify, nextLastNotifiedAt } = decideArticlesToNotify(
      lastNotifiedAt,
      articles,
      10
    );

    expect(toNotify.map((a) => a.id)).toEqual(["with-date"]);
    expect(nextLastNotifiedAt).toBe("2024-02-01T00:00:00Z");
  });
});
