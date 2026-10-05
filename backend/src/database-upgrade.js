// Extend Jacob's original tables without dropping tables or deleting rows.
export async function upgradeSchema(database) {
  const [columns] = await database.execute(
    "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, CHARACTER_MAXIMUM_LENGTH AS maxLength, EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()",
  );
  const column = (table, name) => columns.find((c) => c.tableName === table && c.columnName === name);
  if (Number(column("users", "name")?.maxLength) < 100)
    await database.query("ALTER TABLE users MODIFY COLUMN name VARCHAR(100)");
  if (Number(column("users", "email")?.maxLength) < 254)
    await database.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(254)");
  if (!column("tutorials", "video_url"))
    await database.query("ALTER TABLE tutorials ADD COLUMN video_url VARCHAR(2048)");
  if (!column("completed_tutorials", "user_id"))
    await database.query("ALTER TABLE completed_tutorials ADD COLUMN user_id INT NULL");
  if (!column("completed_tutorials", "completion_id")?.extra?.includes("auto_increment"))
    await database.query("ALTER TABLE completed_tutorials MODIFY COLUMN completion_id INT NOT NULL AUTO_INCREMENT");

  const [foreignKeys] = await database.execute(
    "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
  );
  if (!foreignKeys.some((key) => key.tableName === "completed_tutorials" && key.columnName === "user_id"))
    await database.query("ALTER TABLE completed_tutorials ADD CONSTRAINT fk_completed_tutorial_user FOREIGN KEY (user_id) REFERENCES users(id)");

  const [indexes] = await database.execute(
    "SELECT INDEX_NAME AS name, COLUMN_NAME AS columnName, NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS position FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tutorial_steps'",
  );
  const grouped = Map.groupBy(indexes, (index) => index.name);
  const correct = [...grouped.values()].some((parts) =>
    parts.length === 2 && parts.every((part) => Number(part.nonUnique) === 0) &&
    parts.some((part) => part.columnName === "tut_id") &&
    parts.some((part) => part.columnName === "step_number"));
  if (!correct)
    await database.query("ALTER TABLE tutorial_steps ADD UNIQUE KEY tutorial_step_order (tut_id, step_number)");
  // Add the correct constraint before removing the original global constraint.
  for (const [name, parts] of grouped) {
    if (parts.length === 1 && parts[0].columnName === "step_number" && Number(parts[0].nonUnique) === 0) {
      const escapedName = name.replaceAll("`", "``");
      await database.query(`ALTER TABLE tutorial_steps DROP INDEX \`${escapedName}\``);
    }
  }
}
