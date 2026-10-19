import { Router } from "express";
import { getWeather } from "./service.js";
export const weatherRouter=Router();
weatherRouter.get("/",async(req,res)=>res.json({data:await getWeather()}));