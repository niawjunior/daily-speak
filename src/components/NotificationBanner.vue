<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { AudioLines, X } from "@lucide/vue";
import { banner } from "@/lib/pwa";

// A reminder drawn like the phone's own notification, at the top — when the phone has not allowed real ones.
const router = useRouter();
let timer = 0;
watch(banner, (b) => {
  window.clearTimeout(timer);
  if (b) timer = window.setTimeout(() => (banner.value = null), 10_000);
});
function open(): void {
  if (!banner.value) return;
  const to = banner.value.to;
  banner.value = null;
  router.push(to);
}
</script>

<template>
  <Transition enter-from-class="-translate-y-full opacity-0" leave-to-class="-translate-y-full opacity-0" enter-active-class="transition duration-300 ease-out" leave-active-class="transition duration-200 ease-in">
    <div v-if="banner" class="fixed inset-x-0 top-0 z-50 mx-auto max-w-md px-3 pt-[max(env(safe-area-inset-top),12px)]" role="status" aria-live="polite">
      <div class="flex items-start gap-3 rounded-2xl border bg-popover/95 p-3 shadow-xl backdrop-blur">
        <button type="button" class="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none" @click="open">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><AudioLines class="size-5" /></span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex items-center gap-2 text-xs text-muted-foreground">
              Daily Speak · ตอนนี้
              <span class="rounded-full border border-accent/60 bg-accent/20 px-1.5 text-[10px] font-medium text-foreground">แจ้งเตือนจำลอง</span>
            </span>
            <span class="text-sm font-semibold">{{ banner.title }}</span>
            <span class="text-sm text-muted-foreground">{{ banner.body }}</span>
          </span>
        </button>
        <button type="button" class="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card" aria-label="ปิดการแจ้งเตือน" @click="banner = null">
          <X class="size-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
