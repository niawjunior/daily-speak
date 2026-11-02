// Daily Speak's service worker: opens offline from what it has seen, shows reminders, and — on phones that allow it —
// checks in the evening whether today was practised before the streak is lost.
const SHELL = "daily-speak-shell-v1";
const META = "daily-speak-meta";
const scope = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([scope, `${scope}manifest.webmanifest`, `${scope}icon-192.png`])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== META).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// The network first, what was kept when it is not there. The API is never kept: its answers are of today.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith(`${new URL(scope).pathname}api`)) return;
  const page = req.mode === "navigate";
  const asset = /\.(js|css|png|svg|woff2?|webmanifest)$/.test(url.pathname) && !url.pathname.includes("/@") && !url.pathname.includes("/src/");
  if (!page && !asset) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(page ? scope : req, copy));
        }
        return res;
      })
      .catch(() => caches.match(page ? scope : req).then((hit) => hit || Response.error())),
  );
});

// A reminder sent by the page: shown as the phone's own notification.
self.addEventListener("message", (event) => {
  if (event.data?.type === "notify") event.waitUntil(show(event.data.note));
});

function show(note) {
  return self.registration.showNotification(note.title, {
    body: note.body,
    icon: `${scope}icon-192.png`,
    badge: `${scope}icon-192.png`,
    tag: note.tag || "daily-speak",
    renotify: true,
    data: { url: note.url || scope },
    actions: [{ action: "practice", title: "ฝึกเลย" }],
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || scope, scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(scope));
      if (open) return open.focus().then((c) => c.navigate(target));
      return self.clients.openWindow(target);
    }),
  );
});

// The evening check, when the phone wakes the installed app now and then (Chrome on Android).
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "streak-check") event.waitUntil(eveningCheck());
});

async function eveningCheck() {
  const meta = await caches.open(META);
  const saved = await meta.match("reminder");
  const prefs = saved ? await saved.json() : { evening: true, eveningAt: "20:00" };
  if (!prefs.evening) return;
  const now = new Date();
  const day = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [h, m] = prefs.eveningAt.split(":").map(Number);
  const bkk = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  if (bkk.getHours() * 60 + bkk.getMinutes() < h * 60 + m) return;
  const sent = await meta.match("evening-sent");
  if (sent && (await sent.text()) === day) return;
  const res = await fetch(`${scope}api/today`).catch(() => null);
  if (!res || !res.ok) return;
  const today = await res.json();
  if (today.practisedToday || !today.streak) return;
  const left = 24 - bkk.getHours();
  await meta.put("evening-sent", new Response(day));
  await show({
    title: `อย่าเพิ่งเสียวันติด ${today.streak} วัน`,
    body: `ยังไม่ได้ฝึก “${today.word.word}” อีก ${left} ชม. ถึงเที่ยงคืน · ${today.nextMedal && today.nextMedal.left === 1 ? `ฝึกวันนี้รับเหรียญ ${today.nextMedal.days} วันติด` : "ใช้เวลาไม่ถึง 2 นาที"}`,
    tag: "evening-streak",
    url: `${scope}practice`,
  });
}
