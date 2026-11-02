import { useLocalStorage } from "@vueuse/core";
import { ref } from "vue";

// Goes up when the demo starts again — the page on screen is drawn afresh.
export const demoRound = ref(0);

// The learner's choices, kept on this phone.
export const settings = useLocalStorage("daily-speak:settings", {
  // The name in the greeting — empty: the demo's sample learner (server/data.ts).
  name: "",
  accent: "en-US" as "en-US" | "en-GB",
  rate: 0.9,
  checker: "google" as "google" | "sim",
  remind: true,
  remindAt: "08:00",
  // The evening reminder, sent only on a day not practised yet — before the streak is lost.
  evening: true,
  eveningAt: "20:00",
  // New words by AI (Vercel AI Gateway): the key stays on this phone, sent only when a word is made.
  aiKey: "",
  aiModel: "google/gemini-2.5-flash-lite",
  aiDaily: false,
  aiLevel: "A2" as "A1" | "A2" | "B1",
  aiCategory: "any",
  // The voice of every "ฟัง" button: the phone's own, or the AI voice (Gemini 3.8 Flash TTS through AI Gateway).
  voice: "device" as "device" | "ai",
  aiVoice: "Kore",
}, { mergeDefaults: true });
