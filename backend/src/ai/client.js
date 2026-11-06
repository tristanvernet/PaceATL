// Shared language-model client for AI features (route briefings, fitness coach).
// Any OpenAI-compatible endpoint works; settings come from backend/.env only.
export class AiError extends Error {
  constructor(code, message, status = 502) {
    super(message); this.code = code; this.status = status;
  }
}

// messages: [{ role: "system" | "user" | "assistant", content }]. With json, the parsed object is returned.
export async function chat(messages, { json = false, timeoutMs = 30000 } = {}) {
  const { AI_BASE_URL, AI_API_KEY, AI_MODEL } = process.env;
  if (!AI_BASE_URL || !AI_API_KEY || !AI_MODEL)
    throw new AiError("AI_NOT_CONFIGURED", "AI features are not configured on this server.", 503);
  let response;
  try {
    response = await fetch(`${AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, messages, ...(json && { response_format: { type: "json_object" } }) }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AiError("AI_UNAVAILABLE", "The AI service could not be reached. Try again shortly.");
  }
  if (response.status === 429) throw new AiError("AI_RATE_LIMITED", "Too many AI requests. Try again in a minute.", 429);
  if (!response.ok) throw new AiError("AI_UNAVAILABLE", "The AI service is unavailable. Try again shortly.");
  const content = (await response.json()).choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new AiError("AI_BAD_RESPONSE", "The AI service returned no answer.");
  if (!json) return content;
  try {
    // Some models wrap JSON in a ```json fence despite response_format.
    return JSON.parse(content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
  } catch {
    throw new AiError("AI_BAD_RESPONSE", "The AI service returned an unreadable answer.");
  }
}
