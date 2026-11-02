import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import { computed, ref, shallowRef } from "vue";
import { words as bank, type Attempt, type Word } from "@/data/bank";
import { settings } from "@/lib/settings";

// The learner's own practice, kept on this phone: the day they started, their order of words, every sentence said, the
// words AI made for them. Nothing of it goes to the server — the server only talks to AI (server/ai.ts).
// Beside it, the demo: a sample learner who has practised for 19 days, shown from "เริ่มเดโม" in settings. The two never
// mix — leaving the demo brings back the learner's own journal as it was.
export interface Journal {
  startedOn: string; // Bangkok day, "2026-11-02"
  seed: number; // this phone's shuffle of the word bank
  attempts: Attempt[];
  made: Word[]; // words AI made
  aiDays: Record<string, number>; // a day → the AI word that took its place
}

const DAY = 86_400_000;
export const dayKey = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10); // Bangkok date
// The clock, once a minute — so "today" moves on at midnight while the app stays open.
const now = shallowRef(new Date());
window.setInterval(() => (now.value = new Date()), 60_000);
const todayKey = computed(() => dayKey(now.value));

const fresh = (): Journal => ({ startedOn: dayKey(new Date()), seed: Math.floor(Math.random() * 2_147_483_647), attempts: [], made: [], aiDays: {} });

export const mode = useLocalStorage<"real" | "demo">("daily-speak:mode", "real");
const mine = useLocalStorage<Journal>("daily-speak:journal", fresh(), { mergeDefaults: true });
const demo = useLocalStorage<Journal | null>("daily-speak:demo", null, { serializer: StorageSerializers.object });
const journal = computed<Journal>(() => (mode.value === "demo" && demo.value) || mine.value);
// Goes up when the journal on screen changes (demo in or out) — the page on screen is drawn afresh.
export const round = ref(0);

// ——— Days and words ———
const dayNumber = (j: Journal, key: string) => Math.round((Date.parse(key) - Date.parse(j.startedOn)) / DAY) + 1;
const dateOfDay = (j: Journal, n: number) => new Date(Date.parse(j.startedOn) + (n - 1) * DAY).toISOString().slice(0, 10);

// A fixed shuffle of the bank for a seed — each round of the bank in a new order.
const orders = new Map<number, number[]>();
function shuffled(seed: number): number[] {
  const hit = orders.get(seed);
  if (hit) return hit;
  const ids = bank.map((w) => w.id);
  let s = seed;
  const rand = () => ((s = (s * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  orders.set(seed, ids);
  return ids;
}

function wordOfDay(j: Journal, key: string): Word {
  const made = j.aiDays[key];
  const ai = made !== undefined && j.made.find((w) => w.id === made);
  if (ai) return ai;
  const n = Math.max(1, dayNumber(j, key));
  const ids = shuffled(j.seed + Math.floor((n - 1) / bank.length));
  return bank.find((w) => w.id === ids[(n - 1) % ids.length])!;
}

// The best score of each sentence of a word, null when not said yet.
const bests = (j: Journal, word: Word) =>
  word.sentences.map((_, i) => {
    const said = j.attempts.filter((a) => a.wordId === word.id && a.sentence === i);
    return said.length ? Math.max(...said.map((a) => a.score)) : null;
  });

function summary(j: Journal, word: Word, day: number) {
  const best = bests(j, word);
  const said = best.filter((b): b is number => b !== null);
  return {
    ...word,
    day,
    date: dateOfDay(j, day),
    best,
    score: said.length ? Math.round(said.reduce((s, b) => s + b, 0) / said.length) : null,
    done: said.length === word.sentences.length,
    tries: j.attempts.filter((a) => a.wordId === word.id).length,
  };
}
export type WordCard = ReturnType<typeof summary>;

// ——— Streak and medals ———
const practisedDays = (j: Journal) => new Set(j.attempts.map((a) => dayKey(new Date(a.at))));

function streakOf(j: Journal, days: Set<string>): { current: number; best: number } {
  const n = dayNumber(j, todayKey.value);
  let current = 0;
  for (let d = days.has(todayKey.value) ? n : n - 1; d >= 1 && days.has(dateOfDay(j, d)); d--) current++;
  let best = 0;
  let run = 0;
  for (let d = 1; d <= n; d++) {
    run = days.has(dateOfDay(j, d)) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best };
}

// Medals for practising days in a row — each run that reaches the mark earns it once more.
export const MEDALS = [
  { days: 7, name: "เหรียญนักพูดหนึ่งสัปดาห์", tier: "bronze" as const },
  { days: 30, name: "เหรียญนักพูดหนึ่งเดือน", tier: "gold" as const },
];

function medalsOf(j: Journal, days: Set<string>) {
  const n = dayNumber(j, todayKey.value);
  const { current } = streakOf(j, days);
  return MEDALS.map((m) => {
    const earned: string[] = [];
    let run = 0;
    for (let d = 1; d <= n; d++) {
      run = days.has(dateOfDay(j, d)) ? run + 1 : 0;
      if (run === m.days) earned.push(dateOfDay(j, d));
    }
    return { ...m, earned, count: earned.length, progress: Math.min(current, m.days) };
  });
}

// ——— What the pages read (reactive: call inside computed) ———
export function todayOf() {
  const j = journal.value;
  const key = todayKey.value;
  const days = practisedDays(j);
  const streak = streakOf(j, days).current;
  const next = MEDALS.find((m) => m.days > streak) ?? null;
  return {
    name: settings.value.name.trim() || (mode.value === "demo" ? "มายด์" : ""),
    date: key,
    word: summary(j, wordOfDay(j, key), dayNumber(j, key)),
    streak,
    practisedToday: days.has(key),
    nextMedal: next && { ...next, left: next.days - streak },
  };
}
export type Today = ReturnType<typeof todayOf>;

// Every word received so far, newest first.
export function wordsOf(): WordCard[] {
  const j = journal.value;
  const n = dayNumber(j, todayKey.value);
  const seen = new Map<number, WordCard>();
  for (let d = n; d >= 1; d--) {
    const w = wordOfDay(j, dateOfDay(j, d));
    if (!seen.has(w.id)) seen.set(w.id, summary(j, w, d));
  }
  return [...seen.values()];
}

export const wordOf = (id: number): WordCard | null => wordsOf().find((w) => w.id === id) ?? null;

export function progressOf() {
  const j = journal.value;
  const days = practisedDays(j);
  const n = dayNumber(j, todayKey.value);
  const last7 = Array.from({ length: 7 }, (_, k) => {
    const date = dateOfDay(j, n - 6 + k);
    const mine = j.attempts.filter((a) => dayKey(new Date(a.at)) === date);
    return { date, tries: mine.length, score: mine.length ? Math.round(mine.reduce((s, a) => s + a.score, 0) / mine.length) : null };
  });
  const calendar = Array.from({ length: 28 }, (_, k) => {
    const date = dateOfDay(j, n - 27 + k);
    return { date, practised: days.has(date), started: date >= j.startedOn };
  });
  const misses = new Map<string, number>();
  for (const a of j.attempts) for (const m of a.missed) misses.set(m.toLowerCase(), (misses.get(m.toLowerCase()) ?? 0) + 1);
  const tough = [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ word, count }));
  const sentences = new Set(j.attempts.map((a) => `${a.wordId}-${a.sentence}`));
  return {
    streak: streakOf(j, days),
    medals: medalsOf(j, days),
    words: new Set(j.attempts.map((a) => a.wordId)).size,
    sentences: sentences.size,
    tries: j.attempts.length,
    score: j.attempts.length ? Math.round(j.attempts.reduce((s, a) => s + a.score, 0) / j.attempts.length) : 0,
    perfect: j.attempts.filter((a) => a.score === 100).length,
    last7,
    calendar,
    tough,
  };
}
export type Progress = ReturnType<typeof progressOf>;

// ——— Changes ———
// A sentence said: kept, and the medal it earns when it is the first practice of the day that reaches a mark.
export function addAttempt(a: Omit<Attempt, "id" | "at">) {
  const j = journal.value;
  const firstToday = !practisedDays(j).has(todayKey.value);
  j.attempts.push({ ...a, id: Math.max(0, ...j.attempts.map((x) => x.id)) + 1, at: new Date().toISOString() });
  const streak = streakOf(j, practisedDays(j)).current;
  const medal = firstToday ? (MEDALS.find((m) => m.days === streak) ?? null) : null;
  return { streak, medal };
}

// Every word the learner has or could get — for AI to make one that is new.
export const knownWords = () => [...bank, ...journal.value.made].map((w) => w.word.toLowerCase());

// A word AI made (server/ai.ts): kept, and today's word from now on.
export function addAiWord(made: Omit<Word, "id">): WordCard {
  const j = journal.value;
  const word: Word = { ...made, id: Math.max(...bank.map((w) => w.id), ...j.made.map((w) => w.id)) + 1, createdOn: todayKey.value };
  j.made.push(word);
  j.aiDays[todayKey.value] = word.id;
  return summary(j, word, dayNumber(j, todayKey.value));
}

export const aiWordsOf = () =>
  [...journal.value.made].reverse().map((w) => ({ ...w, today: journal.value.aiDays[todayKey.value] === w.id }));

// What the service worker needs for its evening check while the app is closed (public/sw.js) — it cannot read the
// journal itself: the days practised lately, the words of the coming days, the medal marks.
export function reminderFacts() {
  const j = journal.value;
  const n = dayNumber(j, todayKey.value);
  const words: Record<string, string> = {};
  for (let d = n; d < n + 8; d++) words[dateOfDay(j, d)] = wordOfDay(j, dateOfDay(j, d)).word;
  return { practised: [...practisedDays(j)].sort().slice(-40), words, medals: MEDALS.map((m) => m.days) };
}

// ——— The demo ———
// The sample learner: started 19 days ago, practised every day but one — a week ago — so the streak stands at 6 and
// the first sentence said today earns the 7-day medal on screen. Today's word not yet practised.
function sample(): Journal {
  const today = dayKey(new Date());
  const j: Journal = { startedOn: new Date(Date.parse(today) - 19 * DAY).toISOString().slice(0, 10), seed: 20261006, attempts: [], made: [], aiDays: {} };
  const n = dayNumber(j, today);
  let id = 1;
  let seed = 7;
  const rand = () => ((seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647);
  for (let d = 1; d < n; d++) {
    if (d === n - 7) continue;
    const w = wordOfDay(j, dateOfDay(j, d));
    const base = Date.parse(dateOfDay(j, d)) + (12 + Math.floor(rand() * 10)) * 3_600_000 - 7 * 3_600_000;
    w.sentences.forEach((s, i) => {
      const tries = rand() < 0.45 ? 2 : 1;
      for (let t = 0; t < tries; t++) {
        const missed = t === tries - 1 && rand() < 0.75 ? [] : [s.slip[0]];
        const total = s.en.split(" ").length;
        j.attempts.push({ id: id++, wordId: w.id, sentence: i, score: Math.round(((total - missed.length) / total) * 100), missed, at: new Date(base + (i * 3 + t) * 60_000).toISOString() });
      }
    });
  }
  return j;
}

// Into the demo — afresh each time, so the story can be shown again.
export function startDemo(): void {
  demo.value = sample();
  mode.value = "demo";
  round.value++;
}
export function leaveDemo(): void {
  mode.value = "real";
  demo.value = null;
  round.value++;
}
