import { app } from "./app.js";
import { closeDatabase } from "./database.js";
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";
const server = app.listen(port, host, () =>
  console.log(`PaceATL backend listening on ${host}:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(async () => {
    await closeDatabase();
    process.exit(0);
  }));
