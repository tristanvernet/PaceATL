import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";

// Uses the UTC date consistently with MySQL's configured UTC connection.
export function utcDay(now = new Date()) { return now.toISOString().slice(0, 10); }
export function progressFor(challenge, rows) {
  const eligible = rows.filter(row => challenge.activityType === "any" || row.activityType === challenge.activityType);
  if (challenge.metric === "workouts") return eligible.length;
  return eligible.reduce((sum, row) => sum + Number(challenge.metric === "miles" ? row.distanceMiles : row.durationMinutes), 0);
}
export async function getDailyChallenge(req, now = new Date()) {
  const user = await sessionUser(req);
  const db = getDatabase();
  const date = utcDay(now);
  const [challenges] = await db.execute(
    "SELECT challenge_id AS challengeId, DATE_FORMAT(challenge_date, '%Y-%m-%d') AS challengeDate, title, activity_type AS activityType, metric, target FROM daily_challenges WHERE challenge_date = ?", [date]);
  if (!challenges.length) return { challenge: null, message: "No challenge available." };
  const challenge = { ...challenges[0], target: Number(challenges[0].target) };
  const [rows] = await db.execute(
    "SELECT activity_type AS activityType, distance_miles AS distanceMiles, duration_minutes AS durationMinutes FROM workouts WHERE user_id = ? AND workout_date = ?", [user.id, date]);
  const progress = progressFor(challenge, rows);
  const qualified = progress >= challenge.target;
  if (qualified) {
    await db.execute("INSERT IGNORE INTO daily_challenge_completions (user_id, challenge_id) VALUES (?, ?)", [user.id, challenge.challengeId]);
  }
  const [completed] = await db.execute(
    "SELECT completion_id FROM daily_challenge_completions WHERE user_id = ? AND challenge_id = ? LIMIT 1", [user.id, challenge.challengeId]);
  return { challenge, progress: Number(progress.toFixed(2)), completed: completed.length > 0 };
}
