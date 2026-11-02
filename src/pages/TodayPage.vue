<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { ArrowRight, CircleCheck, Flame, Lightbulb, Medal, Mic, RotateCcw, Volume2 } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, levels, scoreLook, thaiDate, toneClass, type Today, type WordCard } from "@/data/words";
import { api } from "@/lib/api";
import { settings } from "@/lib/settings";
import { say } from "@/lib/speech";

const today = ref<Today | null>(null);
const recent = ref<WordCard[]>([]);
const failed = ref(false);

const hour = new Date().getHours();
const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
const word = computed(() => today.value?.word);
const said = computed(() => word.value?.best.filter((b) => b !== null).length ?? 0);
const cta = computed(() => (word.value?.done ? "ฝึกซ้ำอีกรอบ" : said.value ? "ฝึกต่อ" : "เริ่มฝึกพูด"));

async function load(): Promise<void> {
  failed.value = false;
  const [t, w] = await Promise.all([api.today.get(), api.words.get()]);
  if (t.error || w.error) {
    failed.value = true;
    return void toast.error("โหลดคำของวันนี้ไม่ได้ — ลองอีกครั้ง");
  }
  today.value = t.data;
  recent.value = w.data.slice(1, 4);
}
onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-6">
    <div v-if="failed" class="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center">
      <p class="text-sm text-muted-foreground">โหลดคำของวันนี้ไม่ได้</p>
      <Button variant="outline" class="h-11" @click="load"><RotateCcw /> ลองอีกครั้ง</Button>
    </div>

    <template v-else-if="today && word">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <p class="text-sm text-muted-foreground">{{ thaiDate(today.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }}</p>
          <h1 class="text-2xl font-semibold">{{ greeting }} {{ today.learner.name }}</h1>
        </div>
        <div class="flex shrink-0 items-center gap-1 rounded-full border border-accent/50 bg-accent/20 px-3 py-1.5 text-sm font-semibold">
          <Flame class="size-4 text-primary" /> {{ today.streak.toLocaleString("th-TH") }} วันติด
        </div>
      </div>

      <!-- The next medal to aim for -->
      <RouterLink v-if="today.nextMedal" to="/progress" class="-mt-2 flex items-center gap-3 rounded-2xl border border-accent/50 bg-accent/15 p-3 transition-colors hover:bg-accent/25">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Medal class="size-5" /></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <p class="text-sm">
            <template v-if="today.nextMedal.left === 1 && !today.practisedToday"><span class="font-semibold">ฝึกวันนี้ได้{{ today.nextMedal.name }}ทันที</span></template>
            <template v-else>อีก <span class="font-semibold">{{ today.nextMedal.left.toLocaleString("th-TH") }} วัน</span> ได้{{ today.nextMedal.name }}</template>
          </p>
          <div class="h-1.5 overflow-hidden rounded-full bg-background">
            <div class="h-full rounded-full bg-primary" :style="{ width: `${(today.streak / today.nextMedal.days) * 100}%` }" />
          </div>
        </div>
        <ArrowRight class="size-4 shrink-0 text-muted-foreground" />
      </RouterLink>

      <!-- The word of the day -->
      <article class="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-md">
        <div class="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-accent/30" />
        <div class="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full bg-primary-foreground/5" />
        <div class="relative flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium tracking-wide text-primary-foreground/80">คำประจำวัน · วันที่ {{ word.day.toLocaleString("th-TH") }}</span>
            <span class="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs">{{ word.level }} · {{ levels[word.level] }}</span>
          </div>
          <div class="flex items-end justify-between gap-4">
            <div class="flex min-w-0 flex-col gap-1">
              <h2 class="font-heading text-4xl leading-tight font-bold break-words">{{ word.word }}</h2>
              <p class="text-sm text-primary-foreground/80">{{ word.ipa }} · {{ word.pos }}</p>
            </div>
            <Button size="icon-lg" class="size-12 shrink-0 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90" aria-label="ฟังเสียง"
              @click="say(word.word, settings.accent, settings.rate)">
              <Volume2 class="size-5" />
            </Button>
          </div>
          <p class="text-xl font-medium">{{ word.meaning }}</p>
          <div class="flex flex-wrap gap-2">
            <span class="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">หมวด{{ categories[word.category] }}</span>
            <span class="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">{{ word.sentences.length.toLocaleString("th-TH") }} ประโยคให้พูดตาม</span>
          </div>
        </div>
      </article>

      <div class="flex gap-3 rounded-2xl border bg-card p-4">
        <Lightbulb class="mt-0.5 size-5 shrink-0 text-primary" />
        <div class="flex flex-col gap-1">
          <p class="text-sm font-semibold">เคล็ดลับการออกเสียง</p>
          <p class="text-sm text-muted-foreground">{{ word.tip }}</p>
        </div>
      </div>

      <!-- Sentences to say -->
      <div class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between">
          <h3 class="text-lg font-semibold">ประโยคที่จะได้พูดวันนี้</h3>
          <span class="text-sm text-muted-foreground">{{ said.toLocaleString("th-TH") }}/{{ word.sentences.length.toLocaleString("th-TH") }}</span>
        </div>
        <RouterLink v-for="(s, i) in word.sentences" :key="i" :to="{ path: `/practice/${word.id}`, query: { s: i } }"
          class="flex items-center gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-card">
          <span class="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
            :class="word.best[i] !== null ? 'bg-success text-success-foreground' : 'bg-card text-muted-foreground'">
            <CircleCheck v-if="word.best[i] !== null" class="size-4" />
            <template v-else>{{ (i + 1).toLocaleString("th-TH") }}</template>
          </span>
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="font-medium">{{ s.en }}</span>
            <span class="text-sm text-muted-foreground">{{ s.th }}</span>
          </div>
          <Badge v-if="word.best[i] !== null" variant="outline" :class="toneClass[scoreLook(word.best[i]).tone]">{{ word.best[i] }}%</Badge>
        </RouterLink>
      </div>

      <Button as-child class="h-12 rounded-2xl text-base shadow-sm">
        <RouterLink :to="`/practice/${word.id}`"><Mic class="size-5" /> {{ cta }}</RouterLink>
      </Button>

      <!-- Recent days -->
      <div class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between">
          <h3 class="text-lg font-semibold">คำของวันก่อนๆ</h3>
          <RouterLink to="/words" class="flex items-center gap-1 text-sm font-medium text-primary">ดูทั้งหมด <ArrowRight class="size-4" /></RouterLink>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <RouterLink v-for="w in recent" :key="w.id" :to="`/practice/${w.id}`" class="flex flex-col gap-1 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/40">
            <span class="text-xs text-muted-foreground">{{ thaiDate(w.date) }}</span>
            <span class="truncate font-semibold">{{ w.word }}</span>
            <span class="truncate text-xs text-muted-foreground">{{ w.meaning }}</span>
            <span class="mt-1 text-xs font-semibold" :class="w.score !== null && w.score >= 90 ? 'text-success' : 'text-primary'">{{ w.score === null ? "ยังไม่ฝึก" : `${w.score}%` }}</span>
          </RouterLink>
        </div>
      </div>
    </template>

    <template v-else>
      <Skeleton class="h-12 w-2/3" />
      <Skeleton class="h-64 rounded-3xl" />
      <Skeleton class="h-20 rounded-2xl" />
      <Skeleton class="h-40 rounded-2xl" />
    </template>
  </section>
</template>
