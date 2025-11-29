import { describe, it, expect } from "vitest";
import { extractSimpleListArticles } from "../../src/infra/htmlListExtractor.js";

const html = `
<html>
  <body>
    <ul class="press">
      <li>
        <a class="title" href="/press/a1">新製品リリース</a>
        <span class="date">2025-11-28T09:00:00Z</span>
      </li>
      <li>
        <a class="title" href="https://example.com/press/a2">サービス開始</a>
        <span class="date">2025-11-20T03:00:00Z</span>
      </li>
    </ul>
  </body>
</html>
`;

describe("extractSimpleListArticles", () => {
  it("should extract title, url, and publishedAt with relative URL resolved", () => {
    const result = extractSimpleListArticles({
      html,
      baseUrl: "https://example.com",
      config: {
        type: "simpleList",
        itemSelector: "ul.press > li",
        titleSelector: "a.title",
        urlSelector: "a.title",
        dateSelector: ".date",
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: "新製品リリース",
      url: "https://example.com/press/a1",
      publishedAt: "2025-11-28T09:00:00Z",
    });
    expect(result[1].url).toBe("https://example.com/press/a2");
  });

  it("should respect maxItems if specified", () => {
    const result = extractSimpleListArticles({
      html,
      baseUrl: "https://example.com",
      config: {
        type: "simpleList",
        itemSelector: "ul.press > li",
        titleSelector: "a.title",
        urlSelector: "a.title",
        dateSelector: ".date",
        maxItems: 1,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com/press/a1");
  });
});
