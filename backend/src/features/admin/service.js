import { getDatabase } from "../../database.js";
import { AuthError, sessionUser } from "../auth/service.js";

async function requireAdmin(req) {
  const user = await sessionUser(req);
  if (user.role !== "admin") throw new AuthError("FORBIDDEN", "Administrators only.", 403);
  return user;
}

export async function pendingReports(req) {
  await requireAdmin(req);
  const [rows] = await getDatabase().execute(
    "SELECT r.id, r.title, r.category, r.description, r.created_at, u.name AS reporter FROM safety_reports r LEFT JOIN users u ON u.id = r.user_id WHERE r.status = 'pending' ORDER BY r.created_at");
  return rows;
}

export async function reviewReport(req, id, decision) {
  const admin = await requireAdmin(req);
  if (!["approved", "rejected"].includes(decision))
    throw new AuthError("INVALID_INPUT", "Decision must be approved or rejected.");
  await getDatabase().execute(
    "UPDATE safety_reports SET status = ?, reviewed_at = UTC_TIMESTAMP(), reviewed_by = ? WHERE id = ?",
    [decision, admin.id, id]);
  return { id: Number(id), status: decision };
}

export async function listUsers(req) {
  await requireAdmin(req);
  const [rows] = await getDatabase().execute(
    "SELECT id, name, email, role, status FROM users ORDER BY id");
  return rows;
}

export async function setUserStatus(req, id, status) {
  const admin = await requireAdmin(req);
  if (!["active", "restricted"].includes(status))
    throw new AuthError("INVALID_INPUT", "Status must be active or restricted.");
  if (Number(id) === admin.id)
    throw new AuthError("INVALID_INPUT", "You cannot restrict your own account.");
  await getDatabase().execute("UPDATE users SET status = ? WHERE id = ? AND role <> 'admin'", [status, id]);
  if (status === "restricted")
    await getDatabase().execute("DELETE FROM user_sessions WHERE user_id = ?", [id]);
  return { id: Number(id), status };
}