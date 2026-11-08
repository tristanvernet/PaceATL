import { Router } from "express";
import { submitReport, getApprovedReps } from "./service.js";
export const safetyRouter = Router();
safetyRouter.get("/approved", async (req, res) => res.json({ data: await getApprovedReps() }));
safetyRouter.post("/report", async (req, res) => res.status(201).json({ data: await submitReport(req, req.body) }));