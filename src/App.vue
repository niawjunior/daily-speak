<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import InstallGuide from "@/components/InstallGuide.vue";
import NotificationBanner from "@/components/NotificationBanner.vue";
import { Toaster } from "@/components/ui/sonner";
import { startApp } from "@/lib/pwa";
import { round } from "@/lib/journal";
import "vue-sonner/style.css";

startApp();
</script>

<template>
  <AppShell>
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="round" />
    </RouterView>
  </AppShell>
  <NotificationBanner />
  <InstallGuide />
  <Toaster position="top-center" rich-colors />
</template>
