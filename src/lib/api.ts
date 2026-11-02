import { treaty } from "@elysiajs/eden";
import type { App } from "../../server/app";

// The API, typed from the server's own routes: `api.today.get()`, `api.words({ id }).get()`.
// Under the page's own path when deployed under one (BASE_PATH) — the server mounts the API there too.
export const api = treaty<App>(location.origin + (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")).api;
