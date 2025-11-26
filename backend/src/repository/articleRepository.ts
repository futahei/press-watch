import type { ArticleDetail, GroupId } from "../domain/articleStorage.js";
import { buildArticlePk } from "../domain/articleStorage.js";

/**
 * DynamoDB の QueryInput 相当を最低限だけ表現した型。
 * aws-sdk に依存しないよう、必要なプロパティだけ定義する。
 */
export interface QueryInput {
  TableName: string;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  ScanIndexForward?: boolean;
  Limit?: number;
}

/**
 * 記事データ取得のためのリポジトリインターフェース。
 * 実装は後で DynamoDB 用に作成する。
 */
export interface ArticleRepository {
  /**
   * 指定したグループの全記事を「新しい順」で返す。
   *
   * - limit を指定した場合は、その件数までに絞る（新しい順の上位 N 件）。
   */
  listByGroup(
    groupId: GroupId,
    options?: { limit?: number }
  ): Promise<ArticleDetail[]>;
}

/**
 * PressWatchArticles テーブルから、ある groupId の記事を取得するための
 * DynamoDB QueryInput を構築する純粋関数。
 *
 * - PK = "GROUP#<groupId>"
 * - SK は "PUBLISHED#..." プレフィックスで始まるもの全てを対象
 * - ScanIndexForward = false で新しいものから取得
 */
export function buildGroupArticlesQueryInput(params: {
  tableName: string;
  groupId: GroupId;
  limit?: number;
}): QueryInput {
  const { tableName, groupId, limit } = params;

  const pk = buildArticlePk(groupId);

  const input: QueryInput = {
    TableName: tableName,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": pk,
      ":skPrefix": "PUBLISHED#",
    },
    // 新しい順（SK 降順）で取得
    ScanIndexForward: false,
  };

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    input.Limit = Math.floor(limit);
  }

  return input;
}
