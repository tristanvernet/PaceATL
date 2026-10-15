import type { LatLng } from "./geometry";

export type SavedRoute = {
  routeId: number;
  name: string;
  points: LatLng[];
  distanceMeters: number;
  createdAt: string;
};
export type SavedRoutes =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; routes: SavedRoute[] };

// MySQL returns "YYYY-MM-DD HH:MM:SS" in UTC, which Hermes will not parse as-is.
export const savedOn = (route: SavedRoute) =>
  new Date(`${route.createdAt.replace(" ", "T")}Z`).toLocaleDateString();
