import { useLocalStorage } from "@vueuse/core";
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import { reminderFacts, todayOf } from "@/lib/journal";
import { settings } from "@/lib/settings";

// Daily Speak as an app on the phone: installed on the home screen, and reminders as the phone's own notifications.
const BASE = import.meta.env.BASE_URL;

// ——— Installing ———
type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: InstallEvent | null = null;
export const canPrompt = ref(false);
export const installed = ref(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
// The steps by hand, when the browser has no install button of its own (iPhone, or not offered yet).
export const installGuide = ref(false);
export const installHidden = useLocalStorage("daily-speak:install-hidden", false);

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as InstallEvent;
  canPrompt.value = true;
});
window.addEventListener("appinstalled", () => {
  installed.value = true;
  canPrompt.value = false;
  toast.success("ติดตั้ง Daily Speak บนหน้าจอโฮมแล้ว");
});

export async function install(): Promise<void> {
  if (!deferred) return void (installGuide.value = true);
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  canPrompt.value = false;
  if (outcome === "dismissed") toast("ยังไม่ได้ติดตั้ง — กดติดตั้งได้อีกครั้งจากหน้าตั้งค่า");
}

// ——— Notifications ———
export const permission = ref<NotificationPermission | "unsupported">("Notification" in window ? Notification.permission : "unsupported");

export async function allow(): Promise<boolean> {
  if (!("Notification" in window)) {
    toast.error(isIOS ? "บน iPhone ต้องติดตั้งแอปลงหน้าจอโฮมก่อน จึงจะเปิดแจ้งเตือนได้" : "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
    return false;
  }
  permission.value = await Notification.requestPermission();
  if (permission.value === "granted") toast.success("เปิดการแจ้งเตือนแล้ว");
  else if (permission.value === "denied") toast.error("การแจ้งเตือนถูกปิดไว้ — เปิดได้ที่การตั้งค่าเว็บไซต์ของเบราว์เซอร์");
  return permission.value === "granted";
}

export interface Note {
  title: string;
  body: string;
  // A page of the app, as the router knows it: "/practice".
  to: string;
  tag: string;
}
// A notification drawn inside the app, when the phone's own is not allowed — labelled จำลอง.
export const banner = ref<Note | null>(null);

// The phone's own notification when allowed, else the one in the app (unless `quiet`).
export async function notify(note: Note, quiet = false): Promise<"phone" | "app" | "none"> {
  if (permission.value === "granted") {
    const reg = await navigator.serviceWorker?.getRegistration(BASE);
    const options = { body: note.body, icon: `${BASE}icon-192.png`, badge: `${BASE}icon-192.png`, tag: note.tag, data: { url: `${BASE}${note.to.slice(1)}` } };
    try {
      if (reg) await reg.showNotification(note.title, options);
      else new Notification(note.title, options);
      return "phone";
    } catch {
      // Some browsers allow it only from an installed app — fall through to the one in the app.
    }
  }
  if (quiet) return "none";
  banner.value = note;
  return "app";
}

const minutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const localDay = (d = new Date()) => d.toLocaleDateString("en-CA");

// The evening reminder, from today's state: null on a day already practised — unless asked for as a sample, as it
// would come at `sampleAt`.
export function eveningNote(sampleAt?: string): Note | null {
  const data = todayOf();
  if (!sampleAt && (data.practisedToday || !data.streak)) return null;
  const hour = sampleAt ? Math.floor(minutes(sampleAt) / 60) : new Date().getHours();
  const left = Math.max(1, 24 - hour);
  const medal = data.nextMedal && data.nextMedal.left === 1 ? `ฝึกวันนี้รับเหรียญ ${data.nextMedal.days.toLocaleString("th-TH")} วันติด` : "ใช้เวลาไม่ถึง 2 นาที";
  return {
    title: data.streak ? `อย่าเพิ่งเสียวันติด ${data.streak.toLocaleString("th-TH")} วัน` : "วันนี้ยังไม่ได้ฝึกพูดเลย",
    body: `ยังไม่ได้ฝึก “${data.word.word}” อีก ${left.toLocaleString("th-TH")} ชม. ถึงเที่ยงคืน · ${medal}`,
    to: "/practice",
    tag: "evening-streak",
  };
}

function morningNote(): Note | null {
  const data = todayOf();
  if (data.practisedToday) return null;
  return { title: "คำใหม่ของวันนี้มาแล้ว", body: `“${data.word.word}” — ${data.word.meaning} · แตะเพื่อฟังแล้วพูดตาม`, to: "/", tag: "morning-word" };
}

// While the app is open, it checks every minute whether a reminder is due — once a day each.
const sent = useLocalStorage("daily-speak:reminders-sent", { morning: "", evening: "" });
async function check(): Promise<void> {
  const now = new Date();
  const at = now.getHours() * 60 + now.getMinutes();
  const day = localDay(now);
  const s = settings.value;
  if (s.evening && at >= minutes(s.eveningAt) && sent.value.evening !== day) {
    const note = eveningNote();
    sent.value.evening = day;
    if (note) await notify(note);
  } else if (s.remind && at >= minutes(s.remindAt) && at < minutes(s.eveningAt) && sent.value.morning !== day) {
    sent.value.morning = day;
    // The morning word goes only to the phone — no need to cover the page with it.
    const note = morningNote();
    if (note) await notify(note, true);
  }
}

// The evening time and the facts of the journal, kept where the service worker can read them for its own check.
async function share(name: string, value: unknown): Promise<void> {
  if (!("caches" in window)) return;
  const meta = await caches.open("daily-speak-meta");
  await meta.put(name, new Response(JSON.stringify(value)));
}

export async function startApp(): Promise<void> {
  window.setTimeout(check, 4000);
  window.setInterval(check, 60_000);
  watch(() => ({ evening: settings.value.evening, eveningAt: settings.value.eveningAt }), (prefs) => share("reminder", prefs), { immediate: true });
  watch(reminderFacts, (facts) => share("journal", facts), { immediate: true });
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE });
    // Chrome on Android wakes an installed app now and then: the evening check runs even when it is closed.
    const periodic = (reg as ServiceWorkerRegistration & { periodicSync?: { register(tag: string, o: { minInterval: number }): Promise<void> } }).periodicSync;
    await periodic?.register("streak-check", { minInterval: 60 * 60 * 1000 }).catch(() => undefined);
  } catch {
    // Not served over https (or a private window): the app works the same, without the offline copy.
  }
}
