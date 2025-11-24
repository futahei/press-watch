// Push メッセージを受け取ったときの処理
self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // JSON でない場合は無視してデフォルト表示
    console.error("Failed to parse push data:", e);
  }

  const title = data.title || "PressWatch: 新しいプレスリリース";
  const body =
    data.body ||
    "新しいプレスリリースが配信されました。詳細を確認してください。";
  const url = data.url || "/";

  const options = {
    body,
    data: { url },
    icon: "/icon-192.png",
    badge: "/icon-192.png",
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
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(url);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
