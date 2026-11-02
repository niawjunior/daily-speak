<script setup lang="ts">
import { pages } from "@/router";

// The demo's name, said once — on the bar and in the browser's tab.
const appName = "App";
document.title = appName;
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <header class="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <span class="font-semibold">{{ appName }}</span>
        <nav class="flex gap-1 text-sm">
          <RouterLink v-for="p in pages" :key="p.path" :to="p.path" class="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" active-class="!bg-muted !text-foreground">
            {{ p.name }}
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
