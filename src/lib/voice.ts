import { ref } from "vue";
import { toast } from "vue-sonner";
import { api } from "@/lib/api";
import { settings } from "@/lib/settings";

// The AI voice (Gemini 3.8 Flash TTS through the server and AI Gateway). Each text is made once and kept here as a
// playable file; speed is the player's own, so "ฟังช้าๆ" needs no second call.
const made = new Map<string, Promise<string | null>>();
let playing: HTMLAudioElement | null = null;
// The text being made into speech right now — for a spinner where it is wanted.
export const voiceLoading = ref<string | null>(null);

const idOf = (text: string, accent: string, voice = settings.value.aiVoice) => `${voice}|${accent}|${text}`;

function fetchVoice(text: string, accent: string, voice = settings.value.aiVoice): Promise<string | null> {
  const id = idOf(text, accent, voice);
  const known = made.get(id);
  if (known) return known;
  const p = api.ai.speech.post({ key: settings.value.aiKey || undefined, text, voice, accent }).then(({ data, error }) => {
    if (error || !data) {
      made.delete(id);
      const message = (error?.value as { error?: string } | undefined)?.error;
      throw new Error(typeof message === "string" ? message : "สร้างเสียง AI ไม่สำเร็จ — ใช้เสียงของเครื่องแทน");
    }
    const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: data.mime }));
  });
  made.set(id, p);
  return p;
}

export function stopVoice(): void {
  playing?.pause();
}

// One player for the whole app, started (silent) inside the press itself — so a phone (iPhone above all) still lets it
// play once the voice arrives a few seconds later.
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
function player(): HTMLAudioElement {
  if (!playing) {
    playing = new Audio();
    playing.src = SILENT;
    void playing.play().catch(() => undefined);
  }
  return playing;
}

// Says `text` in the AI voice; false when it could not (the caller then uses the phone's own voice).
let warned = false;
export async function sayAi(text: string, accent: string, rate: number, voice?: string): Promise<boolean> {
  const audio = player();
  audio.pause();
  const id = idOf(text, accent, voice);
  voiceLoading.value = id;
  try {
    const url = await fetchVoice(text, accent, voice);
    if (!url || voiceLoading.value !== id) return !!url;
    audio.src = url;
    // 0.9 is "ปกติ" on the phone's voice — the AI voice already speaks at a learner's pace.
    audio.defaultPlaybackRate = audio.playbackRate = Math.min(1.3, Math.max(0.7, rate / 0.9));
    await audio.play();
    return true;
  } catch (e) {
    if (!warned) toast.error(e instanceof Error && e.message ? e.message : "เล่นเสียง AI ไม่ได้ — ใช้เสียงของเครื่องแทน");
    warned = true;
    return false;
  } finally {
    if (voiceLoading.value === id) voiceLoading.value = null;
  }
}

// Makes the voice of today's word and sentences ahead, so the first press plays at once.
export async function preloadVoice(texts: string[]): Promise<void> {
  if (settings.value.voice !== "ai") return;
  for (const text of texts) await fetchVoice(text, settings.value.accent).catch(() => null);
}
