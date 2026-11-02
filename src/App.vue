<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import { Toaster } from "@/components/ui/sonner";
import { demoRound } from "@/lib/settings";
import "vue-sonner/style.css";
</script>

<template>
  <AppShell>
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="demoRound" />
    </RouterView>
  </AppShell>
  <Toaster position="top-center" rich-colors />
</template>
