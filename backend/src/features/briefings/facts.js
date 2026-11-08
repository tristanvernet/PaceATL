import { getWeather } from "../weather/service.js";
import { routeDistanceMeters, metersToMiles } from "../../../../frontend/src/features/routes/geometry.js";

const FEET_PER_METER = 3.28084;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const between = (a, b) => routeDistanceMeters([a, b]);

/** Evenly spaced positions along the drawn path, about every 100 m (2 to 50 points). */
export function sampleAlong(points) {
  const total = routeDistanceMeters(points);
  const count = Math.min(50, Math.max(2, Math.round(total / 100) + 1));
  const samples = [];
  let segment = 1, start = 0;
  for (let i = 0; i < count; i++) {
    const target = (total * i) / (count - 1);
    while (segment < points.length - 1 && start + between(points[segment - 1], points[segment]) < target)
      start += between(points[segment - 1], points[segment++]);
    const a = points[segment - 1], b = points[segment];
    const t = Math.min(1, (target - start) / (between(a, b) || 1));
    samples.push({ latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t });
  }
  return { samples, spacingMeters: total / (count - 1) };
}

/** Climb, descent and steepest grade over at least 200 m, from evenly spaced elevations in meters. */
export function summarizeTerrain(elevations, spacingMeters) {
  let climb = 0, descent = 0;
  for (let i = 1; i < elevations.length; i++) {
    const change = elevations[i] - elevations[i - 1];
    if (change > 0) climb += change; else descent -= change;
  }
  // A short window exaggerates the grade because elevation data is coarse.
  const window = Math.min(elevations.length - 1, Math.max(1, Math.ceil(200 / (spacingMeters || 1))));
  let steepest = 0;
  for (let i = 0; i + window < elevations.length; i++)
    steepest = Math.max(steepest, Math.abs(elevations[i + window] - elevations[i]) / (window * spacingMeters || 1));
  const feet = (meters) => Math.round(meters * FEET_PER_METER);
  return {
    climbFeet: feet(climb),
    descentFeet: feet(descent),
    lowestFeet: feet(Math.min(...elevations)),
    highestFeet: feet(Math.max(...elevations)),
    steepestGradePercent: Math.round(steepest * 1000) / 10,
  };
}

async function terrain(samples, spacingMeters) {
  const coordinates = (key) => samples.map((p) => p[key].toFixed(5)).join(",");
  const response = await fetch(
    `https://api.open-meteo.com/v1/elevation?latitude=${coordinates("latitude")}&longitude=${coordinates("longitude")}`,
    { signal: AbortSignal.timeout(10000) });
  const { elevation } = await response.json();
  if (!response.ok || !Array.isArray(elevation)) throw new Error("Elevation unavailable.");
  return summarizeTerrain(elevation, spacingMeters);
}

/** Named parks, water, viewpoints, art and historic places from OpenStreetMap within ~400 m of the route. */
async function highlights(samples) {
  const lats = samples.map((p) => p.latitude), lngs = samples.map((p) => p.longitude);
  const pad = 0.004;
  const box = [Math.min(...lats) - pad, Math.min(...lngs) - pad, Math.max(...lats) + pad, Math.max(...lngs) + pad]
    .map((n) => n.toFixed(5)).join(",");
  const filters = ['leisure~"^(park|nature_reserve|garden)$"', 'natural~"^(water|wood|peak)$"',
    'tourism~"^(viewpoint|artwork|attraction)$"', "historic"];
  const query = `[out:json][timeout:10];(${filters.map((f) => `nwr[${f}][name](${box});`).join("")});out center tags 80;`;
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "PaceATL student project" },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Map highlights unavailable.");
  const found = new Map();
  for (const { tags, lat, lon, center } of (await response.json()).elements ?? []) {
    const position = { latitude: lat ?? center?.lat, longitude: lon ?? center?.lon };
    if (found.has(tags.name) || position.latitude === undefined) continue;
    if (!samples.some((p) => between(p, position) <= 400)) continue;
    const kind = tags.leisure ?? tags.natural ?? tags.tourism ?? (tags.historic && "historic site");
    found.set(tags.name, { name: tags.name, kind: (tags.water ?? kind).replaceAll("_", " ") });
  }
  return [...found.values()].slice(0, 10);
}

/**
 * Everything the briefing may mention. A source that fails is null, so the briefing can say it is unavailable.
 * @param {{ latitude: number, longitude: number }[]} points
 */
export async function gatherFacts(points) {
  const { samples, spacingMeters } = sampleAlong(points);
  const [terrainResult, highlightsResult, weatherResult] = await Promise.allSettled([
    terrain(samples, spacingMeters),
    highlights(samples),
    getWeather(points[0].latitude, points[0].longitude),
  ]);
  const value = (result) => (result.status === "fulfilled" ? result.value : null);
  const start = points[0], end = points.at(-1);
  return {
    distanceMiles: Math.round(metersToMiles(routeDistanceMeters(points)) * 100) / 100,
    loop: between(start, end) < 150,
    terrain: value(terrainResult),
    highlights: value(highlightsResult),
    weather: value(weatherResult),
    // Approved community safety reports near the route belong here once Iyana's reports table exists.
    hazards: [],
  };
}
