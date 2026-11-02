<script setup lang="ts">
import { AudioLines, Presentation } from "@lucide/vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import SettingsSheet from "@/components/SettingsSheet.vue";
import { leaveDemo, mode } from "@/lib/journal";
import { pages } from "@/router";

// The demo's name, said once — on the bar and in the browser's tab.
const appName = "Daily Speak";
document.title = `${appName} · ฝึกพูดอังกฤษวันละคำ`;

const route = useRoute();
const router = useRouter();
function endDemo(): void {
  leaveDemo();
  toast.success("ออกจากเดโมแล้ว — กลับมาที่ข้อมูลการฝึกของคุณ");
  void router.replace("/");
}
const active = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground md:bg-muted">
    <div class="relative mx-auto flex min-h-dvh max-w-md flex-col bg-background md:border-x md:shadow-sm">
      <header class="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div class="flex h-14 items-center gap-3 px-4">
          <RouterLink to="/" class="flex items-center gap-2">
            <span class="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><AudioLines class="size-4" /></span>
            <span class="font-heading text-lg font-semibold">{{ appName }}</span>
          </RouterLink>
          <div class="ml-auto"><SettingsSheet /></div>
        </div>
        <!-- Sample data on screen: said plainly, with the way back -->
        <div v-if="mode === 'demo'" class="flex items-center gap-2 border-t border-accent/50 bg-accent/20 px-4 py-1.5 text-xs">
          <Presentation class="size-4 shrink-0 text-primary" />
          <span class="flex-1">โหมดเดโม · ข้อมูลตัวอย่างของมายด์</span>
          <button type="button" class="font-semibold text-primary underline-offset-4 hover:underline" @click="endDemo">ออกจากเดโม</button>
        </div>
      </header>
      <main class="flex-1 px-4 pt-4 pb-28">
        <slot />
      </main>
      <nav class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:border-x">
        <div class="grid grid-cols-4">
          <RouterLink v-for="p in pages" :key="p.to" :to="p.to"
            class="flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors"
            :class="active(p.to) ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'">
            <span class="grid h-7 w-12 place-items-center rounded-full transition-colors" :class="active(p.to) ? 'bg-accent/30' : ''">
              <component :is="p.icon" class="size-5" />
            </span>
            {{ p.name }}
          </RouterLink>
        </div>
      </nav>
    </div>
  </div>
</template>
