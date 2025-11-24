import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { handlePushSubscribeHttp } from "../handlers/pushSubscribeHttpHandler.js";
import type { HttpRequest } from "../handlers/httpTypes.js";
import type {
  PushSubscribeRequest,
  PushSubscribeResponse,
} from "../domain/models.js";

const ddb = new DynamoDB.DocumentClient();
const PUSH_SUBSCRIPTIONS_TABLE_NAME = process.env.PUSH_SUBSCRIPTIONS_TABLE_NAME;

/**
 * endpoint から購読IDを生成する（ドメイン側のロジックと揃える）
 */
function generateSubscriptionId(endpoint: string): string {
  return "sub_" + Buffer.from(endpoint).toString("base64url").slice(0, 16);
}

/**
 * PushSubscribeRequest を DynamoDB に保存する。
 */
async function saveSubscriptionToDynamo(
  payload: PushSubscribeRequest
): Promise<PushSubscribeResponse> {
  if (!PUSH_SUBSCRIPTIONS_TABLE_NAME) {
    throw new Error("PUSH_SUBSCRIPTIONS_TABLE_NAME is not set");
  }

  const { subscription, groupIds, userAgent } = payload;
  const { endpoint, keys } = subscription;

  const now = new Date().toISOString();
  const id = generateSubscriptionId(endpoint);

  const item = {
    id,
    endpoint,
    p256dhKey: keys.p256dh,
    authKey: keys.auth,
    groupIds,
    userAgent,
    createdAt: now,
    updatedAt: now,
    disabled: false,
  };

  await ddb
    .put({
      TableName: PUSH_SUBSCRIPTIONS_TABLE_NAME,
      Item: item,
    })
    .promise();

  return {
    subscriptionId: id,
    groupIds,
  };
}

/**
 * POST /push/subscribe 用 Lambda ハンドラー。
 *
 * - AWS 環境で PUSH_SUBSCRIPTIONS_TABLE_NAME が設定されている場合:
 *    DynamoDB に購読情報を保存して PushSubscribeResponse を返す
 * - それ以外（ローカル開発 / テスト）:
 *    既存の handlePushSubscribeHttp() にフォールバック（in-memory 実装）
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const rawBody = event.body;

  if (!rawBody) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  const decodedBody =
    event.isBase64Encoded && rawBody
      ? Buffer.from(rawBody, "base64").toString("utf8")
      : rawBody;

  let payload: PushSubscribeRequest;
  try {
    payload = JSON.parse(decodedBody) as PushSubscribeRequest;
  } catch {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  // DynamoDB テーブル名が設定されていない場合は、既存ロジックにフォールバック
  if (!PUSH_SUBSCRIPTIONS_TABLE_NAME) {
    const req: HttpRequest = {
      method: event.requestContext.http.method,
      path: event.rawPath,
      headers: event.headers ?? {},
      body: decodedBody,
    };

    try {
      const res = await handlePushSubscribeHttp(req);
      return {
        statusCode: res.statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
          ...res.headers,
        },
        body: res.body,
      };
    } catch (error) {
      console.error("pushSubscribeHandler fallback error:", error);
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

  // 本番/AWS 環境：DynamoDB に購読を保存
  try {
    const result = await saveSubscriptionToDynamo(payload);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Expose-Headers": "Content-Type",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("pushSubscribeHandler DynamoDB error:", error);
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
