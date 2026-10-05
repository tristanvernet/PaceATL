import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = fileURLToPath(new URL("../", import.meta.url));

export function databaseOptions(env = process.env) {
  const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = required.filter((key) => !env[key] || env[key].startsWith("PASTE_"));
  if (missing.length) {
    throw new Error(`Fill in ${missing.join(", ")} in backend/.env first.`);
  }
  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("DB_PORT must be the numeric port Jacob provided.");
  const local = ["localhost", "127.0.0.1", "::1"].includes(env.DB_HOST);
  if (!local && !env.DB_CA_PATH)
    throw new Error("Set DB_CA_PATH for the cloud database certificate.");
  return {
    host: env.DB_HOST,
    port,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ...(env.DB_CA_PATH ? {
      ssl: {
        ca: readFileSync(resolve(backendDirectory, env.DB_CA_PATH), "utf8"),
        rejectUnauthorized: true,
      },
    } : {}),
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: true,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 20,
    multipleStatements: false,
  };
}

let pool;
export function getDatabase() {
  pool ??= mysql.createPool(databaseOptions());
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

// Keep passwords, connection strings, and provider error messages out of logs.
export function databaseErrorMessage(error) {
  if (error.message?.startsWith("Fill in ") ||
      error.message?.startsWith("DB_PORT ") ||
      error.message?.startsWith("Set DB_CA_PATH ")) return error.message;
  const messages = {
    ER_ACCESS_DENIED_ERROR: "Database sign-in failed. Check DB_USER and DB_PASSWORD locally.",
    ER_BAD_DB_ERROR: "Database not found. Confirm DB_NAME with Jacob.",
    ENOTFOUND: "Database host could not be found. Check DB_HOST and your network.",
    ETIMEDOUT: "Database connection timed out. Check the port and cloud network access.",
    ECONNREFUSED: "Database refused the connection. Check its host, port, and service status.",
    ENOENT: "Certificate file not found. Check DB_CA_PATH.",
    HANDSHAKE_SSL_ERROR: "Database certificate verification failed. Confirm Jacob's CA certificate.",
    ER_DUP_ENTRY: "Existing duplicate records prevent this schema update. Ask Jacob to review them; no records were deleted.",
    ER_NO_REFERENCED_ROW_2: "Existing records reference missing parent records. Ask Jacob to review them; no records were deleted.",
  };
  return messages[error.code] || "Database operation failed. Check the connection settings and database permissions with Jacob.";
}
