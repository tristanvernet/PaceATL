import { Router } from "express";
import { chatHandle } from "./service.js";
export const chatbotRouter = Router();
chatbotRouter.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
        if (!message || typeof message !== "string")
      return res.status(400).json({ error: { code: "INVALID_REQUEST", message: "A message is required." } });
    const userId = req.user?.id || req.body.userId;
    res.json({ data: await chatHandle(userId, message, history) });
  } catch (error) {
    console.error("Chatbot error:", error);
    next(error);
  }
});