import type { PushSubscribeRequest } from "./types";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type NotificationStatus =
  | "unsupported"
  | "denied"
  | "prompt"
  | "subscribed"
  | "idle";

/**
 * 現在のブラウザにおける通知サポート/許可状態をざっくり返す。
 */
export function getNotificationStatus(): NotificationStatus {
  if (typeof window === "undefined") {
    return "idle";
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }

  const permission = Notification.permission;
  if (permission === "denied") return "denied";
  if (permission === "granted") return "subscribed"; // 実際の購読有無は別途確認するのが理想だが、簡易的に
  return "prompt";
}

export interface SubscribeResult {
  status: NotificationStatus;
  request?: PushSubscribeRequest;
}

/**
 * ブラウザ通知を有効化し、PushSubscription 情報を返す。
 * まだ backend API には送信せず、呼び出し元で扱ってもらう。
 */
export async function subscribeToNotifications(
  groupIds: string[]
): Promise<SubscribeResult> {
  if (typeof window === "undefined") {
    return { status: "unsupported" };
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();

  if (permission === "denied") {
    return { status: "denied" };
  }
  if (permission !== "granted") {
    return { status: "prompt" };
  }

  const registration = await navigator.serviceWorker.register(
    "/presswatch-sw.js"
  );

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // すでに購読済みなら、バックエンドと同期するための情報を返す
    const request: PushSubscribeRequest = {
      subscription: {
        endpoint: existing.endpoint,
        keys: {
          p256dh: (existing.toJSON().keys?.p256dh ?? "") as string,
          auth: (existing.toJSON().keys?.auth ?? "") as string,
        },
      },
      groupIds,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
    return { status: "subscribed", request };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY が設定されていないため、Push 購読を完了できません。"
    );
    return { status: "idle" };
  }

  const applicationServerKey = urlBase64ToUint8Array(
    publicKey
  ) as unknown as BufferSource;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const json = subscription.toJSON();

  const request: PushSubscribeRequest = {
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: (json.keys?.p256dh ?? "") as string,
        auth: (json.keys?.auth ?? "") as string,
      },
    },
    groupIds,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  return {
    status: "subscribed",
    request,
  };
}
