import test from "node:test";
import assert from "node:assert/strict";
import { databaseOptions, databaseErrorMessage } from "../src/database.js";
import { upgradeSchema } from "../src/database-upgrade.js";

const env = {
  DB_HOST: "localhost", DB_PORT: "3306", DB_NAME: "test",
  DB_USER: "test", DB_PASSWORD: "synthetic-test-value",
};

test("missing configuration fails locally without revealing credentials", () => {
  assert.throws(() => databaseOptions({ ...env, DB_PORT: "PASTE_JACOBS_PORT" }), /Fill in DB_PORT/);
  assert.throws(() => databaseOptions({ ...env, DB_PORT: "abc" }), /numeric port/);
  assert.throws(() => databaseOptions({ ...env, DB_HOST: "cloud.example" }), /certificate/);
  assert.equal(databaseOptions(env).multipleStatements, false);
  const cloud = databaseOptions({ ...env, DB_HOST: "cloud.example", DB_CA_PATH: "../database/ca.pem" });
  assert.equal(cloud.ssl.rejectUnauthorized, true);
  assert.match(cloud.ssl.ca, /BEGIN CERTIFICATE/);
  assert.doesNotMatch(databaseErrorMessage({ code: "ER_ACCESS_DENIED_ERROR", message: env.DB_PASSWORD }), /synthetic-test-value/);
  assert.doesNotMatch(databaseErrorMessage({ message: env.DB_PASSWORD }), /synthetic-test-value/);
});

function fixture({ upgraded = false, failIndex = false } = {}) {
  const statements = [];
  const columns = [
    { tableName: "users", columnName: "name", maxLength: upgraded ? 100 : 20 },
    { tableName: "users", columnName: "email", maxLength: upgraded ? 254 : 50 },
    { tableName: "completed_tutorials", columnName: "completion_id", extra: upgraded ? "auto_increment" : "" },
    ...(upgraded ? [
      { tableName: "tutorials", columnName: "video_url" },
      { tableName: "completed_tutorials", columnName: "user_id" },
    ] : []),
  ];
  const indexes = upgraded ? [
    { name: "tutorial_step_order", columnName: "tut_id", nonUnique: 0, position: 1 },
    { name: "tutorial_step_order", columnName: "step_number", nonUnique: 0, position: 2 },
  ] : [{ name: "step_number", columnName: "step_number", nonUnique: 0, position: 1 }];
  return {
    statements,
    execute: async (sql) => {
      if (sql.includes("information_schema.COLUMNS")) return [columns];
      if (sql.includes("KEY_COLUMN_USAGE")) return [upgraded ? [{ tableName: "completed_tutorials", columnName: "user_id" }] : []];
      if (sql.includes("STATISTICS")) return [indexes];
      throw new Error("Unexpected metadata query");
    },
    query: async (sql) => {
      if (failIndex && sql.includes("ADD UNIQUE KEY")) throw new Error("duplicate data");
      statements.push(sql);
    },
  };
}

test("original schema is extended without table or row deletion", async () => {
  const db = fixture();
  await upgradeSchema(db);
  assert.ok(db.statements.some((sql) => sql.includes("ADD COLUMN user_id")));
  assert.ok(db.statements.some((sql) => sql.includes("ADD COLUMN video_url")));
  const add = db.statements.findIndex((sql) => sql.includes("ADD UNIQUE KEY"));
  const drop = db.statements.findIndex((sql) => sql.includes("DROP INDEX"));
  assert.ok(add >= 0 && drop > add);
  assert.ok(db.statements.every((sql) => !/DROP TABLE|DELETE FROM|TRUNCATE/i.test(sql)));
});

test("already upgraded schema requires no more changes", async () => {
  const db = fixture({ upgraded: true });
  await upgradeSchema(db);
  assert.deepEqual(db.statements, []);
});

test("failed new constraint leaves the existing constraint intact", async () => {
  const db = fixture({ failIndex: true });
  await assert.rejects(upgradeSchema(db), /duplicate data/);
  assert.ok(db.statements.every((sql) => !sql.includes("DROP INDEX")));
});
