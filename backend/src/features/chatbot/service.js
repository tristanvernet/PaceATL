import { getDatabase } from "../../database.js";
import { chat } from "../../ai/client.js";

export class ChatbotError extends Error {
  constructor(code, message, status = 400) {super(message); this.code = code; this.status = status;
  }
}
export async function chatHandle(userId, userMessage, conversationHistory = []) {
let stats = {}; 

//const database = getDatabase();

try {
    const [rows] = await getDatabase().query("SELECT fitness_level, goal, preferred_activity FROM users WHERE id = ?",
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
    - Preferred : ${stats.preferred_activity || "Running/Walking"}
    Give the user concise and uplifting fitness advice tailored to their profile. 
    Everything should be straightfoward and helpful!

  `;

    const messages = [];
        messages.push({ role: "system", content: systemInstruction });
        for (const msg of conversationHistory) {let role = "assistant";
            if (msg.sender === "user") {
            role = "user";}

    messages.push({ role: "user", content: userMessage });
            }

return await chat(messages);

    }