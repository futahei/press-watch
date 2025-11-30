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
      // Six Apart ニュース一覧のリスト構造
      itemSelector: ".entrylist ul > li",
      titleSelector: ".entrylist_title",
      urlSelector: "a",
      dateSelector: ".entrymeta_date",
      maxItems: 20,
    },
  },
  meidensha: {
    id: "meidensha",
    name: "明電舎",
    pressReleaseUrl: "https://www.meidensha.co.jp/news/news_01/news_01_01/",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "article.news-article",
      titleSelector: ".news-article__title",
      urlSelector: "a",
      dateSelector: "time.news-article__date",
      maxItems: 30,
    },
  },
  hitachi: {
    id: "hitachi",
    name: "日立製作所",
    pressReleaseUrl: "https://www.hitachi.co.jp/New/cnews/",
    crawlConfig: {
      type: "simpleList",
      itemSelector: ".news-list li",
      titleSelector: "a",
      urlSelector: "a",
      dateSelector: ".time, time",
      maxItems: 30,
    },
  },
  "mitsubishi-electric": {
    id: "mitsubishi-electric",
    name: "三菱電機",
    pressReleaseUrl: "https://www.mitsubishielectric.co.jp/ja/pr/",
    crawlConfig: {
      type: "simpleList",
      itemSelector: "ul.list-news li",
      titleSelector: "a",
      urlSelector: "a",
      dateSelector: ".date, time",
      maxItems: 30,
    },
  },
  toshiba: {
    id: "toshiba",
    name: "東芝",
    pressReleaseUrl: "https://www.global.toshiba/jp/news/corporate.html",
    crawlConfig: {
      type: "simpleList",
      itemSelector: ".tos-content-list ul li",
      titleSelector: ".tos-title, a",
      urlSelector: "a",
      dateSelector: ".tos-date, time",
      maxItems: 30,
    },
  },
  "fuji-electric": {
    id: "fuji-electric",
    name: "富士電機",
    pressReleaseUrl: "https://www.fujielectric.co.jp/about/news/index.html",
    crawlConfig: {
      type: "simpleList",
      itemSelector: ".bd-list01 li",
      titleSelector: "a",
      urlSelector: "a",
      dateSelector: "span",
      maxItems: 30,
    },
  },
};
