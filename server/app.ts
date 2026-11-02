import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { items, type Item } from "./data";

// Deployed under a path (sales-demo/<app>/): built and started with BASE_PATH=/<app>/ — the page, the API and their docs
// all live under it. "/" when run on its own.
export const BASE = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");

const Status = t.Union([t.Literal("open"), t.Literal("in_progress"), t.Literal("done")]);

// The API, under /api — the page calls it through Eden (src/lib/api.ts), typed end to end.
export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(openapi({ path: "/openapi", documentation: { info: { title: "API", version: "0.1.0" }, servers: BASE === "/" ? undefined : [{ url: BASE.slice(0, -1) }] } }))
  .get("/items", () => items)
  .get("/items/:id", ({ params, status }) => items.find((i) => i.id === params.id) ?? status(404, { error: "not found" }), {
    params: t.Object({ id: t.Numeric() }),
  })
  .post(
    "/items",
    ({ body }) => {
      const item: Item = { id: Math.max(0, ...items.map((i) => i.id)) + 1, status: "open", ...body, updatedAt: new Date().toISOString() };
      items.push(item);
      return item;
    },
    { body: t.Object({ name: t.String({ minLength: 1 }), owner: t.String(), status: t.Optional(Status) }) },
  )
  .patch(
    "/items/:id",
    ({ params, body, status }) => {
      const item = items.find((i) => i.id === params.id);
      if (!item) return status(404, { error: "not found" });
      Object.assign(item, body, { updatedAt: new Date().toISOString() });
      return item;
    },
    { params: t.Object({ id: t.Numeric() }), body: t.Partial(t.Object({ name: t.String({ minLength: 1 }), owner: t.String(), status: Status })) },
  )
  .delete(
    "/items/:id",
    ({ params, status }) => {
      const at = items.findIndex((i) => i.id === params.id);
      if (at < 0) return status(404, { error: "not found" });
      return items.splice(at, 1)[0];
    },
    { params: t.Object({ id: t.Numeric() }) },
  );

export type App = typeof app;
