import { getDatabase } from "../../database.js";
import { TutorialError } from "./Workout_Tuts_Tips.js";

function tutorial(row) {
  return { tutId: row.tut_id, title: row.title, category: row.category,
    difficultyLevel: row.difficulty_level, targetMuscleGroup: row.target_muscle_group,
    estimatedDurationMins: row.estimated_duration_mins, description: row.description,
    videoUrl: row.video_url || "", createdAt: row.created_at };
}
export async function listTutorials(category) {
  if (category !== undefined && (typeof category !== "string" || !category.trim()))
    throw new TutorialError("INVALID_CATEGORY", "Category filter cannot be blank or repeated.", 400);
  const [rows] = await getDatabase().execute(
    `SELECT * FROM tutorials ${category === undefined ? "" : "WHERE category = ?"} ORDER BY tut_id`,
    category === undefined ? [] : [category.trim()]);
  return rows.map(tutorial);
}
export async function getTutorial(id, userId) {
  const database = getDatabase();
  const [rows] = await database.execute("SELECT * FROM tutorials WHERE tut_id = ?", [id]);
  if (!rows.length) throw new TutorialError("NOT_FOUND", "Tutorial not found.", 404);
  const [steps] = await database.execute("SELECT * FROM tutorial_steps WHERE tut_id = ? ORDER BY step_number", [id]);
  let completed = false;
  if (userId) {
    const [records] = await database.execute("SELECT completion_id FROM completed_tutorials WHERE user_id = ? AND tut_id = ? LIMIT 1", [userId, id]);
    completed = records.length > 0;
  }
  return { ...tutorial(rows[0]), completed, steps: steps.map((step) => ({
    stepId: step.step_id, tutorialId: step.tut_id, stepNumber: step.step_number,
    instructionText: step.instruction_text, tipNotes: step.tip_notes,
  })) };
}
export async function logCompleted(userId, id) {
  const connection = await getDatabase().getConnection();
  try {
    await connection.beginTransaction();
    // Serialize writes for this user so double taps cannot create duplicate completions.
    const [users] = await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
    if (!users.length) throw new TutorialError("UNAUTHORIZED", "Sign in to continue.", 401);
    const [tutorials] = await connection.execute("SELECT tut_id FROM tutorials WHERE tut_id = ?", [id]);
    if (!tutorials.length) throw new TutorialError("NOT_FOUND", "Tutorial not found.", 404);
    const [previous] = await connection.execute("SELECT completion_id FROM completed_tutorials WHERE user_id = ? AND tut_id = ? LIMIT 1", [userId, id]);
    let completionId = previous[0]?.completion_id;
    if (!completionId) {
      const [result] = await connection.execute("INSERT INTO completed_tutorials (user_id, tut_id) VALUES (?, ?)", [userId, id]);
      completionId = result.insertId;
    }
    await connection.commit();
    return { completionId, userId, tutorialId: id };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
