import { Router } from "express";
import { getDatabase } from "../../database.js";
import { validateAuth } from "../../../../frontend/src/features/auth/validation.js";
import { AuthError, hashPassword, verifyPassword, createSession, sessionUser, publicUser } from "./service.js";

export const authRouter = Router();
const attempts = new Map();
function limit(req, res, next) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = req.ip;
  const value = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (value.count >= 20 || (!attempts.has(key) && attempts.size >= 10000)) {
    res.set("Retry-After", String(Math.ceil((value.until - now) / 1000)));
    return next(new AuthError("RATE_LIMITED", "Too many sign-in attempts. Please try again later.", 429));
  }
  value.count++; attempts.set(key, value); next();
}
function input(body, mode) {
  const required = mode === "signup" ? ["name", "email", "password", "confirmPassword"] : ["email", "password"];
  if (!body || required.some((key) => typeof body[key] !== "string"))
    throw new AuthError("INVALID_INPUT", "Please complete the required account fields.");
  if (body.password.length > 128) throw new AuthError("INVALID_INPUT", "Password is too long.");
  const errors = validateAuth(body, mode);
  if (Object.keys(errors).length) throw new AuthError("INVALID_INPUT", Object.values(errors)[0]);
  return { name: body.name?.trim(), email: body.email.trim().toLowerCase(), password: body.password };
}

authRouter.post("/signup", limit, async (req, res) => {
  const values = input(req.body, "signup");
  const hash = await hashPassword(values.password);
  const connection = await getDatabase().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [values.name, values.email, hash]);
    const user = { id: result.insertId, name: values.name, email: values.email };
    const token = await createSession(connection, user.id);
    await connection.commit();
    res.status(201).json({ data: { user, token } });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw new AuthError("EMAIL_IN_USE", "An account with that email already exists.", 409);
    throw error;
  } finally { connection.release(); }
});

authRouter.post("/login", limit, async (req, res) => {
  const values = input(req.body, "login");
  const database = getDatabase();
  const [rows] = await database.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", [values.email]);
  if (!await verifyPassword(values.password, rows[0]?.password_hash))
    throw new AuthError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
  const token = await createSession(database, rows[0].id);
  res.json({ data: { user: publicUser(rows[0]), token } });
});
authRouter.get("/me", async (req, res) => res.json({ data: await sessionUser(req) }));
authRouter.post("/logout", async (req, res) => {
  await sessionUser(req);
  await getDatabase().execute("DELETE FROM user_sessions WHERE token_hash = ?", [req.sessionTokenHash]);
  res.json({ data: { loggedOut: true } });
});
