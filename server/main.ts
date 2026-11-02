import { resolve, sep } from "node:path";
import { Elysia } from "elysia";
import { app, BASE } from "./app";

// `bun run start`: the API and the built page (dist/) on one port — what a demo runs as after `bun run build`.
// `bun run dev` (scripts/dev.ts) runs this API alone, beside vite.
const DIST = resolve(import.meta.dir, "../dist");
const server = new Elysia().use(app);
if (process.env.SERVE_PAGE !== "0") {
  // A file of the built page, else the page itself — so a link straight to /items opens it (the router takes over).
  server.get("/*", async ({ params }) => {
    // An API path the server does not have is not a page.
    if ((params["*"] ?? "").startsWith("api/")) return new Response("Not found", { status: 404 });
    const path = resolve(DIST, params["*"] ?? "");
    const file = Bun.file(path);
    if (path.startsWith(DIST + sep) && (await file.exists())) return file;
    return Bun.file(`${DIST}/index.html`);
  });
}
// Under BASE_PATH a request is answered as if it came to "/" — whether the proxy in front keeps the path or strips it.
const port = Number(process.env.PORT) || 3000;
const listening = BASE === "/" ? server.listen(port).server : Bun.serve({ port, fetch: (request) => server.fetch(atRoot(request)) });
console.log(`API on http://localhost:${listening?.port}${BASE}api — its routes at ${BASE}api/openapi`);

function atRoot(request: Request) {
  const url = new URL(request.url);
  if (url.pathname !== BASE.slice(0, -1) && !url.pathname.startsWith(BASE)) return request;
  url.pathname = url.pathname.slice(BASE.length - 1) || "/";
  return new Request(url, request);
}
