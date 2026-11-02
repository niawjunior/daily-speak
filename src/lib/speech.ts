// Listening and speaking. "google" is the browser's own speech recognition (Google's speech-to-text in Chrome and
// Android, Apple's in Safari) — no key needed. "sim" is the simulated listener (จำลอง): it "hears" the sentence word by
// word, mishearing one word the first time, so the story can be shown anywhere — no microphone needed.

export interface Listening {
  stop(): void;
}

export interface ListenOptions {
  sentence: string;
  lang: string;
  slip?: [string, string] | null;
  onText(text: string, final: boolean): void;
  onEnd(): void;
  onError(message: string, fallback: boolean): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Recognition: any = typeof window !== "undefined" ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : undefined;
export const canListen = !!Recognition;

const errors: Record<string, [string, boolean]> = {
  "not-allowed": ["ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน — เปลี่ยนเป็นโหมดจำลองให้ก่อน", true],
  "service-not-allowed": ["เบราว์เซอร์นี้ใช้ตัวตรวจเสียงไม่ได้ — เปลี่ยนเป็นโหมดจำลองให้ก่อน", true],
  network: ["เชื่อมต่อตัวตรวจเสียงไม่ได้ — เปลี่ยนเป็นโหมดจำลองให้ก่อน", true],
  "audio-capture": ["ไม่พบไมโครโฟน — เปลี่ยนเป็นโหมดจำลองให้ก่อน", true],
  "no-speech": ["ไม่ได้ยินเสียง — แตะไมค์แล้วพูดใกล้ๆ อีกครั้ง", false],
};

export function listenGoogle(o: ListenOptions): Listening {
  const r = new Recognition();
  r.lang = o.lang;
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  let ended = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onresult = (e: any) => {
    let text = "";
    let final = true;
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript + " ";
      if (!e.results[i].isFinal) final = false;
    }
    o.onText(text.trim(), final);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onerror = (e: any) => {
    if (e.error === "aborted") return;
    const [message, fallback] = errors[e.error] ?? ["ตรวจเสียงไม่สำเร็จ — ลองอีกครั้ง", false];
    ended = true; // its end comes after this — not a result
    o.onError(message, fallback);
  };
  r.onend = () => {
    if (!ended) (ended = true), o.onEnd();
  };
  try {
    r.start();
  } catch {
    ended = true;
    o.onError("เริ่มฟังไม่ได้ — เปลี่ยนเป็นโหมดจำลองให้ก่อน", true);
  }
  return { stop: () => r.stop() };
}

export function listenSim(o: ListenOptions): Listening {
  const strip = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");
  const words = o.sentence.split(/\s+/).flatMap((w) => (o.slip && strip(w) === strip(o.slip[0]) ? o.slip[1].split(" ") : [w.replace(/[.,?!]/g, "")]));
  let at = 0;
  let timer = 0;
  const done = () => {
    window.clearTimeout(timer);
    o.onText(words.slice(0, Math.max(at, 1)).join(" "), true);
    o.onEnd();
  };
  const step = () => {
    at++;
    if (at >= words.length) return done();
    o.onText(words.slice(0, at).join(" "), false);
    timer = window.setTimeout(step, 320 + Math.random() * 180);
  };
  timer = window.setTimeout(step, 700);
  return {
    stop: () => {
      if (at < words.length) (at = words.length), done();
    },
  };
}

// Says a sentence or a word aloud with the browser's own voice.
export function say(text: string, lang: string, rate: number): void {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voice = speechSynthesis.getVoices().find((v) => v.lang === lang) ?? speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
