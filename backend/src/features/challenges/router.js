import { Router } from "express";
import { getDailyChallenge } from "./service.js";
export const challengesRouter = Router();
challengesRouter.get("/today", async (req, res, next) => {
  try { res.json({ data: await getDailyChallenge(req) }); }
  catch (error) { next(error); }
});
