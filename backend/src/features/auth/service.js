import { randomBytes, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase } from "../../database.js";

const derive = promisify(scrypt);
const options = { N: 65536, r: 8, p: 2, maxmem: 128 * 1024 * 1024 };
let hashing = 0;
export class AuthError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.code = code; this.status = status;
  }
}
async function passwordKey(password, salt) {
  if (hashing >= 2) throw new AuthError("BUSY", "Please try again in a moment.", 503);
  hashing++;
  try { return await derive(password, salt, 64, options); }
  finally { hashing--; }
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await passwordKey(password, salt);
  return `scrypt$65536$8$2$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password, hash) {
  const parts = typeof hash === "string" ? hash.split("$") : [];
  const valid = parts.length === 6 && parts.slice(0, 4).join("$") === "scrypt$65536$8$2" &&
    /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{128}$/.test(parts[5]);
  // Do the same expensive derivation for absent accounts and unsupported hashes.
  const key = await passwordKey(password, valid ? parts[4] : "0".repeat(32));
  return valid && timingSafeEqual(key, Buffer.from(parts[5], "hex"));
}
export const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
export const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

export async function createSession(database, userId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await database.execute("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    [tokenHash(token), userId, expiresAt]);
  return token;
}

export async function sessionUser(req, required = true) {
  const header = req.get("Authorization");
  if (!header && !required) return null;
  const match = /^Bearer ([a-f0-9]{64})$/.exec(header || "");
  if (!match) throw new AuthError("UNAUTHORIZED", "Sign in to continue.", 401);
  const [rows] = await getDatabase().execute(
    "SELECT u.id, u.name, u.email FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()",
    [tokenHash(match[1])]);
  if (!rows.length) throw new AuthError("UNAUTHORIZED", "Your session has ended. Please sign in again.", 401);
  req.sessionTokenHash = tokenHash(match[1]);
  req.user = publicUser(rows[0]);
  return req.user;
}
