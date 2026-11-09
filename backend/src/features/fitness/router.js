import { Router } from "express";
import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";

export class FitnessError extends Error {
  constructor(code, message, status = 400) {
    super(message); this.code = code; this.status = status;
  }
}

export const fitnessRouter = Router();

export function validateShare(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new FitnessError(
      "INVALID_INPUT",
      "Enter valid sharing information."
    );
  }

  const { kind, sourceId, target, unit } = body;
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || title.length > 120) {
    throw new FitnessError(
      "INVALID_INPUT",
      "Enter a title of 1–120 characters."
    );
  }

  if (!["route", "workout", "goal"].includes(kind)) {
    throw new FitnessError(
      "INVALID_INPUT",
      "Choose route, workout, or goal."
    );
  }

  if (kind === "goal") {
    if (
      typeof target !== "number" ||
      !Number.isFinite(target) ||
      target < 0.01 ||
      target > 99999999.99 ||
      Math.round(target * 100) / 100 !== target
    ) {
      throw new FitnessError(
        "INVALID_INPUT",
        "Enter a positive target with up to two decimal places."
      );
    }

    if (
      !["miles", "minutes", "workouts"].includes(unit) ||
      (unit === "workouts" && !Number.isInteger(target))
    ) {
      throw new FitnessError(
        "INVALID_INPUT",
        "Choose miles, minutes, or a whole number of workouts."
      );
    }
  } else if (!Number.isSafeInteger(sourceId) || sourceId < 1) {
    throw new FitnessError(
      "INVALID_INPUT",
      "Select one of your saved items."
    );
  }

  return { kind, title, sourceId, target, unit };
}

fitnessRouter.get("/dashboard", async (req, res) => {
  const user = await sessionUser(req);
  const period = req.query.period || "7";

  if (!["7", "30", "all"].includes(period)) {
    throw new FitnessError(
      "INVALID_INPUT",
      "Choose 7 days, 30 days, or all time."
    );
  }

  const days = period === "all" ? null : Number(period);
  const today = new Date().toISOString().slice(0, 10);

  const start =
    days === null
      ? "1000-01-01"
      : new Date(
          Date.parse(today + "T00:00:00Z") -
            (days - 1) * 86400000
        )
          .toISOString()
          .slice(0, 10);

  const db = getDatabase();
  const where = "user_id = ? AND workout_date BETWEEN ? AND ?";
  const values = [user.id, start, today];

  const [totals] = await db.execute(
    `SELECT
       COUNT(*) AS activities,
       COALESCE(SUM(distance_miles), 0) AS distanceMiles,
       COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM workouts
     WHERE ${where}`,
    values
  );

  const [rows] = await db.execute(
    `SELECT
       DATE_FORMAT(workout_date, '%Y-%m-%d') AS date,
       SUM(duration_minutes) AS minutes
     FROM workouts
     WHERE ${where}
     GROUP BY workout_date
     ORDER BY workout_date`,
    values
  );

  const daily = new Map(
    rows.map(row => [row.date, Number(row.minutes)])
  );

  if (days !== null) {
    for (let i = 0; i < days; i++) {
      const date = new Date(
        Date.parse(start + "T00:00:00Z") + i * 86400000
      )
        .toISOString()
        .slice(0, 10);

      if (!daily.has(date)) daily.set(date, 0);
    }
  }

  res.json({
    data: {
      activities: Number(totals[0].activities),
      distanceMiles: Number(totals[0].distanceMiles),
      minutes: Number(totals[0].minutes),
      daily: [...daily]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, minutes]) => ({ date, minutes })),
    },
  });
});

fitnessRouter.get("/sources", async (req, res) => {
  const user = await sessionUser(req);
  const db = getDatabase();

  const [routes] = await db.execute(
    `SELECT route_id AS id, name
     FROM saved_routes
     WHERE user_id = ?
     ORDER BY route_id DESC
     LIMIT 100`,
    [user.id]
  );

  const [workouts] = await db.execute(
    `SELECT
       workout_id AS id,
       activity_type AS name,
       distance_miles AS distanceMiles
     FROM workouts
     WHERE user_id = ?
     ORDER BY workout_date DESC, workout_id DESC
     LIMIT 100`,
    [user.id]
  );

  res.json({
    data: {
      routes,
      workouts: workouts.map(w => ({ ...w, distanceMiles: Number(w.distanceMiles) })),
    },
  });
});

fitnessRouter.get("/shares", async (req, res) => {
  const user = await sessionUser(req);

  const [rows] = await getDatabase().execute(`
    SELECT
      s.id,
      s.kind,
      s.title,
      s.target,
      s.unit,
      s.user_id AS ownerId,
      u.name AS author,
      r.name AS routeName,
      r.distance_meters AS distanceMeters,
      w.activity_type AS activityType,
      w.distance_miles AS distanceMiles,
      w.duration_minutes AS durationMinutes
    FROM fitness_shares s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN saved_routes r
      ON r.route_id = s.route_id
      AND r.user_id = s.user_id
    LEFT JOIN workouts w
      ON w.workout_id = s.workout_id
      AND w.user_id = s.user_id
    WHERE
      s.kind = 'goal'
      OR r.route_id IS NOT NULL
      OR w.workout_id IS NOT NULL
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT 100
  `);

  res.json({
    data: rows.map(({ ownerId, ...row }) => ({
      ...row,
      // mysql2 returns DECIMAL columns as strings.
      target: row.target == null ? null : Number(row.target),
      distanceMiles: row.distanceMiles == null ? null : Number(row.distanceMiles),
      isOwner: Number(ownerId) === Number(user.id),
    })),
  });
});

fitnessRouter.post("/shares", async (req, res) => {
  const user = await sessionUser(req);
  const { kind, title, sourceId, target, unit } =
    validateShare(req.body);

  const db = getDatabase();

  if (kind !== "goal") {
    const sql =
      kind === "route"
        ? "SELECT route_id FROM saved_routes WHERE route_id = ? AND user_id = ?"
        : "SELECT workout_id FROM workouts WHERE workout_id = ? AND user_id = ?";

    const [rows] = await db.execute(sql, [sourceId, user.id]);

    if (!rows.length) {
      throw new FitnessError(
        "NOT_FOUND",
        "Saved item not found.",
        404
      );
    }
  }

  const [result] = await db.execute(
    `INSERT INTO fitness_shares
       (user_id, kind, title, route_id, workout_id, target, unit)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      kind,
      title,
      kind === "route" ? sourceId : null,
      kind === "workout" ? sourceId : null,
      kind === "goal" ? target : null,
      kind === "goal" ? unit : null,
    ]
  );

  res.status(201).json({ data: { id: result.insertId } });
});

fitnessRouter.delete("/shares/:id", async (req, res) => {
  const user = await sessionUser(req);

  if (
    !/^[1-9][0-9]*$/.test(req.params.id) ||
    !Number.isSafeInteger(Number(req.params.id))
  ) {
    throw new FitnessError("INVALID_INPUT", "Invalid share.");
  }

  const [result] = await getDatabase().execute(
    "DELETE FROM fitness_shares WHERE id = ? AND user_id = ?",
    [Number(req.params.id), user.id]
  );

  if (!result.affectedRows) {
    throw new FitnessError("NOT_FOUND", "Share not found.", 404);
  }

  res.json({ data: { removed: true } });
});