# Daily Speak ฝึกพูดอังกฤษวันละคำ

<!-- sup-plana:brief — written by the sup-plana runner from the app's page; edit it there, not here -->
- **What it is:** เดโม — a DEMO for a client meeting: polished, every step of the story the owner will walk through works, believable data; breadth over depth
- **For:** (not said) · **its owner on sup-plana:** เนี้ยว
- **Started from:** vue-elysia (Vue 3, Vite, Tailwind CSS 4, shadcn-vue, Elysia, Bun)

### What is needed (from its owner, as they wrote it)
ทำ app สำหรับฝึกภาษาอังกฤษ สำหรับใช้บน mobile อยากให้ random คำที่ใช้ในชีวิตประจำวัน วันละ 1 คำ พร้อมทั้ง ประโยคสั้นๆ ที่ให้เราพูดตาม แล้วใช้ google speech to text ในการเช็คว่าถูกมั้ย ถ้าไม่ถูก ให้บอกแบบ realtime ว่าคำไหนไม่ถูก ทำให้ ใช้งาน ux/ui ทันสมัย

### Its theme — “คาเฟ่อบอุ่น”, chosen when it was made
Build every page in it from the first version: these colours as the app's CSS variables (the page, cards and panels, buttons and links, a second colour, the text), these Google Fonts — a list is a stack: the first for Latin letters, the next for Thai — loaded once for the whole app. A ธีม its owner sends later replaces it.
```json
{"colors":{"text":"#2E2018","accent":"#D9A066","primary":"#8A5A3C","surface":"#F1E6D8","background":"#FBF7F2"},"fonts":{"body":"IBM Plex Sans Thai","heading":"Noto Serif Thai"}}
```

### Where it is deployed
At `/daily-speak/` under the team's demo site — built with `BASE_PATH=/daily-speak/ bun run build`. Never write a link, an asset path or a fetch as an absolute `/…`: go through the router, `import.meta.env.BASE_URL` and the app's api client, so it works at `/` in dev and at `/daily-speak/` deployed.
<!-- /sup-plana:brief -->

## How this app is worked
- Its owner asks for one change at a time on sup-plana; each request is one turn, and the runner keeps every turn as a
  version (v1, v2 …). **Do not commit, branch, tag or push** — the runner does it when your turn ends.
- End every turn with `bun run check` passing (typecheck + build). The runner runs it after you; if it fails you are
  told the errors in the same turn.
- Look at what you built before you say it is done: the `shot` tool (a picture on the app's page) or `browse`.
- Keep the section **What we decided** at the end of this file current — the pages, the flow, choices made with the
  owner. It is how the next session knows the app; a long chat is not.

## Rules for a demo
- Every word a person reads on screen is Thai unless the brief says otherwise; dates and numbers in th-TH.
- Data is believable sample data in the client's own terms — never real people's data, real systems, real keys or
  secrets; no call to an outside service unless the owner asks for one.
- One look across every page; it works on a phone as well as a laptop.
- Prefer the shadcn components already in `src/components/ui` and Tailwind utilities; add more components with the CLI
  below rather than writing your own.
- It may be deployed under a path (`/<name>/` on the team's demo site, built with `BASE_PATH=/<name>/`): never write an
  absolute `/…` link, asset path or fetch — go through the router, `import.meta.env.BASE_URL` and the api client, which
  already follow it.

## Stack
- The page: Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript, Tailwind CSS 4, shadcn-vue (reka-ui) in
  `src/components/ui`; icons from `@lucide/vue`; toasts with `vue-sonner`. Pages in `src/pages`, listed in
  `src/router.ts`.
- The API: Elysia on Bun in `server/app.ts`, every route under `/api`, its data in memory (`server/data.ts` — a restart
  starts it again). The page calls it through Eden, typed from the server: `api.items.get()`,
  `api.items({ id }).patch({ … })` (`src/lib/api.ts`). Its routes are listed at `/api/openapi`.
- `bun run dev` runs both (scripts/dev.ts); `bun run start` serves the built page and the API on one port.
- More components: `bunx --bun shadcn-vue@latest add <name>`.

## What we decided
- Name: **Daily Speak** (ฝึกพูดอังกฤษวันละคำ). Mobile-first: one phone-width column (centred on desktop), top bar with
  settings, bottom bar with 4 tabs. Theme “คาเฟ่อบอุ่น”; green `--success` = said right, `--destructive` = wrong.
- Sample learner "มายด์", started 14 ต.ค. 2569; one word a day from 24 everyday words (server/data.ts, a fixed
  shuffle by day number). Each word: IPA, Thai meaning, category, level, a pronunciation tip, 3 short sentences
  (each with a `slip` = what the simulated listener mishears the first time). History is seeded: every day but one,
  today's word not yet practised. The missed day is a week ago, so the streak stands at 6.
- Medals (server/app.ts MEDALS): 7 วันติด "เหรียญนักพูดหนึ่งสัปดาห์" (bronze) and 30 วันติด "เหรียญนักพูดหนึ่งเดือน" (gold);
  each run that reaches the mark earns it once more (count + dates). Demo story: the first sentence said today makes 7
  days → a celebration dialog on ฝึกพูด (confetti, "ดูเหรียญของฉัน"), a medal card on the summary. วันนี้ shows a strip
  "ฝึกวันนี้ได้เหรียญ…ทันที" / "อีก N วัน"; สถิติ has a เหรียญรางวัล card (earned or locked, progress of this run).
  The medal look is src/components/MedalBadge.vue.
- Pages: วันนี้ `/` (word of the day, tip, 3 sentences, CTA, recent words) · ฝึกพูด `/practice/:id?` (today's word when
  no id; `?s=` picks the sentence) · คลังคำ `/words` (search, filter by category / ควรฝึกซ้ำ) · สถิติ `/progress`
  (tiles, 7-day bars, 4-week calendar, words missed most).
- Speech: "Google Speech-to-Text" = the browser's own SpeechRecognition (no key) with interim results — each word turns
  green/red as it is heard (src/lib/match.ts aligns words). No mic / no service → falls back to โหมดจำลอง at once
  (src/lib/speech.ts listenSim), labelled จำลอง. Example audio = browser speechSynthesis (US/UK, speed in settings).
- PWA: public/manifest.webmanifest (relative paths — works under /daily-speak/), icons drawn in the theme (brown
  square, sound-wave bars), public/sw.js (network-first, offline copy of the page; never caches /api; shows
  notifications; `periodicsync` "streak-check" runs the evening check on Android when installed). src/lib/pwa.ts:
  install (browser prompt, else InstallGuide dialog with iPhone/Android steps), permission, `notify()` — the phone's
  own notification when allowed, else NotificationBanner drawn in the app labelled "แจ้งเตือนจำลอง". While open it
  checks each minute: morning word (phone only) at remindAt; evening at eveningAt (default 20:00) only when today is
  not practised and the streak > 0. วันนี้ shows an install card ("ไว้ทีหลัง" hides it) and, in the evening, a red
  "อีก N ชั่วโมงจะเสียวันติด" strip.
- AI new words (asked by เนี้ยว, a real outside call): server/ai.ts calls Vercel AI Gateway (OpenAI-compatible
  `https://ai-gateway.vercel.sh/v1/chat/completions`, JSON answer → a Word with 3 sentences + slip). Models: Gemini 2.5
  Flash Lite (default), Gemini 2.5 Flash, Claude Haiku 5.5, GPT-5 mini. The key is NEVER in the repo: typed on the page
  `/settings/ai` (from the gear sheet, "AI สร้างคำใหม่"), kept in the phone's localStorage (settings.aiKey), sent in the
  body of POST /api/ai/test and /api/ai/generate; else the server's env AI_GATEWAY_API_KEY; else โหมดจำลอง — 6 ready
  words in server/ai.ts `reserve`, labelled "AI · จำลอง". A made word is pushed to `words` and set as today's word
  (data.ts `aiDays`, in memory). "สร้างคำใหม่ด้วย AI ทุกวัน" (aiDaily) makes it on the first visit of the day (วันนี้
  shows "AI กำลังคิดคำของวันนี้…"); the word card shows "สร้างโดย AI · <model>". GET /api/ai lists the models and words made.
- AI voice (เสียงอ่าน on `/settings/ai`): settings.voice "device" (browser speechSynthesis) | "ai" (Gemini 3.8 Flash
  TTS, voices Kore · Puck · Zephyr · Charon in settings.aiVoice). Server: POST /api/ai/speech → AI Gateway
  `POST https://ai-gateway.vercel.sh/v4/ai/speech-model` (headers ai-gateway-protocol-version 0.0.1,
  ai-speech-model-specification-version 4, ai-model-id; body text/voice/outputFormat wav/instructions with the accent;
  answer `{ audio: base64 }`), kept in memory per voice+accent+text. Client src/lib/voice.ts: `say()` in
  src/lib/speech.ts goes through it for every "ฟัง" button, speed = playbackRate, one shared player unlocked inside the
  press (iPhone), today's word + sentences preloaded; any failure → the phone's voice (one toast).
- Settings sheet (gear): accent, speed, checker (Google / จำลอง), แอปและการแจ้งเตือน (install, allow notifications,
  morning reminder, evening streak reminder + "ทดลองส่งแจ้งเตือนตอนค่ำ" for the demo); "เริ่มเดโมใหม่" posts /api/reset to
  restore the seeded history so the story can be shown again.
