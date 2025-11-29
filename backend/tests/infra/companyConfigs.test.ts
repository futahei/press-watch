import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { COMPANY_CONFIGS } from "../../src/infra/companyConfigs.js";
import { extractSimpleListArticles } from "../../src/infra/htmlListExtractor.js";

describe("COMPANY_CONFIGS", () => {
  it("six-apart のセレクタで記事が抽出できる", () => {
    const html = readFileSync("tests/fixtures/sixapart-news.html", "utf8");
    const config = COMPANY_CONFIGS["six-apart"];

    const items = extractSimpleListArticles({
      html,
      baseUrl: config.pressReleaseUrl,
      config: config.crawlConfig,
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "Six Apart 21周年を迎えました！",
      url: "https://www.sixapart.jp/news/2024/12/02-1400.html",
      publishedAt: "2024年 12月 2日（月）",
    });
  });
});
