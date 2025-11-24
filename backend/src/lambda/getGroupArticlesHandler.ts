import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import type { ArticleSummary } from "../domain/models.js";
import { getGroupArticles } from "../handlers/getGroupArticles.js";

const ddb = new DynamoDB.DocumentClient();
const ARTICLES_TABLE_NAME = process.env.ARTICLES_TABLE_NAME;

/**
 * DynamoDB の 1レコードを ArticleSummary にマッピングする。
 * 将来の保存形式に合わせてここを調整する。
 */
function mapItemToArticleSummary(
  item: DynamoDB.DocumentClient.AttributeMap
): ArticleSummary {
  return {
    id: (item.articleId as string) ?? (item.sk as string) ?? "unknown",
    companyName:
      (item.companyName as string) ??
      (item.companyId as string) ??
      "Unknown company",
    title: (item.title as string) ?? "(no title)",
    url: (item.url as string) ?? "#",
    publishedAt: item.publishedAt as string | undefined,
    summaryText: item.summaryText as string | undefined,
    // DynamoDB には isNew は基本的に保存しない想定なので false 扱い
    isNew: false,
  };
}

/**
 * GET /groups/{groupId}/articles 用 Lambda ハンドラー。
 *
 * - AWS 環境で ARTICLES_TABLE_NAME が設定されている場合:
 *    DynamoDB PressWatchArticles から記事一覧を取得して返す
 * - それ以外（ローカル開発 / テスト）:
 *    既存の getGroupArticles() にフォールバック（モック or インメモリ）
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const groupId = event.pathParameters?.groupId;

  if (!groupId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "groupId is required" }),
    };
  }

  // 環境変数がない場合は、既存ロジックにフォールバック
  if (!ARTICLES_TABLE_NAME) {
    try {
      const result = await getGroupArticles(groupId);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error("getGroupArticles (fallback) error:", error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Internal Server Error" }),
      };
    }
  }

  // 本番/AWS 環境：DynamoDB から記事一覧を取得
  try {
    const pk = `GROUP#${groupId}`;

    const result = await ddb
      .query({
        TableName: ARTICLES_TABLE_NAME,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": pk,
        },
        // 新しいものから順に
        ScanIndexForward: false,
        Limit: 50,
      })
      .promise();

    const items = result.Items ?? [];
    const articles: ArticleSummary[] = items.map(mapItemToArticleSummary);

    const responseBody = {
      groupId,
      articles,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("getGroupArticlesHandler DynamoDB error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
