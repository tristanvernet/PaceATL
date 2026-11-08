import database from "../../database.js";
export async function createSafetyReport(userId, data) {
  const { title, category, description, latitude, longitude, routeId } = data;

  const result = await database.query(
    `INSERT INTO safety_reports 
      (user_id, title, category, description, latitude, longitude, route_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING id, title, category, status, created_at`,
    [userId, title, category, description, latitude, longitude, routeId || null]
  );

  return result.rows[0];
}

export async function fetchApprovedReports() {
  const result = await database.query(
    `SELECT id, title, category, description, latitude, longitude, created_at 
     FROM safety_reports 
     WHERE status = 'approved' 
     ORDER BY created_at DESC`
  );
  return result.rows;
}