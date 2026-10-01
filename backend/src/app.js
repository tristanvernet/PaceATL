import express from "express";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (req, res) =>
  res.json({ data: { status: "ok", service: "PaceATL" } }),
);
// Add feature routers above this API not-found handler.
app.use("/api", (req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "API endpoint not found." } }),
);
const dist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}
app.use((req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Page not found." } }),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status >= 400 && error.status < 600 ? error.status : 500;
  res
    .status(status)
    .json({
      error: {
        code: status === 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST",
        message:
          status === 500
            ? "An unexpected server error occurred."
            : "The request could not be read.",
      },
    });
});
