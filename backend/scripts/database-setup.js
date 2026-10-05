import { readFile } from "node:fs/promises";
import { getDatabase, closeDatabase, databaseErrorMessage } from "../src/database.js";
import { upgradeSchema } from "../src/database-upgrade.js";

try {
  const database = getDatabase();
  await database.execute("SELECT 1 AS connected");
  const sql = await readFile(new URL("../../database/migrations/001-schema.sql", import.meta.url), "utf8");
  // This controlled schema has no stored routines or semicolons within strings.
  for (const statement of sql.replace(/^--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean)) {
    await database.query(statement);
  }
  await upgradeSchema(database);
  console.log("Database setup complete. Existing rows were preserved.");
} catch (error) {
  console.error(databaseErrorMessage(error));
  console.error("Setup stopped. MySQL schema changes are not transactional; completed changes remain. Fix the issue and rerun setup.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
