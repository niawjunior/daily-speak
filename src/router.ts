import { BookOpen, ChartColumn, Mic, Sun } from "@lucide/vue";
import { createRouter, createWebHistory } from "vue-router";

// Each page of the demo: a path, its name in the bottom bar, its icon, the page itself.
export const pages = [
  { path: "/", to: "/", name: "วันนี้", icon: Sun, component: () => import("./pages/TodayPage.vue") },
  { path: "/practice/:id?", to: "/practice", name: "ฝึกพูด", icon: Mic, component: () => import("./pages/PracticePage.vue") },
  { path: "/words", to: "/words", name: "คลังคำ", icon: BookOpen, component: () => import("./pages/WordsPage.vue") },
  { path: "/progress", to: "/progress", name: "สถิติ", icon: ChartColumn, component: () => import("./pages/ProgressPage.vue") },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...pages.map(({ path, component }) => ({ path, component })),
    // Opened from the settings sheet — not a tab of its own.
    { path: "/settings/ai", component: () => import("./pages/AiSettingsPage.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
