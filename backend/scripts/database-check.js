import { getDatabase, closeDatabase, databaseErrorMessage } from "../src/database.js";

try {
  const database = getDatabase();
  await database.execute("SELECT 1 AS connected");
  const [tables] = await database.execute(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME",
  );
  console.log("Connected to MySQL successfully with verified TLS (or local development connection).");
  console.log(`Tables: ${tables.map((table) => table.name).join(", ") || "none yet"}`);
} catch (error) {
  console.error(databaseErrorMessage(error));
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
