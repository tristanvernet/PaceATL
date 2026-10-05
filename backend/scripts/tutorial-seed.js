import { getDatabase, closeDatabase, databaseErrorMessage } from "../src/database.js";
import { workoutTutsCatalog } from "../src/features/tutorials/Workout_Tuts_Tips.js";

let connection;
try {
  connection = await getDatabase().getConnection();
  await connection.beginTransaction();
  let inserted = 0;
  for (const tutorial of workoutTutsCatalog) {
    const [existing] = await connection.execute("SELECT tut_id FROM tutorials WHERE tut_id = ?", [tutorial.tutId]);
    if (existing.length) continue;
    await connection.execute(
      "INSERT INTO tutorials (tut_id, title, category, difficulty_level, target_muscle_group, estimated_duration_mins, description, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [tutorial.tutId, tutorial.title, tutorial.category, tutorial.difficultyLevel, tutorial.targetMuscleGroup,
        tutorial.estimatedDurationMins, tutorial.description, tutorial.videoUrl || null]);
    const seen = new Set();
    let number = 0;
    for (const step of tutorial.steps) {
      const text = step.instructionText.trim();
      // Original warmup data repeats high knees and repeats step IDs/numbers.
      if (seen.has(text)) continue;
      seen.add(text); number++;
      await connection.execute(
        "INSERT INTO tutorial_steps (step_id, tut_id, step_number, instruction_text, tip_notes) VALUES (?, ?, ?, ?, ?)",
        [`${tutorial.tutId}-s${number}`, tutorial.tutId, number, step.instructionText, step.tipNotes]);
    }
    inserted++;
  }
  await connection.commit();
  console.log(`Added ${inserted} tutorials from Iyana's content. Existing tutorials were left unchanged.`);
} catch (error) {
  if (connection) await connection.rollback();
  console.error(databaseErrorMessage(error));
  process.exitCode = 1;
} finally {
  connection?.release();
  await closeDatabase();
}
