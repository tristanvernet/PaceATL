import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";
import { recordActivity } from "../rewards/service.js";
import { validateWorkout, todayString } from "../../../../frontend/src/features/workouts/validation.js";

export class WorkoutError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.code = code; this.status = status;
  }
}
const columns = "workout_id AS workoutId, activity_type AS activityType, distance_miles AS distanceMiles, " +
  "duration_minutes AS durationMinutes, DATE_FORMAT(workout_date, '%Y-%m-%d') AS workoutDate, workout_desc AS notes, created_at AS createdAt";
// mysql2 returns DECIMAL columns as strings.
const toWorkout = (row) => ({ ...row, distanceMiles: Number(row.distanceMiles) });

export async function listWorkouts(req) {
  const user = await sessionUser(req);
  const [rows] = await getDatabase().execute(
    `SELECT ${columns} FROM workouts WHERE user_id = ? ORDER BY workout_date DESC, workout_id DESC LIMIT 100`, [user.id]);
  return rows.map(toWorkout);
}

export async function createWorkout(req, body) {
  const user = await sessionUser(req);
  // A day of slack lets users ahead of the server's time zone log today's workout.
  const errors = validateWorkout(body, todayString(new Date(Date.now() + 86400000)));
  if (Object.keys(errors).length) throw new WorkoutError("INVALID_WORKOUT", Object.values(errors)[0]);
  const workout = {
    activityType: body.activityType,
    distanceMiles: Math.round(body.distanceMiles * 100) / 100,
    durationMinutes: body.durationMinutes,
    workoutDate: body.workoutDate,
    notes: body.notes?.trim() || null,
  };
  const connection = await getDatabase().getConnection();
  try {
    await connection.beginTransaction();
    // Same lock as the rewards service, so concurrent logs can't award a badge twice.
    await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [user.id]);
    const [result] = await connection.execute(
      "INSERT INTO workouts (user_id, activity_type, distance_miles, duration_minutes, workout_date, workout_desc) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, workout.activityType, workout.distanceMiles, workout.durationMinutes, workout.workoutDate, workout.notes]);
    const rewards = await recordActivity(connection, user.id, workout, result.insertId);
    const [rows] = await connection.execute(`SELECT ${columns} FROM workouts WHERE workout_id = ?`, [result.insertId]);
    await connection.commit();
    return { workout: toWorkout(rows[0]), unlocked: rewards.unlocked };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function deleteWorkout(req, workoutIdParam) {
  const user = await sessionUser(req);
  if (/^\d{1,10}$/.test(workoutIdParam)) {
    const workoutId = Number(workoutIdParam);
    // Cascades to the linked reward event, so totals drop; earned badges are kept.
    const [result] = await getDatabase().execute(
      "DELETE FROM workouts WHERE workout_id = ? AND user_id = ?", [workoutId, user.id]);
    if (result.affectedRows) return { workoutId };
  }
  // The same 404 for another user's workout keeps its existence private.
  throw new WorkoutError("WORKOUT_NOT_FOUND", "Workout not found.", 404);
}
