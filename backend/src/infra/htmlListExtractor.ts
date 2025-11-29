import { load } from "cheerio";
import type {
  CrawledArticleSnapshot,
  SimpleListCrawlConfig,
} from "../domain/models.js";

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

/**
 * SimpleListCrawlConfig に基づいて HTML 文字列から
 * タイトル / URL / 公開日を抽出する純粋関数。
 */
export function extractSimpleListArticles(params: {
  html: string;
  baseUrl: string;
  config: SimpleListCrawlConfig;
}): CrawledArticleSnapshot[] {
  const { html, baseUrl, config } = params;
  const $ = load(html);

  const maxItems =
    typeof config.maxItems === "number" && config.maxItems > 0
      ? Math.floor(config.maxItems)
      : undefined;

  const results: CrawledArticleSnapshot[] = [];

  $(config.itemSelector).each((_, el) => {
    if (maxItems !== undefined && results.length >= maxItems) {
      return false; // break
    }

    const titleEl = $(el).find(config.titleSelector).first();
    const urlEl = $(el).find(config.urlSelector).first();

    const title = titleEl.text().trim();
    const href = urlEl.attr("href")?.trim();

    if (!title || !href) {
      return;
    }

    const publishedAt = config.dateSelector
      ? $(el).find(config.dateSelector).first().text().trim() || undefined
      : undefined;

    results.push({
      title,
      url: resolveUrl(href, baseUrl),
      publishedAt,
    });
  });

  return results;
}
