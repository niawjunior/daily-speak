<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { ArrowRight, AudioLines, ChevronLeft, CircleCheck, CircleAlert, Eye, EyeOff, KeyRound, LoaderCircle, Sparkles, Trash2, Volume2 } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { categories, levels, thaiDate } from "@/data/words";
import { makeTodayWord, masked, modelName } from "@/lib/ai";
import { api } from "@/lib/api";
import { aiWordsOf } from "@/lib/journal";
import { settings } from "@/lib/settings";
import { sayDevice, stopSpeaking } from "@/lib/speech";
import { sayAi, voiceLoading } from "@/lib/voice";

type Info = NonNullable<Awaited<ReturnType<typeof api.ai.get>>["data"]>;
type Made = NonNullable<Awaited<ReturnType<typeof makeTodayWord>>["word"]>;

const info = ref<Info | null>(null);
const keyInput = ref("");
const showKey = ref(false);
const testing = ref(false);
const test = ref<{ ok: true; ms: number } | { ok: false; error: string } | null>(null);
const making = ref(false);
const made = ref<Made | null>(null);
// The words AI made for this phone, newest first.
const madeSoFar = computed(aiWordsOf);

const mode = computed(() => (settings.value.aiKey ? "key" : info.value?.serverKey ? "server" : "sim"));

async function load(): Promise<void> {
  const { data } = await api.ai.get();
  if (data) info.value = data;
}
onMounted(load);

async function runTest(key = settings.value.aiKey): Promise<boolean> {
  testing.value = true;
  test.value = null;
  const { data, error } = await api.ai.test.post({ key: key || undefined, model: settings.value.aiModel });
  testing.value = false;
  if (error || !data) {
    const message = (error?.value as { error?: string } | undefined)?.error;
    test.value = { ok: false, error: typeof message === "string" ? message : "ทดสอบไม่สำเร็จ — ลองอีกครั้ง" };
    return false;
  }
  test.value = { ok: true, ms: data.ms };
  return true;
}

async function saveKey(): Promise<void> {
  const key = keyInput.value.trim();
  if (!key) return void toast.error("วาง API key ของ Vercel AI Gateway ก่อน");
  if (!(await runTest(key))) return;
  settings.value.aiKey = key;
  keyInput.value = "";
  showKey.value = false;
  toast.success("บันทึก API key แล้ว — เชื่อมต่อ AI Gateway สำเร็จ");
}
function removeKey(): void {
  settings.value.aiKey = "";
  test.value = null;
  toast.success("ลบ API key ออกจากเครื่องนี้แล้ว — กลับไปใช้โหมดจำลอง");
}

const voiceModes = [
  { id: "device" as const, name: "เสียงของเครื่อง", note: "ฟรี ใช้ได้ไม่ต้องต่อเน็ต เสียงต่างกันไปแต่ละเครื่อง" },
  { id: "ai" as const, name: "เสียง AI", note: "Gemini 3.8 Flash TTS เป็นธรรมชาติ ทุกเครื่องได้ยินเหมือนกัน" },
];
const sample = "Good morning! Let's practise today's word together.";
async function tryVoice(voice: string): Promise<void> {
  settings.value.aiVoice = voice;
  stopSpeaking();
  if (!(await sayAi(sample, settings.value.accent, settings.value.rate, voice))) sayDevice(sample, settings.value.accent, settings.value.rate);
}

async function makeNow(): Promise<void> {
  making.value = true;
  made.value = null;
  const res = await makeTodayWord();
  making.value = false;
  if (!res.word) return void toast.error(res.error);
  made.value = res.word;
  toast.success(`ได้คำใหม่ของวันนี้แล้ว: ${res.word.word}`);
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center gap-2">
      <Button as-child variant="ghost" size="icon-lg" class="size-11 shrink-0" aria-label="กลับ">
        <RouterLink to="/"><ChevronLeft class="size-5" /></RouterLink>
      </Button>
      <div class="flex min-w-0 flex-col">
        <h1 class="text-xl font-semibold">AI สร้างคำใหม่</h1>
        <p class="text-sm text-muted-foreground">ให้ AI คิดคำและประโยคใหม่ให้ทุกวัน ผ่าน Vercel AI Gateway</p>
      </div>
    </div>

    <!-- Where the words come from now -->
    <div class="flex items-center gap-3 rounded-2xl border p-4" :class="mode === 'sim' ? 'border-accent/50 bg-accent/15' : 'border-success/25 bg-success/10'">
      <span class="grid size-10 shrink-0 place-items-center rounded-full" :class="mode === 'sim' ? 'bg-accent text-accent-foreground' : 'bg-success text-success-foreground'">
        <Sparkles class="size-5" />
      </span>
      <div class="flex min-w-0 flex-col">
        <span class="text-sm font-semibold">
          {{ mode === "key" ? `เชื่อมต่อแล้ว · ${modelName(settings.aiModel)}` : mode === "server" ? `ใช้คีย์ของเซิร์ฟเวอร์ · ${modelName(settings.aiModel)}` : "โหมดจำลอง — ยังไม่ได้ใส่ API key" }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ mode === "sim" ? "กดสร้างคำได้เลย ระบบจะใช้คำที่เตรียมไว้ และติดป้าย AI · จำลอง" : "คำใหม่ถูกคิดโดย AI จริง ติดป้าย “สร้างโดย AI” บนการ์ดคำ" }}
        </span>
      </div>
    </div>

    <!-- The key -->
    <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div class="flex items-center gap-2"><KeyRound class="size-4 text-primary" /><h2 class="text-base font-semibold">API key</h2></div>
      <div v-if="settings.aiKey" class="flex items-center justify-between gap-3 rounded-xl bg-background p-3">
        <div class="flex min-w-0 flex-col">
          <span class="font-mono text-sm">{{ masked(settings.aiKey) }}</span>
          <span class="text-xs text-muted-foreground">เก็บไว้ในเครื่องนี้เท่านั้น</span>
        </div>
        <Button variant="ghost" class="h-9 text-destructive hover:text-destructive" @click="removeKey"><Trash2 /> ลบคีย์</Button>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="ai-key">{{ settings.aiKey ? "เปลี่ยนเป็นคีย์ใหม่" : "API key ของ Vercel AI Gateway" }}</Label>
        <div class="relative">
          <Input id="ai-key" v-model="keyInput" :type="showKey ? 'text' : 'password'" placeholder="vck_…" autocomplete="off" spellcheck="false" class="h-11 pr-11 font-mono" @keydown.enter="saveKey" />
          <button type="button" class="absolute top-0 right-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground" :aria-label="showKey ? 'ซ่อนคีย์' : 'แสดงคีย์'" @click="showKey = !showKey">
            <EyeOff v-if="showKey" class="size-4" /><Eye v-else class="size-4" />
          </button>
        </div>
        <p class="text-xs text-muted-foreground">สร้างคีย์ได้ที่ vercel.com › AI Gateway › API Keys · คีย์จะถูกส่งไปที่ AI Gateway เฉพาะตอนทดสอบและสร้างคำ</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Button class="h-11" :disabled="testing || !keyInput.trim()" @click="saveKey">
          <LoaderCircle v-if="testing && keyInput" class="animate-spin" /> บันทึกและทดสอบ
        </Button>
        <Button variant="outline" class="h-11" :disabled="testing || mode === 'sim'" @click="runTest()">
          <LoaderCircle v-if="testing && !keyInput" class="animate-spin" /> ทดสอบการเชื่อมต่อ
        </Button>
      </div>
      <p v-if="test" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" :class="test.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'">
        <CircleCheck v-if="test.ok" class="size-4 shrink-0" /><CircleAlert v-else class="size-4 shrink-0" />
        {{ test.ok ? `เชื่อมต่อสำเร็จ · ${modelName(settings.aiModel)} ตอบใน ${(test.ms / 1000).toLocaleString("th-TH", { maximumFractionDigits: 1 })} วินาที` : test.error }}
      </p>
    </div>

    <!-- The model -->
    <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <h2 class="text-base font-semibold">โมเดล</h2>
      <div v-if="info" class="flex flex-col gap-2">
        <button v-for="m in info.models" :key="m.id" type="button"
          class="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors"
          :class="settings.aiModel === m.id ? 'border-primary bg-background' : 'border-transparent bg-background/60 hover:border-border'"
          @click="settings.aiModel = m.id; test = null">
          <span class="grid size-5 shrink-0 place-items-center rounded-full border-2" :class="settings.aiModel === m.id ? 'border-primary' : 'border-border'">
            <span v-if="settings.aiModel === m.id" class="size-2.5 rounded-full bg-primary" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-sm font-semibold">{{ m.name }}</span>
            <span class="text-xs text-muted-foreground">{{ m.note }}</span>
          </span>
          <Badge v-if="m.id === 'google/gemini-2.5-flash-lite'" variant="outline">แนะนำ</Badge>
        </button>
      </div>
      <Skeleton v-else class="h-48 rounded-xl" />
    </div>

    <!-- The voice of every "ฟัง" button -->
    <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div class="flex items-center gap-2"><AudioLines class="size-4 text-primary" /><h2 class="text-base font-semibold">เสียงอ่าน</h2></div>
      <div class="grid grid-cols-2 gap-2">
        <button v-for="o in voiceModes" :key="o.id" type="button"
          class="flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors"
          :class="settings.voice === o.id ? 'border-primary bg-background' : 'border-transparent bg-background/60 hover:border-border'"
          @click="settings.voice = o.id">
          <span class="flex items-center gap-2 text-sm font-semibold">
            <span class="grid size-4 shrink-0 place-items-center rounded-full border-2" :class="settings.voice === o.id ? 'border-primary' : 'border-border'">
              <span v-if="settings.voice === o.id" class="size-2 rounded-full bg-primary" />
            </span>
            {{ o.name }}
          </span>
          <span class="text-xs text-muted-foreground">{{ o.note }}</span>
        </button>
      </div>
      <template v-if="settings.voice === 'ai'">
        <p v-if="mode === 'sim'" class="flex items-start gap-2 rounded-xl bg-accent/20 px-3 py-2 text-xs">
          <CircleAlert class="mt-0.5 size-4 shrink-0" /> ใส่ API key ด้านบนก่อน — ระหว่างนี้ปุ่มฟังจะใช้เสียงของเครื่องไปก่อน
        </p>
        <div v-if="info" class="flex flex-col gap-2">
          <div v-for="v in info.voices" :key="v.id" class="flex items-center gap-3 rounded-xl border p-2 pl-3 transition-colors"
            :class="settings.aiVoice === v.id ? 'border-primary bg-background' : 'border-transparent bg-background/60'">
            <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="settings.aiVoice = v.id">
              <span class="grid size-5 shrink-0 place-items-center rounded-full border-2" :class="settings.aiVoice === v.id ? 'border-primary' : 'border-border'">
                <span v-if="settings.aiVoice === v.id" class="size-2.5 rounded-full bg-primary" />
              </span>
              <span class="flex min-w-0 flex-col">
                <span class="text-sm font-semibold">{{ v.name }}</span>
                <span class="text-xs text-muted-foreground">{{ v.note }}</span>
              </span>
            </button>
            <Button variant="outline" size="icon-lg" class="size-10 shrink-0 rounded-full" :aria-label="`ฟังเสียง ${v.name}`" @click="tryVoice(v.id)">
              <LoaderCircle v-if="voiceLoading?.startsWith(`${v.id}|`)" class="size-4 animate-spin" /><Volume2 v-else class="size-4" />
            </Button>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          ใช้ {{ info?.ttsModel ?? "google/gemini-3.8-flash-tts" }} ผ่าน AI Gateway · แต่ละประโยคสร้างครั้งเดียวแล้วเก็บไว้ฟังซ้ำ ราวประโยคละ 2 สตางค์ · เสียงครั้งแรกใช้เวลา 2–4 วินาที
        </p>
      </template>
    </div>

    <!-- What kind of word -->
    <div class="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <h2 class="text-base font-semibold">คำที่อยากได้</h2>
      <div class="flex flex-col gap-2">
        <Label>ระดับ</Label>
        <div class="grid grid-cols-3 gap-2">
          <Button v-for="(name, l) in levels" :key="l" :variant="settings.aiLevel === l ? 'default' : 'outline'" class="h-11 flex-col gap-0 leading-tight" @click="settings.aiLevel = l">
            <span>{{ l }}</span><span class="text-[11px] font-normal opacity-80">{{ name }}</span>
          </Button>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Label>หมวด</Label>
        <Select v-model="settings.aiCategory">
          <SelectTrigger class="h-11 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">สุ่มทุกหมวด</SelectItem>
            <SelectItem v-for="(name, c) in categories" :key="c" :value="c">{{ name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center justify-between gap-4 rounded-xl bg-background p-3">
        <div class="flex flex-col gap-0.5">
          <Label for="ai-daily">สร้างคำใหม่ด้วย AI ทุกวัน</Label>
          <span class="text-xs text-muted-foreground">เปิดแอปครั้งแรกของวัน AI จะคิดคำของวันนั้นให้</span>
        </div>
        <Switch id="ai-daily" v-model="settings.aiDaily" />
      </div>
      <Button variant="outline" class="h-12 rounded-xl" :disabled="making" @click="makeNow">
        <LoaderCircle v-if="making" class="animate-spin" /><Sparkles v-else /> {{ making ? "AI กำลังคิดคำใหม่…" : "สร้างคำของวันนี้ใหม่ตอนนี้" }}
      </Button>

      <!-- The word just made -->
      <div v-if="made" class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-background p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-col">
            <span class="font-heading text-2xl font-bold">{{ made.word }}</span>
            <span class="text-sm text-muted-foreground">{{ made.ipa }} · {{ made.pos }} · {{ made.meaning }}</span>
          </div>
          <Badge variant="outline" class="shrink-0">{{ made.source === "sim" ? "AI · จำลอง" : modelName(made.model) }}</Badge>
        </div>
        <ul class="flex flex-col gap-2">
          <li v-for="(s, i) in made.sentences" :key="i" class="flex flex-col text-sm">
            <span class="font-medium">{{ s.en }}</span><span class="text-muted-foreground">{{ s.th }}</span>
          </li>
        </ul>
        <Button as-child class="h-11"><RouterLink to="/practice">ฝึกคำนี้เลย <ArrowRight /></RouterLink></Button>
      </div>
    </div>

    <!-- Words made so far -->
    <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <h2 class="text-base font-semibold">คำที่ AI สร้างแล้ว</h2>
      <p v-if="!madeSoFar.length" class="text-sm text-muted-foreground">ยังไม่มี — กด “สร้างคำของวันนี้ใหม่ตอนนี้” เพื่อเริ่ม</p>
      <div v-for="w in madeSoFar" :key="w.id" class="flex items-center gap-3 rounded-xl bg-background p-3">
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="flex items-center gap-2 font-semibold">{{ w.word }}<Badge v-if="w.today" variant="outline" class="text-[11px]">คำของวันนี้</Badge></span>
          <span class="truncate text-xs text-muted-foreground">{{ w.meaning }} · หมวด{{ categories[w.category] }} · {{ w.level }}</span>
        </div>
        <div class="flex shrink-0 flex-col items-end text-xs text-muted-foreground">
          <span>{{ w.source === "sim" ? "จำลอง" : modelName(w.model) }}</span>
          <span>{{ w.createdOn ? thaiDate(w.createdOn) : "" }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
