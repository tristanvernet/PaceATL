import { getDatabase } from "../../database.js";
import { generateChatAdvice } from "../../ai/client.js";


export async function chatHandle(userId, userMessage, conversationHistory = []) {
let stats = {};

try {
    const [rows] = await getDatabase().query(
      "SELECT fitness_level, goal, preferred_activity FROM users WHERE id = ?",
      [userId]
    );

    if (rows && rows.length > 0) {
      stats = rows[0];
    }
  } catch (err) {
    console.warn("Could not fetch user profile for chatbot context:", err.message);
  }

  const systemInstruction = `
    You are PaceATL's AI Fitness Coach. 
    User Profile Context:
    - Fitness Level: ${stats.fitness_level || "Intermediate"}
    - Primary Goal: ${stats.goal || "General Fitness"}
    - Preferred Activity: ${stats.preferred_activity || "Running/Walking"}
    Give the user concise and uplifting fitness advice tailored to their profile. 
    Everything should be straightfoward and helpful!
  `;

  const History = conversationHistory.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  History.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  return await generateChatAdvice(systemInstruction, History);
}
