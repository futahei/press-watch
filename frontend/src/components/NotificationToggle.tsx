"use client";

import { useEffect, useState } from "react";
import {
  getNotificationStatus,
  subscribeToNotifications,
  type NotificationStatus,
} from "@/lib/notification";

type Props = {
  /**
   * グループ固有の通知トグルにしたい場合は groupId を渡す。
   * ヘッダー等からグローバルに使う場合は省略可能。
   */
  groupId?: string;
};

export function NotificationToggle({ groupId }: Props) {
  const [status, setStatus] = useState<NotificationStatus>("inactive");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const s = await getNotificationStatus();
        if (!cancelled) {
          setStatus(s);
          setLoading(false);
        }
      } catch (error) {
        console.error("[NotificationToggle] Failed to get status:", error);
        if (!cancelled) {
          setStatus("inactive");
          setLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = async () => {
    setMessage(null);

    if (status === "unsupported") {
      setMessage(
        "このブラウザは Push 通知に対応していないため、通知を利用できません。"
      );
      return;
    }

    if (status === "denied") {
      setMessage(
        "ブラウザで通知が拒否されています。ブラウザのサイト設定から通知を許可してください。"
      );
      return;
    }

    setLoading(true);

    try {
      // groupId が指定されていればそのグループのみ、なければ「グループ指定なし」で購読
      const targetGroupIds = groupId ? [groupId] : [];
      const nextStatus = await subscribeToNotifications(targetGroupIds);
      setStatus(nextStatus);

      if (nextStatus === "subscribed") {
        setMessage(
          groupId
            ? "このグループの通知購読を登録しました。"
            : "通知購読を登録しました。"
        );
      } else if (nextStatus === "denied") {
        setMessage(
          "通知がブラウザで拒否されています。ブラウザの設定を確認してください。"
        );
      } else if (nextStatus === "unsupported") {
        setMessage(
          "このブラウザは Push 通知に対応していないため、通知を利用できません。"
        );
      } else {
        setMessage(
          "通知購読の状態を更新できませんでした。時間をおいて再度お試しください。"
        );
      }
    } catch (error) {
      console.error("[NotificationToggle] Failed to subscribe:", error);
      setMessage("通知の登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const label = (() => {
    if (loading) return "通知状態を確認中...";
    switch (status) {
      case "unsupported":
        return "このブラウザでは通知を利用できません";
      case "denied":
        return "通知が拒否されています";
      case "subscribed":
        return groupId ? "このグループの通知を受信中" : "通知を受信中";
      case "inactive":
      default:
        return groupId ? "このグループの通知を受け取る" : "通知を受け取る";
    }
  })();

  // 現状は「購読 ON」のみを扱う想定なので、inactive / subscribed のときだけクリック可能
  const clickable = status === "inactive" || status === "subscribed";

  return (
    <div className="mt-2 space-y-1">
      <button
        type="button"
        onClick={clickable ? handleClick : undefined}
        disabled={loading || !clickable}
        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                   border border-sky-500 text-sky-600 dark:text-sky-300
                   hover:bg-sky-50 dark:hover:bg-sky-900
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors"
      >
        {label}
      </button>
      {message && (
        <p className="text-xs text-slate-600 dark:text-slate-300">{message}</p>
      )}
    </div>
  );
}
