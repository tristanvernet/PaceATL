import { Router } from "express";
import { listTutorials, getTutorial, logCompleted } from "./repository.js";
import { sessionUser } from "../auth/service.js";

export const tutorialsRouter = Router();

tutorialsRouter.get("/", async (req, res) => {
  res.json({ data: await listTutorials(req.query.category) });
});

tutorialsRouter.get("/:id", async (req, res) => {
  const user = await sessionUser(req, false);
  res.json({ data: await getTutorial(req.params.id, user?.id) });
});

tutorialsRouter.post("/:id/complete", async (req, res) => {
  const user = await sessionUser(req);
  const record = await logCompleted(user.id, req.params.id);
  res.status(201).json({ data: record });
});
