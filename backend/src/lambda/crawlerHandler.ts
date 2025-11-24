import type { Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import crypto from "crypto";

const ddb = new DynamoDB.DocumentClient();
const ARTICLES_TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

/**
 * 仮のクローラ（後に実装を差し替える）
 */
async function mockCrawl() {
  return [
    {
      groupId: "default",
      companyName: "Sample Corp.",
      title: "【仮】PressWatch のテスト記事",
      url: "https://example.com/press/mock",
      publishedAt: new Date().toISOString(),
    },
  ];
}

/**
 * DynamoDB に記事を保存
 */
async function saveArticle(item: {
  groupId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
}) {
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

  const results = await mockCrawl();

  for (const article of results) {
    await saveArticle(article);
  }

  console.log(`Saved ${results.length} articles.`);
  return { ok: true, count: results.length };
};
