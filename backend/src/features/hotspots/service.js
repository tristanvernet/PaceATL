import { readFile } from "node:fs/promises";

const allowed = new Set(["run", "walk", "cycle"]);
export function normalizeHotspots(records) {
  if (!Array.isArray(records)) throw new Error("Hotspot source must be an array.");
  return records.filter(item => item && typeof item.id === "string" && typeof item.name === "string" &&
    item.name.length <= 120 && Number.isFinite(item.latitude) && Number.isFinite(item.longitude) &&
    item.latitude >= 33.5 && item.latitude <= 34.1 && item.longitude >= -84.8 && item.longitude <= -84.1 &&
    Array.isArray(item.activities) && item.activities.length > 0 && item.activities.every(type => allowed.has(type)))
    .map(item => ({ id: item.id, name: item.name, latitude: item.latitude, longitude: item.longitude,
      activities: item.activities, description: typeof item.description === "string" ? item.description.slice(0, 400) : "" }));
}
export async function listHotspots(activity = "all") {
  if (activity !== "all" && !allowed.has(activity)) {
    const error = new Error("Choose all, run, walk, or cycle."); error.status = 400; throw error;
  }
  const source = process.env.HOTSPOT_DATA_PATH;
  if (!source) return { hotspots: [], sourceConfigured: false, message: "Hotspot popularity data is not configured." };
  // Deployment operator supplies curated popularity records; no invented popularity scores.
  const records = normalizeHotspots(JSON.parse(await readFile(source, "utf8")));
  const hotspots = activity === "all" ? records : records.filter(item => item.activities.includes(activity));
  return { hotspots, sourceConfigured: true, message: hotspots.length ? null : "No hotspots match this filter." };
}
