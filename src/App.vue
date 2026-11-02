<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <Toaster position="top-center" rich-colors />
</template>
