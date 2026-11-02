// New words by an LLM through Vercel AI Gateway (OpenAI-compatible) — and, with no key, from a reserve of ready-made
// words labelled จำลอง, so the demo works the same after the key is revoked.
import type { Category, Sentence, Word } from "../src/data/bank";

export const GATEWAY = "https://ai-gateway.vercel.sh/v1";
export const MODELS = [
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", note: "เร็วและประหยัดที่สุด" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", note: "ประโยคเป็นธรรมชาติกว่า" },
  { id: "anthropic/claude-haiku-5.5", name: "Claude Haiku 5.5", note: "เคล็ดลับออกเสียงละเอียด" },
  { id: "openai/gpt-5-mini", name: "GPT-5 mini", note: "ทางเลือกจาก OpenAI" },
] as const;

const CATEGORIES: Category[] = ["home", "work", "food", "travel", "shopping", "social"];
const LEVELS = ["A1", "A2", "B1"] as const;

export type NewWord = Omit<Word, "id">;
export class AiError extends Error {}

// The key from the page (kept on the phone), else the server's own (AI_GATEWAY_API_KEY, as `vercel ai-gateway setup` sets).
export const serverKey = () => process.env.AI_GATEWAY_API_KEY?.trim() || "";

async function chat(key: string, model: string, messages: { role: "system" | "user"; content: string }[], json: boolean): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.9, ...(json ? { response_format: { type: "json_object" } } : {}) }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new AiError("ติดต่อ Vercel AI Gateway ไม่ได้ — ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง");
  }
  if (res.status === 401 || res.status === 403) throw new AiError("API key ไม่ถูกต้อง หรือถูกยกเลิกแล้ว");
  if (res.status === 402) throw new AiError("เครดิตของ AI Gateway หมด — เติมเครดิตในบัญชี Vercel");
  if (res.status === 429) throw new AiError("เรียกใช้ถี่เกินไป — รอสักครู่แล้วลองใหม่");
  if (res.status === 404 || res.status === 400) throw new AiError(`โมเดล ${model} ใช้ไม่ได้กับคีย์นี้ — ลองเลือกโมเดลอื่น`);
  if (!res.ok) throw new AiError(`AI Gateway ตอบกลับผิดพลาด (${res.status}) — ลองอีกครั้ง`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

// A short call to show the key and the model work.
export async function ping(key: string, model: string): Promise<{ ms: number; reply: string }> {
  const t = Date.now();
  const reply = await chat(key, model, [{ role: "user", content: "Reply with exactly: Daily Speak ready" }], false);
  return { ms: Date.now() - t, reply: reply.trim().slice(0, 80) };
}

export async function generate(key: string, model: string, o: { level: string; category: string; avoid: string[] }): Promise<NewWord> {
  const category = CATEGORIES.includes(o.category as Category) ? o.category : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!;
  const level = LEVELS.includes(o.level as (typeof LEVELS)[number]) ? o.level : "A2";
  const system = `You create one everyday English word a day for Thai adults practising speaking on a phone app.
Answer with one JSON object only, no markdown:
{"word": string (lower case, one word), "ipa": string (US IPA between slashes), "pos": Thai part of speech e.g. "คำนาม" | "คำกริยา" | "คำคุณศัพท์",
 "meaning": short Thai meaning, "tip": one Thai sentence on how to pronounce it (stress, sounds Thai speakers get wrong),
 "sentences": [3 x {"en": short natural sentence 4-8 words using the word, "th": natural Thai translation,
   "slip": [a word from that sentence that is hard for Thai speakers, a similar-sounding word or two a speech recogniser might hear instead]}]}`;
  const user = `Category: ${category} (home, work, food, travel, shopping or social life). CEFR level: ${level}.
Pick a common, useful word. Do not use any of these: ${o.avoid.join(", ")}.`;
  const text = await chat(key, model, [{ role: "system", content: system }, { role: "user", content: user }], true);
  return { ...parse(text, o.avoid), category: category as Category, level: level as Word["level"], source: "ai", model };
}

function parse(text: string, avoid: string[]): Omit<NewWord, "category" | "level"> {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    throw new AiError("AI ตอบกลับมาไม่ครบ — กดสร้างอีกครั้ง");
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const word = str(raw.word).toLowerCase();
  const list = Array.isArray(raw.sentences) ? raw.sentences : [];
  const sentences: Sentence[] = list.slice(0, 3).map((s: Record<string, unknown>) => {
    const en = str(s?.en);
    const slip = Array.isArray(s?.slip) ? s.slip.map(str) : [];
    const said = en.split(/\s+/).map((w) => w.replace(/[^A-Za-z']/g, ""));
    // The misheard word must be one of the sentence — else take its longest word.
    const hard = said.find((w) => w.toLowerCase() === (slip[0] ?? "").toLowerCase()) ?? [...said].sort((a, b) => b.length - a.length)[0] ?? word;
    return { en, th: str(s?.th), slip: [hard, slip[1] || hard.slice(0, Math.max(2, hard.length - 2))] as [string, string] };
  });
  if (!word || !str(raw.meaning) || sentences.length < 3 || sentences.some((s) => !s.en || !s.th)) throw new AiError("AI ตอบกลับมาไม่ครบ — กดสร้างอีกครั้ง");
  if (avoid.includes(word)) throw new AiError(`AI เสนอคำที่มีอยู่แล้ว (${word}) — กดสร้างอีกครั้ง`);
  return { word, ipa: str(raw.ipa) || "/—/", pos: str(raw.pos) || "คำนาม", meaning: str(raw.meaning), tip: str(raw.tip) || "ฟังตัวอย่างแล้วพูดตามช้าๆ", sentences };
}

// ——— จำลอง: ready-made words, used in turn when no key is set ———
const reserve: Omit<NewWord, "source" | "model">[] = [
  {
    word: "umbrella", ipa: "/ʌmˈbrel.ə/", pos: "คำนาม", meaning: "ร่ม", category: "home", level: "A1",
    tip: "เน้นพยางค์กลาง “BREL” ไม่ใช่ “อัม-เบร-ล่า” เท่ากันทุกพยางค์",
    sentences: [
      { en: "Don't forget your umbrella today.", th: "วันนี้อย่าลืมพกร่มนะ", slip: ["umbrella", "a brella"] },
      { en: "Can I borrow your umbrella?", th: "ขอยืมร่มหน่อยได้ไหม", slip: ["borrow", "barrow"] },
      { en: "I left my umbrella on the bus.", th: "ฉันลืมร่มไว้บนรถเมล์", slip: ["left", "lift"] },
    ],
  },
  {
    word: "overtime", ipa: "/ˈoʊ.vɚ.taɪm/", pos: "คำนาม", meaning: "การทำงานล่วงเวลา (โอที)", category: "work", level: "B1",
    tip: "เน้น “OH” ที่พยางค์แรก แล้วลากเสียง “taim” ให้ชัด",
    sentences: [
      { en: "I worked overtime last night.", th: "เมื่อคืนฉันทำโอที", slip: ["overtime", "over time"] },
      { en: "Do we get paid for overtime?", th: "ทำโอทีได้ค่าจ้างไหม", slip: ["paid", "bed"] },
      { en: "She refused to work overtime.", th: "เธอปฏิเสธที่จะทำโอที", slip: ["refused", "refuse"] },
    ],
  },
  {
    word: "takeaway", ipa: "/ˈteɪk.ə.weɪ/", pos: "คำนาม", meaning: "อาหารสั่งกลับบ้าน", category: "food", level: "A2",
    tip: "พูดต่อกันเป็นคำเดียว “TAY-kuh-way” เน้นพยางค์แรก",
    sentences: [
      { en: "Let's order a takeaway tonight.", th: "คืนนี้สั่งอาหารกลับบ้านกันเถอะ", slip: ["takeaway", "take away"] },
      { en: "Is this for here or takeaway?", th: "ทานที่นี่หรือกลับบ้าน", slip: ["here", "hair"] },
      { en: "The takeaway is still warm.", th: "อาหารที่ซื้อกลับมายังอุ่นอยู่", slip: ["warm", "worm"] },
    ],
  },
  {
    word: "traffic", ipa: "/ˈtræf.ɪk/", pos: "คำนาม", meaning: "การจราจร รถติด", category: "travel", level: "A1",
    tip: "เสียง “træ” อ้าปากกว้างแบบ แอ และปิดท้ายด้วย k ให้ได้ยิน",
    sentences: [
      { en: "The traffic is terrible today.", th: "วันนี้รถติดมาก", slip: ["terrible", "terable"] },
      { en: "Sorry, I got stuck in traffic.", th: "ขอโทษนะ ฉันติดอยู่ในรถติด", slip: ["stuck", "stock"] },
      { en: "Let's leave early to avoid traffic.", th: "ออกเร็วหน่อยจะได้ไม่เจอรถติด", slip: ["avoid", "a void"] },
    ],
  },
  {
    word: "bargain", ipa: "/ˈbɑːr.ɡɪn/", pos: "คำนาม", meaning: "ของถูกคุ้มค่า", category: "shopping", level: "B1",
    tip: "เน้น “BAR” และพยางค์หลังเบาๆ “gin” ไม่ใช่ “เกน”",
    sentences: [
      { en: "This jacket was a real bargain.", th: "แจ็กเก็ตตัวนี้ถูกและคุ้มมาก", slip: ["bargain", "bar gain"] },
      { en: "I love hunting for bargains.", th: "ฉันชอบตามหาของลดราคา", slip: ["hunting", "hunting a"] },
      { en: "Is this the bargain price?", th: "นี่คือราคาพิเศษแล้วใช่ไหม", slip: ["price", "prize"] },
    ],
  },
  {
    word: "apologize", ipa: "/əˈpɑː.lə.dʒaɪz/", pos: "คำกริยา", meaning: "ขอโทษ", category: "social", level: "A2",
    tip: "เน้นพยางค์ที่สอง “PAH” และปิดท้ายเสียง z ไม่ใช่ s",
    sentences: [
      { en: "I apologize for being late.", th: "ขอโทษที่มาสาย", slip: ["apologize", "apology"] },
      { en: "You should apologize to her.", th: "คุณควรไปขอโทษเธอนะ", slip: ["should", "shoot"] },
      { en: "He called to apologize this morning.", th: "เขาโทรมาขอโทษเมื่อเช้า", slip: ["morning", "mourning"] },
    ],
  },
];

export async function simulate(o: { avoid: string[]; category: string }): Promise<NewWord> {
  await new Promise((r) => setTimeout(r, 1400));
  const left = reserve.filter((w) => !o.avoid.includes(w.word));
  if (!left.length) throw new AiError("คำในโหมดจำลองหมดแล้ว — ใส่ API key เพื่อให้ AI สร้างคำใหม่ได้ไม่จำกัด");
  const pick = left.find((w) => w.category === o.category) ?? left[0]!;
  return { ...pick, source: "sim", model: "จำลอง" };
}

// ——— AI voice: text to speech through AI Gateway (its speech-model API; the audio comes back as base64 WAV) ———
export const TTS_MODEL = "google/gemini-3.8-flash-tts";
export const VOICES = [
  { id: "Kore", name: "Kore", note: "เสียงผู้หญิง ชัดถ้อยชัดคำ" },
  { id: "Puck", name: "Puck", note: "เสียงผู้ชาย สดใส" },
  { id: "Zephyr", name: "Zephyr", note: "เสียงผู้หญิง สว่าง เป็นกันเอง" },
  { id: "Charon", name: "Charon", note: "เสียงผู้ชาย นุ่ม น่าฟัง" },
] as const;

// Each sentence is made once per voice and accent, then said again from here — no second charge.
const spoken = new Map<string, string>();

export async function speak(key: string, o: { text: string; voice: string; accent: string }): Promise<{ audio: string; cached: boolean }> {
  const voice = VOICES.some((v) => v.id === o.voice) ? o.voice : "Kore";
  const accent = o.accent === "en-GB" ? "a British" : "an American";
  const id = `${voice}|${accent}|${o.text}`;
  const hit = spoken.get(id);
  if (hit) return { audio: hit, cached: true };
  let res: Response;
  try {
    res = await fetch("https://ai-gateway.vercel.sh/v4/ai/speech-model", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "ai-gateway-protocol-version": "0.0.1",
        "ai-speech-model-specification-version": "4",
        "ai-model-id": TTS_MODEL,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: o.text,
        voice,
        outputFormat: "wav",
        instructions: `Say it exactly as written, clearly and naturally, with ${accent} accent, for a Thai learner of English.`,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AiError("ติดต่อ Vercel AI Gateway ไม่ได้ — ใช้เสียงของเครื่องแทน");
  }
  if (res.status === 401 || res.status === 403) throw new AiError("API key ไม่ถูกต้อง หรือถูกยกเลิกแล้ว — ใช้เสียงของเครื่องแทน");
  if (res.status === 402) throw new AiError("เครดิตของ AI Gateway หมด — ใช้เสียงของเครื่องแทน");
  if (!res.ok) throw new AiError(`สร้างเสียง AI ไม่สำเร็จ (${res.status}) — ใช้เสียงของเครื่องแทน`);
  const data = (await res.json()) as { audio?: string };
  if (!data.audio) throw new AiError("AI ไม่ได้ส่งเสียงกลับมา — ใช้เสียงของเครื่องแทน");
  if (spoken.size > 300) spoken.delete(spoken.keys().next().value!);
  spoken.set(id, data.audio);
  return { audio: data.audio, cached: false };
}
