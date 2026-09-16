// Plain Web Push service worker — no Firebase SDK. Every push event (whether
// the tab is open, backgrounded, or the browser is fully closed) arrives here.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Sathee", body: event.data ? event.data.text() : "" };
  }

  const { title, body, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "Sathee", {
      body: body || "",
      icon: "/favicon.svg",
      data: data || {},
    })
  );
});

// Focus/open the app when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
