"use client";

import { useEffect, useState } from "react";
import {
  getNotificationStatus,
  subscribeToNotifications,
  type NotificationStatus,
} from "@/lib/notifications";
import { subscribePush } from "@/lib/apiClient";

export function NotificationToggle() {
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const current = getNotificationStatus();
    setStatus(current);
  }, []);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await subscribeToNotifications(["default"]);
      setStatus(result.status);

      if (result.request) {
        try {
          const res = await subscribePush(result.request);
          // 実際に API Base URL が設定されていない場合は res は null のまま

          console.log("subscribePush result:", res);
        } catch (e) {
          console.error("Failed to send push subscription to server:", e);
        }
      }
    } catch (e) {
      console.error("Failed to subscribe notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  let label = "通知を有効化";
  if (status === "unsupported") {
    label = "通知非対応";
  } else if (status === "denied") {
    label = "通知がブロックされています";
  } else if (status === "subscribed") {
    label = "通知は有効です";
  }

  const disabled = status === "unsupported" || status === "denied" || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span aria-hidden="true">🔔</span>
      <span>{label}</span>
    </button>
  );
}
