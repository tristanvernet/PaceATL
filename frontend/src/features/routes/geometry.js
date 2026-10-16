/** @typedef {{ latitude: number, longitude: number }} LatLng */

export const ROUTE_NAME_MAX = 80;
export const ROUTE_POINTS_MIN = 2;
export const ROUTE_POINTS_MAX = 500;
const EARTH_RADIUS_METERS = 6371008.8;
const radians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Great-circle length of a drawn path, rounded to whole meters.
 * @param {LatLng[]} points
 */
export function routeDistanceMeters(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2 +
      Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) *
      Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
    total += 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
  }
  return Math.round(total);
}

/** @param {number} meters */
export const metersToMiles = (meters) => meters / 1609.344;

const isCoordinate = (value, limit) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

/**
 * @param {{ name?: unknown, points?: unknown }} values
 * @returns {Record<string, string>}
 */
export function validateRoute(values) {
  const errors = {};
  const name = typeof values?.name === "string" ? values.name.trim() : "";
  if (!name || name.length > ROUTE_NAME_MAX)
    errors.name = `Name your route (up to ${ROUTE_NAME_MAX} characters).`;
  const points = values?.points;
  if (!Array.isArray(points) || points.length < ROUTE_POINTS_MIN || points.length > ROUTE_POINTS_MAX)
    errors.points = `Draw a route with ${ROUTE_POINTS_MIN} to ${ROUTE_POINTS_MAX} points.`;
  else if (!points.every((p) => isCoordinate(p?.latitude, 90) && isCoordinate(p?.longitude, 180)))
    errors.points = "Every route point needs a valid latitude and longitude.";
  return errors;
}
