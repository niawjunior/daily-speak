import { createRouter, createWebHistory } from "vue-router";

// Each page of the demo: a path, its name in the menu, the page itself.
export const pages = [
  { path: "/", name: "หน้าแรก", component: () => import("./pages/HomePage.vue") },
  { path: "/items", name: "รายการ", component: () => import("./pages/ItemsPage.vue") },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...pages, { path: "/:pathMatch(.*)*", redirect: "/" }],
});
