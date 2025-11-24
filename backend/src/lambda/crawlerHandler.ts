import type { Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import crypto from "crypto";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const ddb = new DynamoDB.DocumentClient();
const ARTICLES_TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

type CrawledArticle = {
  groupId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
};

type TargetCompany = {
  id: string;
  groupId: string;
  companyName: string;
  pressListUrl: string;
  itemSelector: string;
  titleSelector: string;
  urlSelector: string;
  dateSelector?: string;
  /**
   * 日付文字列を ISO 文字列に変換するカスタムパーサ
   * 未設定の場合やパース失敗時は「現在時刻」を採用する
   */
  parseDate?: (raw: string) => string | undefined;
};

/**
 * 監視対象企業の定義（暫定）
 * 実際に使うときは企業ごとに URL / セレクタを調整してください。
 */
const TARGET_COMPANIES: TargetCompany[] = [
  {
    id: "sample-corp",
    groupId: "default",
    companyName: "Sample Corp.",
    pressListUrl: "https://example.com/press", // TODO: 実際の URL に変更
    itemSelector: "ul.press-list > li",
    titleSelector: "a",
    urlSelector: "a",
    dateSelector: ".date",
    parseDate: (raw: string) => {
      const trimmed = raw.trim();
      // 例: 2025/11/01 → 2025-11-01T00:00:00+09:00 として扱うなど
      const m = trimmed.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (!m) return undefined;
      const [_, y, mo, d] = m;
      const iso = new Date(Number(y), Number(mo) - 1, Number(d)).toISOString();
      return iso;
    },
  },
  // 他の企業もここに追加していく
];

/**
 * 指定 URL の HTML を取得
 */
async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "PressWatchCrawler/0.1 (+https://presswatch.local)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return await res.text();
}

/**
 * 単一企業のプレスリリース一覧ページをクロール
 */
async function crawlCompany(company: TargetCompany): Promise<CrawledArticle[]> {
  const html = await fetchHtml(company.pressListUrl);
  const $ = cheerio.load(html);

  const articles: CrawledArticle[] = [];

  const items = $(company.itemSelector).toArray();

  for (const el of items) {
    const item = $(el);

    const title = item.find(company.titleSelector).text().trim();
    const href = item.find(company.urlSelector).attr("href") ?? "";

    if (!title || !href) {
      continue;
    }

    const absoluteUrl =
      href.startsWith("http://") || href.startsWith("https://")
        ? href
        : new URL(href, company.pressListUrl).toString();

    let publishedAt: string;
    if (company.dateSelector) {
      const rawDate = item.find(company.dateSelector).text().trim();
      let parsed: string | undefined;
      if (company.parseDate) {
        parsed = company.parseDate(rawDate);
      }
      if (parsed) {
        publishedAt = parsed;
      } else {
        publishedAt = new Date().toISOString();
      }
    } else {
      publishedAt = new Date().toISOString();
    }

    articles.push({
      groupId: company.groupId,
      companyName: company.companyName,
      title,
      url: absoluteUrl,
      publishedAt,
    });

    // とりあえず 20 件くらいまでに制限（必要なら調整）
    if (articles.length >= 20) break;
  }

  return articles;
}

/**
 * 全企業をクロール
 */
async function crawlAllCompanies(): Promise<CrawledArticle[]> {
  const results: CrawledArticle[] = [];

  for (const company of TARGET_COMPANIES) {
    try {
      const articles = await crawlCompany(company);
      console.log(
        `Crawled ${articles.length} articles for ${company.companyName}`
      );
      results.push(...articles);
    } catch (err) {
      console.error(`Failed to crawl company ${company.companyName}:`, err);
    }
  }

  return results;
}

/**
 * DynamoDB に記事を保存
 */
async function saveArticle(item: CrawledArticle) {
  if (!ARTICLES_TABLE_NAME) {
    throw new Error("ARTICLES_TABLE_NAME is not set");
  }

  const urlHash = crypto.createHash("sha256").update(item.url).digest("hex");
  const pk = `GROUP#${item.groupId}`;
  const sk = `PUBLISHED#${item.publishedAt}#URL#${urlHash}`;

  const putItem = {
    pk,
    sk,
    groupId: item.groupId,
    companyName: item.companyName,
    title: item.title,
    url: item.url,
    publishedAt: item.publishedAt,
    createdAt: new Date().toISOString(),
  };

  await ddb
    .put({
      TableName: ARTICLES_TABLE_NAME,
      Item: putItem,
    })
    .promise();
}

export const handler: Handler = async () => {
  console.log("CrawlerLambda started.");

  if (!ARTICLES_TABLE_NAME) {
    console.warn("ARTICLES_TABLE_NAME is not set. Skip crawling.");
    return { ok: false, reason: "ARTICLES_TABLE_NAME not set" };
  }

  const articles = await crawlAllCompanies();

  for (const article of articles) {
    try {
      await saveArticle(article);
    } catch (err) {
      console.error("Failed to save article to DynamoDB:", article, err);
    }
  }

  console.log(`Saved ${articles.length} articles.`);
  return { ok: true, count: articles.length };
};
