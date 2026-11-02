<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { ChevronRight, RotateCcw, Search, Volume2 } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, scoreLook, thaiDate, toneClass, type WordCard } from "@/data/words";
import { api } from "@/lib/api";
import { settings } from "@/lib/settings";
import { say } from "@/lib/speech";

type Filter = keyof typeof categories | "all" | "review";
const words = ref<WordCard[] | null>(null);
const query = ref("");
const filter = ref<Filter>("all");
const failed = ref(false);

const filters = computed(() => [
  { key: "all" as Filter, label: "ทั้งหมด" },
  { key: "review" as Filter, label: "ควรฝึกซ้ำ" },
  ...Object.entries(categories).map(([key, label]) => ({ key: key as Filter, label })),
]);
const needsReview = (w: WordCard) => w.score === null || w.score < 90 || !w.done;
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  return (words.value ?? []).filter(
    (w) =>
      (filter.value === "all" || (filter.value === "review" ? needsReview(w) : w.category === filter.value)) &&
      (!q || `${w.word} ${w.meaning}`.toLowerCase().includes(q)),
  );
});

async function load(): Promise<void> {
  failed.value = false;
  const { data, error } = await api.words.get();
  if (error) {
    failed.value = true;
    return void toast.error("โหลดคลังคำไม่ได้ — ลองอีกครั้ง");
  }
  words.value = data;
}
onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold">คลังคำของฉัน</h1>
      <p class="text-sm text-muted-foreground">
        ได้รับแล้ว {{ (words?.length ?? 0).toLocaleString("th-TH") }} คำ · ฝึกครบ {{ (words?.filter((w) => w.done).length ?? 0).toLocaleString("th-TH") }} คำ
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

    <div v-if="failed" class="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center">
      <p class="text-sm text-muted-foreground">โหลดคลังคำไม่ได้</p>
      <Button variant="outline" class="h-11" @click="load"><RotateCcw /> ลองอีกครั้ง</Button>
    </div>

    <div v-else-if="words" class="flex flex-col gap-3">
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

    <div v-else class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-24 rounded-2xl" />
    </div>
  </section>
</template>
