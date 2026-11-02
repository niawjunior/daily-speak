import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Deployed under a path (sales-demo/<app>/): built with BASE_PATH=/<app>/ — every asset and route follows it.
const base = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");

export default defineConfig({
  base,
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // The API beside the page (scripts/dev.ts says where it is).
  server: { proxy: { [`${base}api`]: `http://localhost:${process.env.API_PORT ?? 3000}` } },
});
