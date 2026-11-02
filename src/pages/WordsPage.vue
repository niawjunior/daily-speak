<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronRight, Search, Volume2 } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories, scoreLook, thaiDate, toneClass, type WordCard } from "@/data/words";
import { wordsOf } from "@/lib/journal";
import { settings } from "@/lib/settings";
import { say } from "@/lib/speech";

type Filter = keyof typeof categories | "all" | "review";
// Every word received so far, from the journal on this phone.
const words = computed(wordsOf);
const query = ref("");
const filter = ref<Filter>("all");

const filters = computed(() => [
  { key: "all" as Filter, label: "ทั้งหมด" },
  { key: "review" as Filter, label: "ควรฝึกซ้ำ" },
  ...Object.entries(categories).map(([key, label]) => ({ key: key as Filter, label })),
]);
const needsReview = (w: WordCard) => w.score === null || w.score < 90 || !w.done;
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  return words.value.filter(
    (w) =>
      (filter.value === "all" || (filter.value === "review" ? needsReview(w) : w.category === filter.value)) &&
      (!q || `${w.word} ${w.meaning}`.toLowerCase().includes(q)),
  );
});

</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold">คลังคำของฉัน</h1>
      <p class="text-sm text-muted-foreground">
        ได้รับแล้ว {{ words.length.toLocaleString("th-TH") }} คำ · ฝึกครบ {{ words.filter((w) => w.done).length.toLocaleString("th-TH") }} คำ · วันละ 1 คำ
      </p>
    </div>

    <div class="relative">
      <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="query" placeholder="ค้นหาคำศัพท์หรือความหมาย" class="h-11 rounded-xl bg-card pl-9" />
    </div>

    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      <Button v-for="f in filters" :key="f.key" :variant="filter === f.key ? 'default' : 'outline'" class="h-9 shrink-0 rounded-full px-4" @click="filter = f.key">
        {{ f.label }}
      </Button>
    </div>

    <div class="flex flex-col gap-3">
      <div v-for="w in shown" :key="w.id" class="flex items-center gap-2 rounded-2xl border bg-card p-2 pl-4">
        <Button variant="ghost" size="icon-lg" class="size-10 shrink-0 rounded-full" :aria-label="`ฟังคำว่า ${w.word}`" @click="say(w.word, settings.accent, settings.rate)">
          <Volume2 class="size-5 text-primary" />
        </Button>
        <RouterLink :to="`/practice/${w.id}`" class="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background">
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="flex items-baseline gap-2">
              <span class="truncate text-lg font-semibold">{{ w.word }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ w.ipa }}</span>
            </div>
            <span class="truncate text-sm">{{ w.meaning }}</span>
            <span class="text-xs text-muted-foreground">วันที่ {{ w.day.toLocaleString("th-TH") }} · {{ thaiDate(w.date) }} · {{ categories[w.category] }}</span>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" :class="toneClass[scoreLook(w.score).tone]">{{ scoreLook(w.score).label }}</Badge>
            <span v-if="w.score !== null" class="text-sm font-semibold tabular-nums">{{ w.score }}%</span>
          </div>
          <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
        </RouterLink>
      </div>
      <div v-if="!shown.length" class="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
        <p class="text-sm text-muted-foreground">ไม่พบคำที่ตรงกับ “{{ query || filters.find((f) => f.key === filter)?.label }}”</p>
        <Button variant="outline" class="h-11" @click="query = ''; filter = 'all'">ดูคำทั้งหมด</Button>
      </div>
    </div>
  </section>
</template>
