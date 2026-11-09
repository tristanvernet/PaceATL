import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";

export class ReportError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.code = code; this.status = status;
  }
}
const CATEGORIES = ["lighting", "hazard", "suspicious", "surface"];
const columns = "id, title, category, description, latitude, longitude, route_id AS routeId, status, created_at AS createdAt";
// mysql2 returns DECIMAL columns as strings.
const toReport = (row) => ({ ...row, latitude: Number(row.latitude), longitude: Number(row.longitude) });
const isCoordinate = (value, limit) => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export async function submitReport(req, body) {
  const user = await sessionUser(req);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!title || title.length > 255) throw new ReportError("INVALID_REPORT", "Give the report a title (up to 255 characters).");
  if (!CATEGORIES.includes(body?.category)) throw new ReportError("INVALID_REPORT", "Choose a report category.");
  if (description.length > 1000) throw new ReportError("INVALID_REPORT", "Description can be up to 1000 characters.");
  if (!isCoordinate(body?.latitude, 90) || !isCoordinate(body?.longitude, 180))
    throw new ReportError("INVALID_REPORT", "The report needs a valid location.");
  const routeId = body?.routeId ?? null;
  const database = getDatabase();
  if (routeId !== null) {
    const [routes] = Number.isInteger(routeId)
      ? await database.execute("SELECT route_id FROM saved_routes WHERE route_id = ? AND user_id = ?", [routeId, user.id])
      : [[]];
    if (!routes.length) throw new ReportError("ROUTE_NOT_FOUND", "Route not found.", 404);
  }
  const [result] = await database.execute(
    "INSERT INTO safety_reports (user_id, title, category, description, latitude, longitude, route_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user.id, title, body.category, description || null, body.latitude, body.longitude, routeId]);
  const [rows] = await database.execute(`SELECT ${columns} FROM safety_reports WHERE id = ?`, [result.insertId]);
  return toReport(rows[0]);
}

export async function getApprovedReps() {
  const [rows] = await getDatabase().execute(
    `SELECT ${columns} FROM safety_reports WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 100`);
  return rows.map(toReport);
}
