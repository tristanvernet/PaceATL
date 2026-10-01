import { app } from "./app.js";
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`PaceATL backend: http://localhost:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
