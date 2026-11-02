import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { AiError, generate, MODELS, ping, serverKey, simulate, speak, TTS_MODEL, VOICES } from "./ai.js";

// Deployed under a path (sales-demo/<app>/): built and started with BASE_PATH=/<app>/ — the page, the API and their docs
// all live under it. "/" when run on its own.
export const BASE = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");

// The API, under /api — the page calls it through Eden (src/lib/api.ts), typed end to end.
// It only talks to AI (server/ai.ts) and keeps nothing of the learner: their practice stays on their phone
// (src/lib/journal.ts). The key comes from the page (kept on the phone), else the server's own.
export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(openapi({ path: "/openapi", documentation: { info: { title: "API", version: "0.2.0" }, servers: BASE === "/" ? undefined : [{ url: BASE.slice(0, -1) }] } }))
  .get("/ai", () => ({ models: MODELS, voices: VOICES, ttsModel: TTS_MODEL, serverKey: !!serverKey() }))
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
  // A new word: through AI Gateway with a key, else from the จำลอง reserve. `avoid` = the words the phone already has;
  // the phone keeps the word it gets back.
  .post(
    "/ai/generate",
    async ({ body, status }) => {
      const key = body.key?.trim() || serverKey();
      const avoid = body.avoid.map((w) => w.toLowerCase());
      try {
        return { word: key ? await generate(key, body.model, { level: body.level, category: body.category, avoid }) : await simulate({ avoid, category: body.category }) };
      } catch (e) {
        return status(e instanceof AiError ? 400 : 500, { error: e instanceof AiError ? e.message : "สร้างคำไม่สำเร็จ — ลองอีกครั้ง" });
      }
    },
    { body: t.Object({ key: t.Optional(t.String()), model: t.String(), level: t.String(), category: t.String(), avoid: t.Array(t.String({ maxLength: 40 }), { maxItems: 1000 }) }) },
  );

export type App = typeof app;
