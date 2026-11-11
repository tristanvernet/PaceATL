import { metersToMiles, routeDistanceMeters, type LatLng } from "./geometry";

export type SavedRoute = {
  routeId: number;
  name: string;
  points: LatLng[];
  distanceMeters: number;
  createdAt: string;
};
export type Hotspot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activities: string[];
  description: string;
};
export type HotspotResult = {
  hotspots: Hotspot[];
  sourceConfigured: boolean;
  message: string | null;
};
export type Hazard = {
  id: number;
  title: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  routeId: number | null;
  createdAt: string;
};
export type Workout = { distanceMiles: number; durationMinutes: number };

export const ATLANTA: LatLng = { latitude: 33.765, longitude: -84.37 };

export const miles = (meters: number) => `${metersToMiles(meters).toFixed(1)} mi`;

// MySQL returns "YYYY-MM-DD HH:MM:SS" in UTC, which Hermes will not parse as-is.
export const savedOn = (route: SavedRoute) =>
  new Date(`${route.createdAt.replace(" ", "T")}Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const HAZARD_RADIUS_METERS = 400;
export const hazardsNear = (route: SavedRoute, hazards: Hazard[]) =>
  hazards.filter(
    (hazard) =>
      hazard.routeId === route.routeId ||
      route.points.some((point) => routeDistanceMeters([point, hazard]) <= HAZARD_RADIUS_METERS),
  );

/** Minutes per mile across every logged workout with a distance, or null with none. */
export function averagePace(workouts: Workout[]) {
  const counted = workouts.filter((w) => w.distanceMiles > 0 && w.durationMinutes > 0);
  const distance = counted.reduce((sum, w) => sum + w.distanceMiles, 0);
  const minutes = counted.reduce((sum, w) => sum + w.durationMinutes, 0);
  return distance > 0 ? minutes / distance : null;
}
