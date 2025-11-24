// install イベント（現時点では何もしないが、将来 asset キャッシュなども検討可）
self.addEventListener("install", (event) => {
  // 即座に新しい SW を有効化したい場合:
  // self.skipWaiting();
});

// activate イベント（クリーンアップなどに使える）
self.addEventListener("activate", (event) => {
  // クライアント制御を即座に取りたい場合:
  // event.waitUntil(clients.claim());
});

// push 通知を受け取ったときのハンドラ
self.addEventListener("push", (event) => {
  // サーバーから送られてくる payload を JSON として解釈する想定
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // JSON でない場合はテキストとして扱う
      data = { title: "PressWatch", body: event.data.text() };
    }
  }

  const title = data.title || "PressWatch";
  const body =
    data.body ||
    "新しいプレスリリースがあります。PressWatch で詳細を確認してください。";
  const url = data.url || "/";
  const tag = data.tag || "presswatch-notification";

  const options = {
    body,
    tag,
    data: {
      url,
    },
    // icon や badge が必要ならここで指定:
    // icon: "/icons/notification-icon.png",
    // badge: "/icons/notification-badge.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリック時の挙動
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 既に開いているタブがあればそれをフォーカス
        for (const client of clientList) {
          if ("focus" in client) {
            if (client.url && client.url.includes(self.location.origin)) {
              return client.focus();
            }
          }
        }
        // なければ新規タブを開く
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
