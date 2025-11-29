import { DynamoDB } from "aws-sdk";
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
    this.client =
      params.client ??
      new DynamoDB.DocumentClient({ convertEmptyValues: true });
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

    await this.client
      .put({
        TableName: this.tableName,
        Item: record,
      })
      .promise();
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
