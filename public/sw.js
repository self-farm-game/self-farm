/* Service worker Self-Farm.
 *
 * Робить рівно одне: приймає push і показує сповіщення. Жодного кешування
 * сторінок — офлайн-режим грі не потрібен, а «розумний» кеш у service worker
 * це найшвидший спосіб показати людині вчорашню версію застосунку.
 *
 * Працює, коли вкладка закрита: саме цим push відрізняється від таймера
 * всередині сторінки.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Self-Farm";
  const options = {
    body: data.body || "",
    icon: data.icon || "/assets/icons/icon-192.png",
    badge: "/assets/icons/badge-72.png",
    // Один тег на всі нагадування: нове тихо замінює старе, замість того
    // щоб у шторці накопичувалась купа однакових.
    tag: data.tag || "self-farm-reminder",
    renotify: false,
    requireInteraction: false,
    data: { url: data.url || "/garden" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/garden";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Якщо гра вже десь відкрита — не плодимо вкладки, просто піднімаємо її.
      for (const c of list) {
        if (c.url.includes(self.registration.scope) && "focus" in c) {
          c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

/* Браузер інколи сам оновлює підписку (ротація ключів на його боці).
   Тоді стару треба замінити на сервері, інакше push просто перестане йти. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const old = event.oldSubscription || null;
        const sub =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe(
            old ? old.options : { userVisibleOnly: true },
          ));
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub, rotatedFrom: old ? old.endpoint : null }),
        });
      } catch {
        /* нічого не вдієш — людина переувімкне нагадування в Хатині */
      }
    })(),
  );
});
