import { useLocalStorage } from "@vueuse/core";
import { api } from "@/lib/api";
import { addAiWord, knownWords } from "@/lib/journal";
import { settings } from "@/lib/settings";

// Today's word made anew by AI — the server calls Vercel AI Gateway (or the จำลอง reserve with no key); the word is
// kept on this phone and becomes today's word.
export async function makeTodayWord() {
  const s = settings.value;
  const { data, error } = await api.ai.generate.post({ key: s.aiKey || undefined, model: s.aiModel, level: s.aiLevel, category: s.aiCategory, avoid: knownWords() });
  if (error) {
    const message = (error.value as { error?: string } | undefined)?.error;
    return { error: typeof message === "string" ? message : "สร้างคำไม่สำเร็จ — ลองอีกครั้ง" };
  }
  return { word: addAiWord(data.word) };
}

// "vck_AbCd••••WxYz" — enough to know which key it is.
export const masked = (key: string) => (key.length > 12 ? `${key.slice(0, 8)}••••${key.slice(-4)}` : "••••");

// The day the daily word was last asked for, so a failing call is not repeated on every visit.
export const aiTriedOn = useLocalStorage("daily-speak:ai-tried", "");

export const modelName = (id?: string) =>
  ({
    "google/gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "anthropic/claude-haiku-5.5": "Claude Haiku 5.5",
    "openai/gpt-5-mini": "GPT-5 mini",
  })[id ?? ""] ?? id ?? "";
