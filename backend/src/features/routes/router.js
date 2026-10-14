import { Router } from "express";
import { listRoutes, createRoute, deleteRoute } from "./service.js";

export const routesRouter = Router();
routesRouter.get("/", async (req, res) => res.json({ data: await listRoutes(req) }));
routesRouter.post("/", async (req, res) => res.status(201).json({ data: await createRoute(req, req.body) }));
routesRouter.delete("/:routeId", async (req, res) => res.json({ data: await deleteRoute(req, req.params.routeId) }));
