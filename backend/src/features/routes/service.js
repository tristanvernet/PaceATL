import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";
import { validateRoute, routeDistanceMeters } from "../../../../frontend/src/features/routes/geometry.js";

export class RouteError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.code = code; this.status = status;
  }
}
const columns = "route_id AS routeId, name, points, distance_meters AS distanceMeters, created_at AS createdAt";

export async function listRoutes(req) {
  const user = await sessionUser(req);
  const [rows] = await getDatabase().execute(
    `SELECT ${columns} FROM saved_routes WHERE user_id = ? ORDER BY created_at DESC, route_id DESC`, [user.id]);
  return rows;
}

export async function createRoute(req, body) {
  const user = await sessionUser(req);
  const errors = validateRoute(body);
  if (Object.keys(errors).length) throw new RouteError("INVALID_ROUTE", Object.values(errors)[0]);
  const points = body.points.map(({ latitude, longitude }) => ({ latitude, longitude }));
  const database = getDatabase();
  const [result] = await database.execute(
    "INSERT INTO saved_routes (user_id, name, points, distance_meters) VALUES (?, ?, ?, ?)",
    [user.id, body.name.trim(), JSON.stringify(points), routeDistanceMeters(points)]);
  const [rows] = await database.execute(`SELECT ${columns} FROM saved_routes WHERE route_id = ?`, [result.insertId]);
  return rows[0];
}

export async function deleteRoute(req, routeIdParam) {
  const user = await sessionUser(req);
  if (/^\d{1,10}$/.test(routeIdParam)) {
    const routeId = Number(routeIdParam);
    const [result] = await getDatabase().execute(
      "DELETE FROM saved_routes WHERE route_id = ? AND user_id = ?", [routeId, user.id]);
    if (result.affectedRows) return { routeId };
  }
  // The same 404 for another user's route keeps its existence private.
  throw new RouteError("ROUTE_NOT_FOUND", "Route not found.", 404);
}
