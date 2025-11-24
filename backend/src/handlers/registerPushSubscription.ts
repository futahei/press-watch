import {
  PushSubscribeRequest,
  PushSubscribeResponse,
  WebPushSubscription,
} from "../domain/models.js";

/**
 * Web Push 購読情報を登録・更新するアプリケーションレベルのハンドラ。
 *
 * 仕様（暫定）:
 * - 同じ endpoint の購読がすでに存在する場合は上書き更新する
 * - 存在しない場合は新規作成する
 * - 戻り値として subscriptionId と現在有効な groupIds を返す
 *
 * 現時点では DynamoDB などは使わず、インメモリのモック実装。
 */
const inMemoryStore = new Map<string, WebPushSubscription>();

function generateIdFromEndpoint(endpoint: string): string {
  // ひとまず簡易なハッシュもどき。後で crypto を使ってもよい。
  return "sub_" + Buffer.from(endpoint).toString("base64url").slice(0, 16);
}

export async function registerPushSubscription(
  req: PushSubscribeRequest
): Promise<PushSubscribeResponse> {
  const { subscription, groupIds, userAgent } = req;
  const { endpoint, keys } = subscription;

  const now = new Date().toISOString();
  const id = generateIdFromEndpoint(endpoint);

  const existing = inMemoryStore.get(id);

  const next: WebPushSubscription = {
    id,
    endpoint,
    p256dhKey: keys.p256dh,
    authKey: keys.auth,
    groupIds,
    userAgent: userAgent ?? existing?.userAgent,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    disabled: false,
  };

  inMemoryStore.set(id, next);

  return {
    subscriptionId: id,
    groupIds: next.groupIds,
  };
}
