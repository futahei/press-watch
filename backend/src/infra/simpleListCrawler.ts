import type {
  CompanyConfig,
  CrawledArticleSnapshot,
} from "../domain/models.js";
import { extractSimpleListArticles } from "./htmlListExtractor.js";
import { simpleHttpGet } from "./simpleHttpFetcher.js";

export interface SimpleListCrawlerDeps {
  httpGet?: (
    url: string
  ) => Promise<{ ok: boolean; status: number; text: string }>;
}

/**
 * SimpleListCrawlConfig を用いて、企業のプレスリリース一覧ページを取得・抽出するクローラ。
 */
export async function crawlCompanySimpleList(
  company: CompanyConfig,
  deps: SimpleListCrawlerDeps = {}
): Promise<CrawledArticleSnapshot[]> {
  const httpGet = deps.httpGet ?? simpleHttpGet;

  if (company.crawlConfig.type !== "simpleList") {
    throw new Error("Unsupported crawlConfig type");
  }

  const res = await httpGet(company.pressReleaseUrl);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch press release page: ${res.status} ${company.pressReleaseUrl}`
    );
  }

  return extractSimpleListArticles({
    html: res.text,
    baseUrl: company.pressReleaseUrl,
    config: company.crawlConfig,
  });
}
