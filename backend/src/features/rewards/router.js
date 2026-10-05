import { Router } from "express";
import { recordRewardActivity, rewardsForRequest } from "./service.js";
export const rewardsRouter=Router();
rewardsRouter.get("/",async(req,res)=>res.json({data:await rewardsForRequest(req)}));
rewardsRouter.post("/activity",async(req,res)=>res.status(201).json({data:await recordRewardActivity(req,req.body)}));
