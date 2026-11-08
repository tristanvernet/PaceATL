import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";
import { RouteError } from "../routes/service.js";
import { chat, AiError } from "../../ai/client.js";
import { gatherFacts } from "./facts.js";

// Weather changes, so a stored briefing is reused for three hours.
const FRESH_HOURS = 3;
const INSTRUCTIONS = `You write short pre-activity briefings for runners and cyclists in Atlanta.
Use only the facts provided. Never invent hazards, closures, traffic, landmarks or conditions.
A fact that is null was unavailable: say so briefly instead of guessing.
Reply as JSON: {
  "summary": "2-3 sentences: distance, overall difficulty and what to expect",
  "terrain": "1-2 sentences on climbing and the steepest section, using the given numbers",
  "highlights": ["one short line per named place from highlights, at most 5"],
  "hazards": ["one short line per reported hazard; empty array if none"],
  "tips": ["2-4 practical preparation tips based on distance, terrain, weather and air quality"]
}`;

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const lines = (value, count) =>
  Array.isArray(value) ? value.map((line) => text(line, 200)).filter(Boolean).slice(0, count) : [];

async function ownedRoute(userId, routeIdParam) {
  if (/^\d{1,10}$/.test(routeIdParam)) {
    const [rows] = await getDatabase().execute(
      "SELECT route_id AS routeId, points FROM saved_routes WHERE route_id = ? AND user_id = ?",
      [Number(routeIdParam), userId]);
    if (rows.length) return rows[0];
  }
  throw new RouteError("ROUTE_NOT_FOUND", "Route not found.", 404);
}

// Until migration 003 is applied, briefings are generated every time instead of stored.
const missingTable = (error) => error.code === "ER_NO_SUCH_TABLE";

async function storedBriefing(routeId) {
  try {
    const [rows] = await getDatabase().execute(
      `SELECT briefing, model, generated_at AS generatedAt FROM route_briefings
       WHERE route_id = ? AND generated_at > UTC_TIMESTAMP() - INTERVAL ${FRESH_HOURS} HOUR`, [routeId]);
    return rows[0];
  } catch (error) {
    if (missingTable(error)) return undefined;
    throw error;
  }
}

async function storeBriefing(routeId, briefing, model) {
  try {
    await getDatabase().execute(
      `INSERT INTO route_briefings (route_id, briefing, model, generated_at) VALUES (?, ?, ?, UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE briefing = VALUES(briefing), model = VALUES(model), generated_at = VALUES(generated_at)`,
      [routeId, JSON.stringify(briefing), model]);
  } catch (error) {
    if (!missingTable(error)) throw error;
  }
}

export async function getBriefing(req, routeIdParam) {
  const user = await sessionUser(req);
  const route = await ownedRoute(user.id, routeIdParam);
  const stored = await storedBriefing(route.routeId);
  if (stored) return { routeId: route.routeId, ...stored.briefing, model: stored.model, generatedAt: stored.generatedAt };

  const facts = await gatherFacts(route.points);
  const answer = await chat([
    { role: "system", content: INSTRUCTIONS },
    { role: "user", content: `Route facts (US units):\n${JSON.stringify(facts)}` },
  ], { json: true });
  const summary = text(answer?.summary, 600);
  if (!summary) throw new AiError("AI_BAD_RESPONSE", "The AI service returned an incomplete briefing.");
  const briefing = {
    summary,
    terrain: text(answer.terrain, 400),
    // Highlights and hazards come only from gathered places and reports, so the model cannot add any when none were found.
    highlights: facts.highlights?.length ? lines(answer.highlights, 5) : [],
    hazards: facts.hazards.length ? lines(answer.hazards, 5) : [],
    tips: lines(answer.tips, 4),
    facts,
  };
  const model = process.env.AI_MODEL;
  await storeBriefing(route.routeId, briefing, model);
  const generatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  return { routeId: route.routeId, ...briefing, model, generatedAt };
}
