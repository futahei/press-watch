import type { CompanyConfig } from "../domain/models.js";

/**
 * 暫定のクロール対象企業設定。
 * - 本番では設定管理に移行する想定。
 */
export const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  "example-corp": {
    id: "example-corp",
    name: "Example Corp.",
    pressReleaseUrl: "https://example.com/press",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "ul.press > li",
      titleSelector: "a.title",
      urlSelector: "a.title",
      dateSelector: ".date",
      maxItems: 10,
    },
  },
  // 実ページ例: シックス・アパートのニュース一覧（構造変化の可能性あり）
  "six-apart": {
    id: "six-apart",
    name: "Six Apart",
    pressReleaseUrl: "https://www.sixapart.jp/news/",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "ul.mt-news-list > li",
      titleSelector: "a",
      urlSelector: "a",
      dateSelector: "time",
      maxItems: 20,
    },
  },
};
