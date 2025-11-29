import { describe, it, expect, vi } from "vitest";
import { crawlCompanySimpleList } from "../../src/infra/simpleListCrawler.js";
import type { CompanyConfig } from "../../src/domain/models.js";

const company: CompanyConfig = {
  id: "c1",
  name: "Example Corp.",
  pressReleaseUrl: "https://example.com/press",
  crawlConfig: {
    type: "simpleList",
    itemSelector: "ul.press > li",
    titleSelector: "a.title",
    urlSelector: "a.title",
    dateSelector: ".date",
  },
};

const html = `
<ul class="press">
  <li>
    <a class="title" href="/a1">記事1</a>
    <span class="date">2025-11-28T09:00:00Z</span>
  </li>
  <li>
    <a class="title" href="https://example.com/a2">記事2</a>
    <span class="date">2025-11-20T09:00:00Z</span>
  </li>
</ul>
`;

describe("crawlCompanySimpleList", () => {
  it("fetches and extracts articles", async () => {
    const mockHttp = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: html,
    }));

    const result = await crawlCompanySimpleList(company, { httpGet: mockHttp });

    expect(mockHttp).toHaveBeenCalledOnce();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: "記事1",
      url: "https://example.com/a1",
      publishedAt: "2025-11-28T09:00:00Z",
    });
  });

  it("throws on fetch failure", async () => {
    const mockHttp = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: "",
    }));

    await expect(
      crawlCompanySimpleList(company, { httpGet: mockHttp })
    ).rejects.toThrow("Failed to fetch press release page");
  });
});
