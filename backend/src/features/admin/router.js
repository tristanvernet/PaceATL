import { Router } from "express";
import { pendingReports, reviewReport, listUsers, setUserStatus } from "./service.js";

export const adminRouter = Router();
adminRouter.get("/reports", async (req, res) => res.json({ data: await pendingReports(req) }));
adminRouter.patch("/reports/:id", async (req, res) =>
  res.json({ data: await reviewReport(req, req.params.id, req.body?.decision) }));
adminRouter.get("/users", async (req, res) => res.json({ data: await listUsers(req) }));
adminRouter.patch("/users/:id", async (req, res) =>
  res.json({ data: await setUserStatus(req, req.params.id, req.body?.status) }));