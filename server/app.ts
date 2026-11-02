import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { AiError, generate, MODELS, ping, serverKey, simulate, speak, TTS_MODEL, VOICES } from "./ai";
import { aiDays, attempts, dateOfDay, dayKey, dayNumber, learner, seedAttempts, wordOfDay, words, type Attempt, type Word } from "./data";

// Deployed under a path (sales-demo/<app>/): built and started with BASE_PATH=/<app>/ — the page, the API and their docs
// all live under it. "/" when run on its own.
export const BASE = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");

const today = () => dayKey(new Date());

// The best score of each sentence of a word, null when not said yet.
function bests(word: Word): (number | null)[] {
  return word.sentences.map((_, i) => {
    const mine = attempts.filter((a) => a.wordId === word.id && a.sentence === i);
    return mine.length ? Math.max(...mine.map((a) => a.score)) : null;
  });
}

function summary(word: Word, day: number) {
  const best = bests(word);
  const said = best.filter((b): b is number => b !== null);
  return {
    ...word,
    day,
    date: dateOfDay(day),
    best,
    score: said.length ? Math.round(said.reduce((s, b) => s + b, 0) / said.length) : null,
    done: said.length === word.sentences.length,
    tries: attempts.filter((a) => a.wordId === word.id).length,
  };
}

// The days practised, as Bangkok dates.
const practisedDays = () => new Set(attempts.map((a) => dayKey(new Date(a.at))));

function streakOf(days: Set<string>): { current: number; best: number } {
  const n = dayNumber(today());
  let current = 0;
  for (let d = days.has(today()) ? n : n - 1; d >= 1 && days.has(dateOfDay(d)); d--) current++;
  let best = 0;
  let run = 0;
  for (let d = 1; d <= n; d++) {
    run = days.has(dateOfDay(d)) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best };
}

// Medals for practising days in a row — each run that reaches the mark earns it once more.
const MEDALS = [
  { days: 7, name: "เหรียญนักพูดหนึ่งสัปดาห์", tier: "bronze" as const },
  { days: 30, name: "เหรียญนักพูดหนึ่งเดือน", tier: "gold" as const },
];

function medalsOf(days: Set<string>) {
  const n = dayNumber(today());
  const { current } = streakOf(days);
  return MEDALS.map((m) => {
    const earned: string[] = [];
    let run = 0;
    for (let d = 1; d <= n; d++) {
      run = days.has(dateOfDay(d)) ? run + 1 : 0;
      if (run === m.days) earned.push(dateOfDay(d));
    }
    return { ...m, earned, count: earned.length, progress: Math.min(current, m.days) };
  });
}

// The API, under /api — the page calls it through Eden (src/lib/api.ts), typed end to end.
export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(openapi({ path: "/openapi", documentation: { info: { title: "API", version: "0.1.0" }, servers: BASE === "/" ? undefined : [{ url: BASE.slice(0, -1) }] } }))
  .get("/today", () => {
    const key = today();
    const day = dayNumber(key);
    const days = practisedDays();
    const streak = streakOf(days).current;
    // The next medal to aim for in this run.
    const next = MEDALS.find((m) => m.days > streak) ?? null;
    return { learner, date: key, word: summary(wordOfDay(key), day), streak, practisedToday: days.has(key), nextMedal: next && { ...next, left: next.days - streak } };
  })
  // Every word received so far, newest first.
  .get("/words", () => {
    const n = dayNumber(today());
    const seen = new Map<number, ReturnType<typeof summary>>();
    for (let d = n; d >= 1; d--) {
      const w = wordOfDay(dateOfDay(d));
      if (!seen.has(w.id)) seen.set(w.id, summary(w, d));
    }
    return [...seen.values()];
  })
  .get("/words/:id", ({ params, status }) => {
    const n = dayNumber(today());
    for (let d = n; d >= 1; d--) {
      const w = wordOfDay(dateOfDay(d));
      if (w.id === params.id) return summary(w, d);
    }
    return status(404, { error: "not found" });
  }, { params: t.Object({ id: t.Numeric() }) })
  .get("/progress", () => {
    const days = practisedDays();
    const n = dayNumber(today());
    const last7 = Array.from({ length: 7 }, (_, k) => {
      const date = dateOfDay(n - 6 + k);
      const mine = attempts.filter((a) => dayKey(new Date(a.at)) === date);
      return { date, tries: mine.length, score: mine.length ? Math.round(mine.reduce((s, a) => s + a.score, 0) / mine.length) : null };
    });
    const calendar = Array.from({ length: 28 }, (_, k) => {
      const date = dateOfDay(n - 27 + k);
      return { date, practised: days.has(date), started: date >= learner.startedOn };
    });
    const misses = new Map<string, number>();
    for (const a of attempts) for (const m of a.missed) misses.set(m.toLowerCase(), (misses.get(m.toLowerCase()) ?? 0) + 1);
    const tough = [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ word, count }));
    const firstTry = new Map<string, Attempt>();
    for (const a of attempts) if (!firstTry.has(`${a.wordId}-${a.sentence}`)) firstTry.set(`${a.wordId}-${a.sentence}`, a);
    const perfect = attempts.filter((a) => a.score === 100).length;
    return {
      streak: streakOf(days),
      medals: medalsOf(days),
      words: new Set(attempts.map((a) => a.wordId)).size,
      sentences: firstTry.size,
      tries: attempts.length,
      score: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0,
      perfect,
      last7,
      calendar,
      tough,
    };
  })
  .post(
    "/attempts",
    ({ body }) => {
      const firstToday = !practisedDays().has(today());
      const attempt: Attempt = { id: Math.max(0, ...attempts.map((a) => a.id)) + 1, ...body, at: new Date().toISOString() };
      attempts.push(attempt);
      const streak = streakOf(practisedDays()).current;
      // The first practice of the day that brings the streak to a mark earns its medal.
      const medal = firstToday ? (MEDALS.find((m) => m.days === streak) ?? null) : null;
      return { attempt, streak, medal };
    },
    { body: t.Object({ wordId: t.Number(), sentence: t.Number(), score: t.Number({ minimum: 0, maximum: 100 }), missed: t.Array(t.String()) }) },
  )
  // Back to the sample history, so the story can be shown again.
  .post("/reset", () => {
    seedAttempts();
    return { ok: true };
  })
  // ——— New words by AI (server/ai.ts). The key comes from the page (kept on the phone), else the server's own. ———
  .get("/ai", () => ({
    models: MODELS,
    voices: VOICES,
    ttsModel: TTS_MODEL,
    serverKey: !!serverKey(),
    made: words
      .filter((w) => w.source)
      .map((w) => ({ id: w.id, word: w.word, meaning: w.meaning, category: w.category, level: w.level, source: w.source!, model: w.model ?? "", createdOn: w.createdOn ?? "", today: aiDays.get(today()) === w.id }))
      .reverse(),
  }))
  .post(
    "/ai/test",
    async ({ body, status }) => {
      const key = body.key?.trim() || serverKey();
      if (!key) return status(400, { error: "ยังไม่ได้ใส่ API key" });
      try {
        return { ok: true, ...(await ping(key, body.model)) };
      } catch (e) {
        return status(e instanceof AiError ? 400 : 500, { error: e instanceof AiError ? e.message : "ทดสอบไม่สำเร็จ — ลองอีกครั้ง" });
      }
    },
    { body: t.Object({ key: t.Optional(t.String()), model: t.String() }) },
  )
  // A sentence or a word in the AI voice (WAV, base64) — the page falls back to the phone's own voice on an error.
  .post(
    "/ai/speech",
    async ({ body, status }) => {
      const key = body.key?.trim() || serverKey();
      if (!key) return status(400, { error: "ยังไม่ได้ใส่ API key — ใช้เสียงของเครื่องแทน" });
      try {
        return { mime: "audio/wav", ...(await speak(key, { text: body.text.slice(0, 300), voice: body.voice, accent: body.accent })) };
      } catch (e) {
        return status(e instanceof AiError ? 400 : 500, { error: e instanceof AiError ? e.message : "สร้างเสียง AI ไม่สำเร็จ — ใช้เสียงของเครื่องแทน" });
      }
    },
    { body: t.Object({ key: t.Optional(t.String()), text: t.String({ minLength: 1 }), voice: t.String(), accent: t.String() }) },
  )
  // Makes today's word anew: through AI Gateway with a key, else from the จำลอง reserve.
  .post(
    "/ai/generate",
    async ({ body, status }) => {
      const key = body.key?.trim() || serverKey();
      const avoid = words.map((w) => w.word.toLowerCase());
      try {
        const made = key ? await generate(key, body.model, { level: body.level, category: body.category, avoid }) : await simulate({ avoid, category: body.category });
        const word: Word = { ...made, id: Math.max(...words.map((w) => w.id)) + 1, createdOn: today() };
        words.push(word);
        aiDays.set(today(), word.id);
        return { word: summary(word, dayNumber(today())) };
      } catch (e) {
        return status(e instanceof AiError ? 400 : 500, { error: e instanceof AiError ? e.message : "สร้างคำไม่สำเร็จ — ลองอีกครั้ง" });
      }
    },
    { body: t.Object({ key: t.Optional(t.String()), model: t.String(), level: t.String(), category: t.String() }) },
  );

export type App = typeof app;
