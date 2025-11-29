import { DynamoDB, config as awsConfig } from "aws-sdk";
import type { ArticleDetail, ArticleRecord } from "../domain/articleStorage.js";
import { toArticleDetail, toArticleRecord } from "../domain/articleStorage.js";
import {
  buildGroupArticlesQueryInput,
  type ArticleRepository,
} from "./articleRepository.js";

/**
 * DynamoDB.DocumentClient 互換の最小インターフェース。
 * - テスト時にはこのインターフェースを実装したフェイクを渡すことで差し替え可能にする。
 */
export interface DynamoDbLikeClient {
  query(params: DynamoDB.DocumentClient.QueryInput): {
    promise(): Promise<DynamoDB.DocumentClient.QueryOutput>;
  };
  put(params: DynamoDB.DocumentClient.PutItemInput): {
    promise(): Promise<DynamoDB.DocumentClient.PutItemOutput>;
  };
  get(params: DynamoDB.DocumentClient.GetItemInput): {
    promise(): Promise<DynamoDB.DocumentClient.GetItemOutput>;
  };
}

/**
 * PressWatchArticles テーブル用の DynamoDB 実装 ArticleRepository。
 */
export class DynamoDbArticleRepository implements ArticleRepository {
  private readonly tableName: string;
  private readonly client: DynamoDbLikeClient;

  constructor(params: { tableName: string; client?: DynamoDbLikeClient }) {
    this.tableName = params.tableName;

    // 明示的にリージョンを設定（Lambda 環境変数 AWS_REGION を優先）。
    if (!awsConfig.region) {
      awsConfig.update({
        region: process.env.AWS_REGION ?? "ap-northeast-1",
      });
    }

    this.client =
      params.client ??
      new DynamoDB.DocumentClient({
        convertEmptyValues: true,
        httpOptions: {
          connectTimeout: 1500,
          timeout: 5000, // 長時間ハングしないよう短めのタイムアウト
        },
        maxRetries: 0,
        retryDelayOptions: {
          base: 0,
        },
      });
  }

  async listByGroup(
    groupId: string,
    options?: { limit?: number }
  ): Promise<ArticleDetail[]> {
    const queryInput = buildGroupArticlesQueryInput({
      tableName: this.tableName,
      groupId,
      limit: options?.limit,
    });

    // buildGroupArticlesQueryInput が返す型は独自の QueryInput だが、
    // フィールド構造は DocumentClient.QueryInput と互換なので、そのまま渡す。
    const result = await this.client
      .query(queryInput as DynamoDB.DocumentClient.QueryInput)
      .promise();

    const items = (result.Items ?? []) as ArticleRecord[];

    return items.map((item) => toArticleDetail(item));
  }

  async put(article: ArticleDetail): Promise<void> {
    const now = new Date().toISOString();
    const record = toArticleRecord({
      article,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await putWithAbort(this.client, {
        TableName: this.tableName,
        Item: record,
      });
    } catch (error) {
      console.error("[DynamoDbArticleRepository] put error", {
        tableName: this.tableName,
        articleId: article.id,
        error,
      });
      throw error;
    }
  }

  /**
   * グループと articleId から記事を取得する。
   * - SK に publishedAt が含まれるため、Query + Filter で拾う簡易実装。
   */
  async getByGroupAndId(
    groupId: string,
    articleId: string
  ): Promise<ArticleDetail | null> {
    const result = await this.client
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": `GROUP#${groupId}`,
          ":skPrefix": "PUBLISHED#",
          ":articleId": articleId,
        },
        FilterExpression: "articleId = :articleId",
        Limit: 1,
        ScanIndexForward: false,
      })
      .promise();

    const item = (result.Items ?? [])[0] as ArticleRecord | undefined;
    if (!item) return null;

    return toArticleDetail(item);
  }
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
async function putWithAbort(
  client: DynamoDbLikeClient,
  params: DynamoDB.DocumentClient.PutItemInput,
  timeoutMs: number = 8000
): Promise<DynamoDB.DocumentClient.PutItemOutput> {
  return new Promise((resolve, reject) => {
    const req = (client as DynamoDB.DocumentClient).put(params);

    const timer = setTimeout(() => {
      console.error("[DynamoDbArticleRepository] put timeout fired", {
        tableName: params.TableName,
        articleId: (params.Item as any)?.articleId,
      });
      try {
        req.abort();
      } catch (e) {
        // abort に失敗してもログだけ出す
        console.error("[DynamoDbArticleRepository] abort failed", e);
      }
      reject(new Error("[DynamoDbArticleRepository] put timeout"));
    }, timeoutMs);

    req
      .promise()
      .then((res) => resolve(res))
      .catch((err) => reject(err))
      .finally(() => clearTimeout(timer));
  });
}
