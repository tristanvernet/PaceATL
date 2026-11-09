import { Router } from "express";
import { chatHandle } from "./service.js";
import { ChatbotError } from "./service.js";
import { sessionUser } from "../auth/service.js";
export const chatbotRouter = Router(); 
chatbotRouter.post("/chat", async (req, res) => {
    const { message, history } = req.body;
        if (!message || typeof message !== "string") {throw new ChatbotError("INVALID_REQUEST", "A message is required.", 400);}
    const user = await sessionUser(req);
    res.json({ data: await chatHandle(user.id, message, history) });
});