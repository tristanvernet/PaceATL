import { Router } from "express";
import { listWorkouts, createWorkout, deleteWorkout } from "./service.js";

export const workoutsRouter = Router();
workoutsRouter.get("/", async (req, res) => res.json({ data: await listWorkouts(req) }));
workoutsRouter.post("/", async (req, res) => res.status(201).json({ data: await createWorkout(req, req.body) }));
workoutsRouter.delete("/:workoutId", async (req, res) => res.json({ data: await deleteWorkout(req, req.params.workoutId) }));
