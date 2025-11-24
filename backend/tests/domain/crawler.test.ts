import { describe, it, expect } from "vitest";
import { crawlGroup } from "../../src/domain/crawler.js";
import type {
  CompanyConfig,
  CrawledArticleSnapshot,
  GroupConfig,
} from "../../src/domain/models.js";
import type { CompanyCrawler } from "../../src/domain/crawler.js";

const dummyCompany: CompanyConfig = {
  id: "c1",
  name: "Example Corp.",
  pressReleaseUrl: "https://example.com/press",
  crawlConfig: {
    type: "simpleList",
    itemSelector: "ul.press-list > li",
    titleSelector: "a",
    urlSelector: "a",
    dateSelector: ".date",
    timezone: "Asia/Tokyo",
    maxItems: 10,
  },
};

const dummyGroup: GroupConfig = {
  id: "g1",
  name: "デフォルトグループ",
  companyIds: ["c1"],
};

const dummyArticles: CrawledArticleSnapshot[] = [
  {
    url: "https://example.com/press/1",
    title: "リリース1",
    publishedAt: "2025-11-01T00:00:00Z",
  },
  {
    url: "https://example.com/press/2",
    title: "リリース2",
    publishedAt: "2025-11-02T00:00:00Z",
  },
];

const fakeCrawler: CompanyCrawler = {
  async crawlCompany(_config) {
    return dummyArticles;
  },
};

describe("crawlGroup", () => {
  it("グループに含まれる企業だけをクロールし、結果を集約して返す", async () => {
    const result = await crawlGroup(dummyGroup, [dummyCompany], fakeCrawler);

    expect(result.group.id).toBe("g1");
    expect(result.companySnapshots).toHaveLength(1);
    expect(result.companySnapshots[0].company.id).toBe("c1");
    expect(result.companySnapshots[0].articles).toEqual(dummyArticles);
  });

  it("group.companyIds に含まれない企業はクロールしない", async () => {
    const otherCompany: CompanyConfig = {
      ...dummyCompany,
      id: "c2",
      name: "Other Corp.",
    };

    const result = await crawlGroup(
      dummyGroup,
      [dummyCompany, otherCompany],
      fakeCrawler
    );

    expect(result.companySnapshots).toHaveLength(1);
    expect(result.companySnapshots[0].company.id).toBe("c1");
  });
});
