import { Router } from "express";
import { listHotspots } from "./service.js";
export const hotspotsRouter = Router();
hotspotsRouter.get("/", async (req, res, next) => {
  try { res.json({ data: await listHotspots(req.query.activity || "all") }); }
  catch (error) { next(error); }
});
