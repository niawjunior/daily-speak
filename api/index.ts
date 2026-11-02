import { app } from "../server/app.js";

// On Vercel: the whole API as one function. vercel.json sends every /api/* here and the request keeps its own path,
// so the Elysia app (prefix /api) routes it as it does under `bun run start`. Its data is in memory per instance.
const handle = (request: Request) => app.handle(request);

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE, handle as OPTIONS, handle as HEAD };
