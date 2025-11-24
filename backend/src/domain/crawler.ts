import type {
  CompanyConfig,
  CrawledArticleSnapshot,
  GroupConfig,
  GroupCrawlSnapshot,
} from "./models.js";

/**
 * 単一企業のプレスリリース一覧ページをクロールし、
 * 現時点で観測できる記事スナップショットを返す。
 *
 * 注意:
 * - 実際の HTTP リクエスト・HTML パースはインフラ層（別モジュール）で行う前提。
 * - ここでは「インターフェースと戻り値の型」だけを定義しておく。
 */
export interface CompanyCrawler {
  crawlCompany(config: CompanyConfig): Promise<CrawledArticleSnapshot[]>;
}

/**
 * 後でインフラ層から渡せるように、デフォルト実装用のプレースホルダー。
 * いまは「未実装」として例外を投げるだけにしておく。
 */
export const defaultCompanyCrawler: CompanyCrawler = {
  async crawlCompany(
    _config: CompanyConfig
  ): Promise<CrawledArticleSnapshot[]> {
    // TODO: 後で HTTP クライアント + HTML パーサーを組み合わせて実装
    throw new Error(
      "defaultCompanyCrawler is not implemented yet. Provide an infrastructure-specific implementation."
    );
  },
};

/**
 * 与えられた GroupConfig と CompanyConfig 一覧に基づいて、
 * 1グループ分のクロール結果を集約する。
 *
 * - 実際の IO は CompanyCrawler に委譲する。
 * - detectNewArticles や decideArticlesToNotify に渡す前段の「生データ取得」レイヤー。
 */
export async function crawlGroup(
  group: GroupConfig,
  companies: CompanyConfig[],
  crawler: CompanyCrawler
): Promise<GroupCrawlSnapshot> {
  const targets = companies.filter((c) => group.companyIds.includes(c.id));

  const companySnapshots = await Promise.all(
    targets.map(async (company) => {
      const articles = await crawler.crawlCompany(company);
      return { company, articles };
    })
  );

  return {
    group,
    companySnapshots,
  };
}
