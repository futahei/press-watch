import { subscribePush } from "./apiClient";
import type { PushSubscribeRequest, PushSubscribeResponse } from "./types";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * 通知の状態
 * - unsupported: ブラウザが Push / Notification に対応していない
 * - inactive: 設定されていない（未購読 / 未許可）
 * - denied: ブラウザの通知権限が拒否されている
 * - subscribed: 購読済み
 */
export type NotificationStatus =
  | "unsupported"
  | "inactive"
  | "denied"
  | "subscribed";

/**
 * VAPID 公開鍵（URL Safe Base64）→ Uint8Array 変換
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData =
    typeof window !== "undefined"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  return true;
}

/**
 * 現在の通知状態を取得する（クライアント専用）
 */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (typeof window === "undefined") {
    return "unsupported";
  }

  if (!isPushSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // まだ許可/拒否されていない
  if (Notification.permission === "default") {
    return "inactive";
  }

  // permission === "granted"
  try {
    const registration =
      (await navigator.serviceWorker.getRegistration("/presswatch-sw.js")) ??
      (await navigator.serviceWorker.ready);

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return "subscribed";
    }

    return "inactive";
  } catch (error) {
    console.error(
      "[getNotificationStatus] Failed to check subscription:",
      error
    );
    // チェックに失敗した場合はとりあえず inactive 扱い
    return "inactive";
  }
}

/**
 * 指定されたグループ ID 群に対する Web Push 通知購読を行い、
 * サーバーに購読情報を登録する低レベル API。
 *
 * - ブラウザでのみ実行可能
 * - VAPID 公開鍵が未設定の場合は何もせず null を返す
 */
export async function subscribeToPushNotifications(
  groupIds: string[]
): Promise<PushSubscribeResponse | null> {
  if (typeof window === "undefined") {
    throw new Error(
      "subscribeToPushNotifications はブラウザ環境でのみ実行できます。"
    );
  }

  if (!isPushSupported()) {
    console.warn(
      "Service Worker / Push / Notification 未対応ブラウザのため、Push 通知は利用できません。"
    );
    return null;
  }

  if (!PUBLIC_VAPID_KEY) {
    console.info(
      "[subscribeToPushNotifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY が未設定のため、サーバー登録は行いません。"
    );
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.info("ユーザーが通知を許可しなかったため、購読を中止しました。");
    return null;
  }

  // Service Worker 登録
  const registration = await navigator.serviceWorker.register(
    "/presswatch-sw.js"
  );

  // 既存の購読があればそれを利用
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const applicationServerKey = urlBase64ToUint8Array(
      PUBLIC_VAPID_KEY
    ) as unknown as BufferSource;

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("PushSubscription から必要な情報を取得できませんでした。");
  }

  const payload: PushSubscribeRequest = {
    subscription: {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    },
    groupIds,
    userAgent: window.navigator.userAgent,
  };

  // サーバー側の /push/subscribe API へ登録
  const response = await subscribePush(payload);
  return response;
}

/**
 * NotificationToggle 用の高レベル API
 *
 * - 成功時: "subscribed"
 * - ブラウザ未対応: "unsupported"
 * - ユーザー拒否: "denied"
 * - その他失敗: "inactive"
 */
export async function subscribeToNotifications(
  groupIds: string[]
): Promise<NotificationStatus> {
  if (typeof window === "undefined") {
    return "unsupported";
  }

  if (!isPushSupported()) {
    return "unsupported";
  }

  try {
    const res = await subscribeToPushNotifications(groupIds);
    if (res) {
      return "subscribed";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    return "inactive";
  } catch (error) {
    console.error("[subscribeToNotifications] Failed to subscribe:", error);
    if (Notification.permission === "denied") {
      return "denied";
    }
    return "inactive";
  }
}
