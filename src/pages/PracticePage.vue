<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { ArrowRight, ChevronLeft, Flame, LoaderCircle, Mic, RotateCcw, Snail, Square, Trophy, Volume2 } from "@lucide/vue";
import MedalBadge from "@/components/MedalBadge.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { scoreLook, toneClass, type WordCard } from "@/data/words";
import { addAttempt, todayOf, wordOf } from "@/lib/journal";
import { cleanWord, grade, scoreOf } from "@/lib/match";
import { settings } from "@/lib/settings";
import { canListen, listenGoogle, listenSim, say, stopSpeaking, type Listening } from "@/lib/speech";
import { preloadVoice, voiceLoading } from "@/lib/voice";

const route = useRoute();
const router = useRouter();

const word = ref<WordCard | null>(null);
const index = ref(0);
const phase = ref<"idle" | "listening" | "result" | "summary">("idle");
const transcript = ref("");
const isFinal = ref(false);
const tries = ref<number[]>([]);
const session = ref<(number | null)[]>([]);
const streak = ref<number | null>(null);
// The medal earned in this session — shown in a dialog, then kept on the summary.
const medal = ref<{ days: number; name: string; tier: "bronze" | "gold" } | null>(null);
const medalOpen = computed({ get: () => !!medal.value && !medalSeen.value, set: (v) => (medalSeen.value = !v) });
const medalSeen = ref(false);
const resultBox = ref<HTMLElement | null>(null);
let listening: Listening | null = null;

const mode = computed(() => (settings.value.checker === "google" && canListen ? "google" : "sim"));
const sentence = computed(() => word.value?.sentences[index.value]);
const graded = computed(() => (sentence.value ? grade(sentence.value.en, transcript.value, isFinal.value || phase.value === "result") : []));
const score = computed(() => scoreOf(graded.value));
const missed = computed(() => graded.value.filter((g) => g.mark === "wrong"));
const cursor = computed(() => (phase.value === "listening" ? graded.value.findIndex((g) => g.mark === "pending") : -1));
const last = computed(() => !!word.value && index.value === word.value.sentences.length - 1);
const sessionScore = computed(() => {
  const s = session.value.filter((v): v is number => v !== null);
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0;
});
const verdict = computed(() =>
  score.value === 100 ? "ถูกทุกคำ ออกเสียงชัดมาก" : score.value >= 80 ? "เกือบเป๊ะแล้ว — ลองคำสีแดงอีกครั้ง" : score.value >= 50 ? "ดีขึ้นแล้ว — ฟังตัวอย่างแล้วพูดใหม่" : "ลองฟังตัวอย่างช้าๆ แล้วพูดตามทีละคำ",
);

function load(): void {
  stop();
  word.value = null;
  phase.value = "idle";
  // A word received already (from the journal on this phone); today's when none is asked for.
  const data = wordOf(Number(route.params.id) || todayOf().word.id);
  if (!data) {
    toast.error("ไม่พบคำนี้ในคลังคำ");
    return void router.replace("/words");
  }
  word.value = data;
  index.value = Math.min(Number(route.query.s ?? 0) || 0, data.sentences.length - 1);
  tries.value = data.sentences.map(() => 0);
  session.value = data.sentences.map(() => null);
  transcript.value = "";
  void preloadVoice([...data.sentences.map((s) => s.en), data.word]);
}
watch(() => route.params.id, load, { immediate: true });
onBeforeUnmount(stop);

function stop(): void {
  listening?.stop();
  listening = null;
}

function start(): void {
  if (!word.value || !sentence.value) return;
  if (phase.value === "listening") return stop();
  stopSpeaking();
  transcript.value = "";
  isFinal.value = false;
  phase.value = "listening";
  const opts = {
    sentence: sentence.value.en,
    lang: settings.value.accent,
    slip: tries.value[index.value] === 0 ? sentence.value.slip : null,
    onText(text: string, final: boolean) {
      transcript.value = text;
      isFinal.value = final;
      // Everything said right already — no need to wait for the silence.
      if (!final && graded.value.every((g) => g.mark === "correct")) stop();
    },
    onEnd: finish,
    onError(message: string, fallback: boolean) {
      toast.error(message);
      listening = null;
      phase.value = "idle";
      // No microphone or no speech service here: carry on with the simulated listener at once.
      if (fallback) (settings.value.checker = "sim"), start();
    },
  };
  listening = mode.value === "google" ? listenGoogle(opts) : listenSim(opts);
}

function finish(): void {
  listening = null;
  if (phase.value !== "listening" || !word.value) return;
  if (!transcript.value.trim()) {
    phase.value = "idle";
    return void toast("ยังไม่ได้ยินเสียง — แตะไมค์แล้วพูดประโยคด้านบน");
  }
  isFinal.value = true;
  phase.value = "result";
  nextTick(() => resultBox.value?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  const i = index.value;
  tries.value[i] = (tries.value[i] ?? 0) + 1;
  session.value[i] = Math.max(session.value[i] ?? 0, score.value);
  // Kept on this phone — the streak and a medal come back at once.
  const saved = addAttempt({ wordId: word.value.id, sentence: i, score: score.value, missed: missed.value.map((m) => cleanWord(m.text)) });
  streak.value = saved.streak;
  if (saved.medal) medal.value = saved.medal;
  word.value.best[i] = Math.max(word.value.best[i] ?? 0, score.value);
}

function again(): void {
  transcript.value = "";
  phase.value = "idle";
}
function next(): void {
  if (last.value) {
    phase.value = "summary";
    return void window.scrollTo({ top: 0, behavior: "smooth" });
  }
  index.value++;
  again();
}
function restart(): void {
  index.value = 0;
  session.value = session.value.map(() => null);
  again();
}
const confetti = Array.from({ length: 18 }, (_, i) => ({
  i,
  x: (i * 37 + 11) % 96,
  w: 6 + (i % 3) * 2,
  delay: (i % 6) * 0.12,
  tone: ["bg-primary", "bg-accent", "bg-success"][i % 3],
}));
const listen = (rate = settings.value.rate) => sentence.value && say(sentence.value.en, settings.value.accent, rate);
</script>

<template>
  <section v-if="word && sentence" class="flex flex-col gap-6">
    <!-- The word being practised -->
    <div class="flex items-center gap-2">
      <Button as-child variant="ghost" size="icon-lg" class="size-11 shrink-0" aria-label="กลับ">
        <RouterLink to="/"><ChevronLeft class="size-5" /></RouterLink>
      </Button>
      <div class="flex min-w-0 flex-1 flex-col">
        <h1 class="truncate text-xl font-semibold">{{ word.word }}</h1>
        <p class="truncate text-sm text-muted-foreground">{{ word.ipa }} · {{ word.meaning }}</p>
      </div>
      <Button variant="outline" size="icon-lg" class="size-11 shrink-0 rounded-full" aria-label="ฟังคำนี้" @click="say(word.word, settings.accent, settings.rate)">
        <Volume2 class="size-5" />
      </Button>
    </div>

    <template v-if="phase !== 'summary'">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium">ประโยคที่ {{ (index + 1).toLocaleString("th-TH") }} จาก {{ word.sentences.length.toLocaleString("th-TH") }}</span>
          <Badge variant="outline" :class="mode === 'google' ? 'border-success/30 text-success' : 'border-accent/60 bg-accent/20'">
            {{ mode === "google" ? "ตรวจด้วย Google Speech-to-Text" : "ตัวตรวจเสียง · จำลอง" }}
          </Badge>
        </div>
        <div class="grid gap-1" :style="{ gridTemplateColumns: `repeat(${word.sentences.length}, 1fr)` }">
          <span v-for="(_, i) in word.sentences" :key="i" class="h-1.5 rounded-full"
            :class="i < index || (i === index && phase === 'result') ? 'bg-primary' : i === index ? 'bg-accent' : 'bg-card'" />
        </div>
      </div>

      <!-- The sentence, each word marked as it is heard -->
      <div class="flex flex-col gap-4 rounded-3xl border bg-card p-6">
        <p class="text-sm text-muted-foreground">พูดตามประโยคนี้</p>
        <div class="flex flex-wrap gap-x-2 gap-y-3 text-2xl leading-snug font-semibold" aria-live="polite">
          <button v-for="(g, i) in graded" :key="i" type="button"
            class="flex flex-col items-start rounded-md px-1 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            :class="{
              'text-success bg-success/10': g.mark === 'correct',
              'text-destructive bg-destructive/10': g.mark === 'wrong',
              'text-muted-foreground/70': g.mark === 'pending' && phase === 'listening',
              'text-foreground': g.mark === 'pending' && phase !== 'listening',
              'shadow-[inset_0_-3px_0_var(--accent)]': i === cursor,
            }"
            :title="`ฟังคำว่า ${cleanWord(g.text)}`" @click="say(cleanWord(g.text), settings.accent, 0.75)">
            <span :class="g.mark === 'wrong' ? 'underline decoration-wavy decoration-2 underline-offset-4' : ''">{{ g.text }}</span>
            <span v-if="g.mark === 'wrong'" class="mt-1.5 pb-1 text-xs font-normal">{{ g.heard ? `ได้ยินเป็น “${g.heard}”` : "ไม่ได้ยิน" }}</span>
          </button>
        </div>
        <p class="text-base text-muted-foreground">{{ sentence.th }}</p>
        <div class="flex gap-2">
          <Button variant="outline" class="h-11 flex-1 rounded-xl" @click="listen()">
            <LoaderCircle v-if="voiceLoading?.endsWith(`|${sentence.en}`)" class="animate-spin" /><Volume2 v-else /> ฟังตัวอย่าง
          </Button>
          <Button variant="ghost" class="h-11 flex-1 rounded-xl" @click="listen(0.6)"><Snail /> ฟังช้าๆ</Button>
        </div>
      </div>

      <!-- What was heard, live -->
      <div v-if="phase === 'listening' || transcript" class="rounded-2xl border border-dashed bg-background px-4 py-3">
        <p class="text-xs text-muted-foreground">{{ mode === "google" ? "Google ได้ยินว่า" : "ระบบได้ยินว่า (จำลอง)" }}</p>
        <p class="min-h-6 text-base italic">{{ transcript || "…" }}</p>
      </div>

      <!-- The result -->
      <div v-if="phase === 'result'" ref="resultBox" class="flex scroll-mb-24 flex-col gap-4 rounded-3xl border p-6" :class="score === 100 ? 'border-success/30 bg-success/5' : 'bg-background'">
        <div class="flex items-center gap-4">
          <div class="grid size-16 shrink-0 place-items-center rounded-full border-4 text-lg font-bold tabular-nums"
            :class="score === 100 ? 'border-success text-success' : score >= 70 ? 'border-accent text-primary' : 'border-destructive text-destructive'">
            {{ score }}%
          </div>
          <div class="flex flex-col gap-1">
            <p class="font-semibold">{{ verdict }}</p>
            <p class="text-sm text-muted-foreground">ถูก {{ graded.filter((g) => g.mark === "correct").length.toLocaleString("th-TH") }} จาก {{ graded.length.toLocaleString("th-TH") }} คำ</p>
          </div>
        </div>
        <div v-if="missed.length" class="flex flex-col gap-2">
          <p class="text-sm font-medium">คำที่ควรฝึก — แตะเพื่อฟัง</p>
          <div class="flex flex-wrap gap-2">
            <Button v-for="(m, i) in missed" :key="i" variant="destructive" class="h-10 rounded-full" @click="say(cleanWord(m.text), settings.accent, 0.75)">
              <Volume2 /> {{ cleanWord(m.text) }}
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" class="h-11 rounded-xl" @click="again"><RotateCcw /> พูดอีกครั้ง</Button>
          <Button class="h-11 rounded-xl" @click="next">{{ last ? "ดูสรุปผล" : "ประโยคถัดไป" }} <ArrowRight /></Button>
        </div>
      </div>

      <!-- The microphone -->
      <div v-else class="flex flex-col items-center gap-3 pt-2">
        <div class="relative grid size-24 place-items-center">
          <span v-if="phase === 'listening'" class="listen-ring absolute inset-0 rounded-full bg-primary/40" />
          <span v-if="phase === 'listening'" class="listen-ring absolute inset-0 rounded-full bg-accent/40 [animation-delay:0.5s]" />
          <button type="button" class="relative grid size-20 place-items-center rounded-full shadow-lg transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
            :class="phase === 'listening' ? 'bg-destructive text-primary-foreground' : 'bg-primary text-primary-foreground'"
            :aria-label="phase === 'listening' ? 'หยุดฟัง' : 'เริ่มพูด'" @click="start">
            <Square v-if="phase === 'listening'" class="size-7 fill-current" />
            <Mic v-else class="size-8" />
          </button>
        </div>
        <p class="text-sm font-medium">{{ phase === "listening" ? "กำลังฟัง… พูดได้เลย" : "แตะไมค์แล้วพูดตามประโยคด้านบน" }}</p>
        <p class="text-xs text-muted-foreground">คำสีเขียวคือพูดถูก สีแดงคือคำที่ยังไม่ชัด</p>
      </div>
    </template>

    <!-- The summary of this word -->
    <template v-else>
      <div class="flex flex-col items-center gap-3 rounded-3xl bg-primary p-8 text-center text-primary-foreground">
        <Trophy class="size-10 text-accent" />
        <h2 class="text-2xl font-semibold">ฝึกคำนี้ครบแล้ว</h2>
        <p class="text-5xl font-bold tabular-nums">{{ sessionScore }}%</p>
        <p class="text-sm text-primary-foreground/80">คะแนนเฉลี่ยรอบนี้</p>
        <div v-if="streak" class="mt-2 flex items-center gap-1 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-semibold">
          <Flame class="size-4 text-accent" /> ฝึกต่อเนื่อง {{ streak.toLocaleString("th-TH") }} วัน
        </div>
      </div>
      <RouterLink v-if="medal" to="/progress" class="flex items-center gap-4 rounded-2xl border border-accent/50 bg-accent/15 p-4 transition-colors hover:bg-accent/25">
        <MedalBadge :days="medal.days" :tier="medal.tier" />
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="text-xs text-muted-foreground">ได้เหรียญใหม่วันนี้</span>
          <span class="font-semibold">{{ medal.name }}</span>
          <span class="text-sm text-muted-foreground">ฝึกพูดติดกันครบ {{ medal.days.toLocaleString("th-TH") }} วัน</span>
        </div>
        <ArrowRight class="size-4 shrink-0 text-muted-foreground" />
      </RouterLink>
      <div class="flex flex-col gap-3">
        <div v-for="(s, i) in word.sentences" :key="i" class="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="font-medium">{{ s.en }}</span>
            <span class="text-sm text-muted-foreground">{{ s.th }}</span>
          </div>
          <Badge variant="outline" :class="toneClass[scoreLook(session[i] ?? null).tone]">{{ session[i] === null ? "ข้าม" : `${session[i]}%` }}</Badge>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Button variant="outline" class="h-12 rounded-xl" @click="restart"><RotateCcw /> ฝึกซ้ำทั้งชุด</Button>
        <Button as-child class="h-12 rounded-xl"><RouterLink to="/progress">ดูสถิติของฉัน</RouterLink></Button>
      </div>
    </template>

    <!-- A medal just earned -->
    <Dialog v-model:open="medalOpen">
      <DialogContent v-if="medal" class="max-w-sm overflow-hidden rounded-3xl text-center">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-40">
          <span v-for="c in confetti" :key="c.i" class="medal-confetti absolute top-0 rounded-sm"
            :class="c.tone" :style="{ left: `${c.x}%`, width: `${c.w}px`, height: `${c.w * 1.6}px`, animationDelay: `${c.delay}s` }" />
        </div>
        <div class="relative flex flex-col items-center gap-4 pt-2">
          <div class="medal-pop"><MedalBadge :days="medal.days" :tier="medal.tier" size="lg" /></div>
          <div class="flex flex-col gap-1">
            <p class="text-sm font-medium text-primary">ยินดีด้วย! ได้เหรียญใหม่</p>
            <DialogTitle class="font-heading text-2xl font-bold">{{ medal.name }}</DialogTitle>
            <DialogDescription>ฝึกพูดติดกันครบ {{ medal.days.toLocaleString("th-TH") }} วันแล้ว รักษาความต่อเนื่องไว้นะ</DialogDescription>
          </div>
          <div class="grid w-full gap-2">
            <Button class="h-12 rounded-xl" @click="medalSeen = true">ฝึกต่อ</Button>
            <Button as-child variant="outline" class="h-12 rounded-xl"><RouterLink to="/progress">ดูเหรียญของฉัน</RouterLink></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </section>

  <section v-else class="flex flex-col gap-6">
    <Skeleton class="h-12 w-2/3" />
    <Skeleton class="h-56 rounded-3xl" />
    <Skeleton class="mx-auto size-20 rounded-full" />
  </section>
</template>
