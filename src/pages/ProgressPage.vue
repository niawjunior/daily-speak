<script setup lang="ts">
import { computed, ref } from "vue";
import { Award, BookOpen, Flame, Target, Volume2 } from "@lucide/vue";
import MedalBadge from "@/components/MedalBadge.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayDate, isoDay, thaiDate, toneClass } from "@/data/words";
import { progressOf } from "@/lib/journal";
import { settings } from "@/lib/settings";
import { say } from "@/lib/speech";

// From the journal on this phone.
const progress = computed(progressOf);
// The day picked on the bars — today first.
const picked = ref<number | null>(6);

const tiles = computed(() =>
  progress.value.tries
    ? [
        { icon: Flame, label: "ฝึกต่อเนื่อง", value: `${progress.value.streak.current.toLocaleString("th-TH")} วัน`, note: `สูงสุด ${progress.value.streak.best.toLocaleString("th-TH")} วัน` },
        { icon: Target, label: "ความแม่นยำเฉลี่ย", value: `${progress.value.score}%`, note: `จาก ${progress.value.tries.toLocaleString("th-TH")} ครั้งที่พูด` },
        { icon: BookOpen, label: "คำที่ฝึกแล้ว", value: `${progress.value.words.toLocaleString("th-TH")} คำ`, note: `${progress.value.sentences.toLocaleString("th-TH")} ประโยค` },
        { icon: Award, label: "พูดถูกทุกคำ", value: `${progress.value.perfect.toLocaleString("th-TH")} ครั้ง`, note: "ได้ 100%" },
      ]
    : [
        { icon: Flame, label: "ฝึกต่อเนื่อง", value: "0 วัน", note: "เริ่มนับเมื่อฝึกประโยคแรก" },
        { icon: Target, label: "ความแม่นยำเฉลี่ย", value: "—", note: "ยังไม่ได้พูด" },
        { icon: BookOpen, label: "คำที่ฝึกแล้ว", value: "0 คำ", note: "0 ประโยค" },
        { icon: Award, label: "พูดถูกทุกคำ", value: "0 ครั้ง", note: "ได้ 100%" },
      ],
);
const medalTotal = computed(() => progress.value.medals.reduce((s, m) => s + m.count, 0));
const peak = computed(() => Math.max(1, ...progress.value.last7.map((d) => d.tries)));
const weekTries = computed(() => progress.value.last7.reduce((s, d) => s + d.tries, 0));
const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const dow = (v: string | Date) => dayDate(v).getDay();
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold">สถิติการฝึก</h1>
      <p class="text-sm text-muted-foreground">ดูว่าพูดได้แม่นขึ้นแค่ไหน และคำไหนที่ยังพลาดบ่อย</p>
    </div>

    <template v-if="progress">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="t in tiles" :key="t.label" class="flex flex-col gap-1 rounded-2xl border bg-card p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground"><component :is="t.icon" class="size-4 text-primary" /> {{ t.label }}</div>
          <span class="text-2xl font-bold tabular-nums">{{ t.value }}</span>
          <span class="text-xs text-muted-foreground">{{ t.note }}</span>
        </div>
      </div>

      <!-- Medals for days in a row -->
      <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <div class="flex items-baseline justify-between">
          <h2 class="text-base font-semibold">เหรียญรางวัล</h2>
          <span class="text-sm text-muted-foreground">ได้แล้ว {{ medalTotal.toLocaleString("th-TH") }} เหรียญ</span>
        </div>
        <div v-for="m in progress.medals" :key="m.days" class="flex items-center gap-4 rounded-xl bg-background p-3">
          <MedalBadge :days="m.days" :tier="m.tier" :locked="!m.count" />
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ m.name }}</span>
              <Badge v-if="m.count" variant="outline" :class="toneClass.success">ได้ {{ m.count.toLocaleString("th-TH") }} ครั้ง</Badge>
            </div>
            <span class="text-xs text-muted-foreground">
              ฝึกพูดติดกัน {{ m.days.toLocaleString("th-TH") }} วัน<template v-if="m.count"> · ล่าสุด {{ thaiDate(m.earned[m.earned.length - 1]!, { day: "numeric", month: "short", year: "numeric" }) }}</template>
            </span>
            <div class="mt-1 h-2 overflow-hidden rounded-full bg-card">
              <div class="h-full rounded-full transition-all" :class="m.progress >= m.days ? 'bg-success' : 'bg-accent'" :style="{ width: `${(m.progress / m.days) * 100}%` }" />
            </div>
            <span class="text-xs" :class="m.progress >= m.days ? 'font-semibold text-success' : 'text-muted-foreground'">
              {{ m.progress >= m.days ? "รอบนี้ครบแล้ว" : `รอบนี้ ${m.progress.toLocaleString("th-TH")}/${m.days.toLocaleString("th-TH")} วัน · อีก ${(m.days - m.progress).toLocaleString("th-TH")} วัน` }}
            </span>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">ขาดไป 1 วัน นับใหม่ตั้งแต่วันแรก — เหรียญที่ได้แล้วยังอยู่ครบ</p>
      </div>

      <!-- Times spoken in the last 7 days -->
      <div class="flex flex-col gap-4 rounded-2xl border bg-card p-4">
        <div class="flex items-baseline justify-between">
          <h2 class="text-base font-semibold">จำนวนครั้งที่พูด 7 วันล่าสุด</h2>
          <span class="text-sm text-muted-foreground">รวม {{ weekTries.toLocaleString("th-TH") }} ครั้ง</span>
        </div>
        <div class="flex h-36 items-end gap-2 border-b border-border">
          <button v-for="(d, i) in progress.last7" :key="d.date" type="button" class="group flex h-full flex-1 flex-col items-center justify-end focus-visible:outline-none"
            :aria-label="`${thaiDate(d.date)} พูด ${d.tries} ครั้ง`" @click="picked = i" @mouseenter="picked = i">
            <span class="mb-1 text-xs font-semibold tabular-nums" :class="picked === i ? 'text-foreground' : 'text-transparent'">{{ d.tries }}</span>
            <span class="w-full max-w-8 rounded-t-[4px] transition-colors"
              :class="picked === i ? 'bg-primary' : 'bg-primary/55 group-hover:bg-primary/75'"
              :style="{ height: `${Math.max(d.tries ? 6 : 2, (d.tries / peak) * 100)}%` }" />
          </button>
        </div>
        <div class="flex gap-2">
          <span v-for="(d, i) in progress.last7" :key="d.date" class="flex-1 text-center text-xs" :class="picked === i ? 'font-semibold' : 'text-muted-foreground'">
            {{ i === progress.last7.length - 1 ? "วันนี้" : weekdays[dow(d.date)] }}
          </span>
        </div>
        <p v-if="picked !== null && progress.last7[picked]" class="rounded-xl bg-background px-3 py-2 text-sm">
          {{ thaiDate(progress.last7[picked].date, { weekday: "long", day: "numeric", month: "short" }) }} ·
          <template v-if="progress.last7[picked].tries">พูด {{ progress.last7[picked].tries.toLocaleString("th-TH") }} ครั้ง แม่นยำเฉลี่ย {{ progress.last7[picked].score }}%</template>
          <template v-else>ยังไม่ได้ฝึก</template>
        </p>
      </div>

      <!-- Days practised -->
      <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <h2 class="text-base font-semibold">วันที่ฝึก 4 สัปดาห์ล่าสุด</h2>
        <div class="grid grid-cols-7 gap-2">
          <div v-for="d in progress.calendar" :key="isoDay(d.date)" :title="thaiDate(d.date)"
            class="grid aspect-square place-items-center rounded-lg text-xs tabular-nums"
            :class="d.practised ? 'bg-primary text-primary-foreground' : d.started ? 'border border-dashed border-primary/30 bg-background text-muted-foreground' : 'bg-background/60 text-muted-foreground/60'">
            {{ dayDate(d.date).getDate() }}
          </div>
        </div>
        <div class="flex gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1"><span class="size-3 rounded bg-primary" /> ฝึกแล้ว</span>
          <span class="flex items-center gap-1"><span class="size-3 rounded border border-dashed border-primary/30 bg-background" /> ยังไม่ได้ฝึก</span>
        </div>
      </div>

      <!-- Words missed most -->
      <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <h2 class="text-base font-semibold">คำที่พลาดบ่อย</h2>
        <p v-if="!progress.tries" class="text-sm text-muted-foreground">ยังไม่ได้ฝึก — คำที่พูดพลาดจะมาอยู่ตรงนี้ ให้กดฟังซ้ำได้</p>
        <p v-else-if="!progress.tough.length" class="text-sm text-muted-foreground">ยังไม่มีคำที่พลาด — พูดถูกทุกคำมาตลอด</p>
        <div v-for="(t, i) in progress.tough" :key="t.word" class="flex items-center gap-3">
          <span class="w-5 text-sm text-muted-foreground tabular-nums">{{ (i + 1).toLocaleString("th-TH") }}</span>
          <span class="flex-1 font-semibold">{{ t.word }}</span>
          <span class="text-sm text-muted-foreground">พลาด {{ t.count.toLocaleString("th-TH") }} ครั้ง</span>
          <Button variant="outline" size="icon-lg" class="size-10 rounded-full" :aria-label="`ฟังคำว่า ${t.word}`" @click="say(t.word, settings.accent, 0.75)">
            <Volume2 class="size-4" />
          </Button>
        </div>
      </div>
    </template>
  </section>
</template>
