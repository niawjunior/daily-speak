import { useLocalStorage } from "@vueuse/core";
import { ref } from "vue";

// Goes up when the demo starts again — the page on screen is drawn afresh.
export const demoRound = ref(0);

// The learner's choices, kept on this phone.
export const settings = useLocalStorage("daily-speak:settings", {
  accent: "en-US" as "en-US" | "en-GB",
  rate: 0.9,
  checker: "google" as "google" | "sim",
  remind: true,
  remindAt: "08:00",
  // The evening reminder, sent only on a day not practised yet — before the streak is lost.
  evening: true,
  eveningAt: "20:00",
}, { mergeDefaults: true });
