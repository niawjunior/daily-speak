<script setup lang="ts">
import { Lock } from "@lucide/vue";

// A streak medal: a ribbon and a disc with its number of days. Grey and dashed while not earned yet.
withDefaults(defineProps<{ days: number; tier: "bronze" | "gold"; locked?: boolean; size?: "md" | "lg" }>(), { size: "md" });
</script>

<template>
  <div class="relative flex shrink-0 flex-col items-center" :class="size === 'lg' ? 'w-32' : 'w-16'" aria-hidden="true">
    <!-- The ribbon -->
    <div class="flex justify-center" :class="size === 'lg' ? '-mb-3 h-14 gap-2' : '-mb-2 h-8 gap-1'">
      <span class="origin-bottom -rotate-[18deg] rounded-t-sm" :class="[size === 'lg' ? 'w-6' : 'w-3.5', locked ? 'bg-border' : tier === 'gold' ? 'bg-primary' : 'bg-accent']" />
      <span class="origin-bottom rotate-[18deg] rounded-t-sm" :class="[size === 'lg' ? 'w-6' : 'w-3.5', locked ? 'bg-border/70' : tier === 'gold' ? 'bg-primary/75' : 'bg-accent/75']" />
    </div>
    <!-- The disc -->
    <div class="relative grid place-items-center rounded-full"
      :class="[
        size === 'lg' ? 'size-28 border-[6px]' : 'size-16 border-4',
        locked ? 'border-dashed border-border bg-background text-muted-foreground' : tier === 'gold' ? 'border-primary bg-accent text-accent-foreground shadow-lg' : 'border-accent bg-primary text-primary-foreground shadow-md',
      ]">
      <span v-if="!locked" class="absolute rounded-full border border-current opacity-30" :class="size === 'lg' ? 'inset-1.5' : 'inset-1'" />
      <div class="flex flex-col items-center leading-none">
        <span class="font-heading font-bold tabular-nums" :class="size === 'lg' ? 'text-4xl' : 'text-xl'">{{ days.toLocaleString("th-TH") }}</span>
        <span class="font-medium" :class="size === 'lg' ? 'mt-1 text-sm' : 'mt-0.5 text-[10px]'">วันติด</span>
      </div>
      <span v-if="locked" class="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full border bg-card">
        <Lock class="size-3" />
      </span>
    </div>
  </div>
</template>
