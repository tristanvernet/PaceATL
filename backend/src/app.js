import express from "express";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { tutorialsRouter } from "./features/tutorials/router.js";
import { authRouter } from "./features/auth/router.js";
import { AuthError } from "./features/auth/service.js";
import { TutorialError } from "./features/tutorials/Workout_Tuts_Tips.js";
import { rewardsRouter } from "./features/rewards/router.js";
import { RewardError } from "./features/rewards/service.js";
export const app = express();
app.disable("x-powered-by");
// Only explicitly configured browser previews can read API responses.
app.use("/api", (req, res, next) => {
  const allowed = (
    process.env.CORS_ORIGINS || "http://localhost:8081,http://127.0.0.1:8081"
  )
    .split(",")
    .map((value) => value.trim());
  const origin = req.get("Origin");
  res.vary("Origin");
  if (origin && allowed.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use("/api", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.get("/api/health", (req, res) =>
  res.json({ data: { status: "ok", service: "PaceATL" } }),
);
// Add feature routers above this API not-found handler.
app.use("/api/tutorials", tutorialsRouter);
app.use("/api/auth", authRouter);
app.use("/api/rewards", rewardsRouter);
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
  if (error instanceof AuthError || error instanceof TutorialError || error instanceof RewardError)
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  const status = error.status >= 400 && error.status < 600 ? error.status : 500;
  res.status(status).json({
    error: {
      code: status === 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST",
      message:
        status === 500
          ? "An unexpected server error occurred."
          : "The request could not be read.",
    },
  });
});
