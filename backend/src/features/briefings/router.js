import { Router } from "express";
import { getBriefing } from "./service.js";

export const briefingsRouter = Router();
briefingsRouter.post("/:routeId/briefing", async (req, res) => res.json({ data: await getBriefing(req, req.params.routeId) }));
