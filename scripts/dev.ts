export {};
// `bun run dev`: the API (restarted on every change under server/) and vite (hot reload) together. The page's port is
// PORT, or `--port <n>` after it (what the runner gives); the API takes a free port of its own, told to vite.
const args = process.argv.slice(2);
const at = args.indexOf("--port");
const port = at >= 0 ? args[at + 1] : process.env.PORT;
const free = () => {
  const s = Bun.serve({ port: 0, fetch: () => new Response() });
  const p = s.port;
  s.stop(true);
  return p;
};
const apiPort = process.env.API_PORT ?? String(free());
const env = { ...process.env, API_PORT: apiPort };
const api = Bun.spawn(["bun", "--watch", "server/main.ts"], { env: { ...env, PORT: apiPort, SERVE_PAGE: "0" }, stdout: "inherit", stderr: "inherit" });
const web = Bun.spawn(["bunx", "--bun", "vite", ...(port ? ["--port", port, "--strictPort"] : [])], { env, stdout: "inherit", stderr: "inherit" });
const stop = () => {
  api.kill();
  web.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await Promise.race([api.exited, web.exited]);
stop();
process.exit(1);
