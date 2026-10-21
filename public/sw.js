// Service worker của Rankev — CHỈ lo thông báo đẩy (không cache trang, tránh bản cũ bị kẹt).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(
    self.registration.showNotification(d.title || "Rankev", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/favicon-48.png",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || "/" },
    }),
  );
});

// Bấm thông báo → mở (hoặc đưa lên trước) tab Rankev ở đúng bài.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const w = wins.find((c) => c.url.startsWith(self.location.origin));
    if (w) {
      await w.focus();
      if (url !== self.location.origin + "/") { try { await w.navigate(url); } catch { /* tab khác nguồn */ } }
      return;
    }
    await self.clients.openWindow(url);
  })());
});
