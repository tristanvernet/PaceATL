// A starting point for Iyana's tutorial handlers when the data setup is ready.
// Until then, requests fall through to the shared API not-found response.
// primary error handling and invalid input checks

import { Router } from "express";
import {listTutorials, getTutorial, logCompleted, TutorialError,
} 
from "./Workout_Tuts_Tips.js";

export const tutorialsRouter = Router();

tutorialsRouter.get("/", (req, res) => {
  res.json({ data: listTutorials(req.query.category) });
});

tutorialsRouter.get("/:id", (req, res) => {
  res.json({ data: getTutorial(req.params.id) });
});

tutorialsRouter.post("/:id/complete", (req, res) => {
  const record = logCompleted(req.body?.userId, req.params.id);
  res.status(201).json({ data: record });
});

tutorialsRouter.use((error, req, res, next) => {
  if (error instanceof TutorialError)
    return res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
  next(error);
});
