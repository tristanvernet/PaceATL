import type { Ionicons } from "@expo/vector-icons";

export type ActivityType = "run" | "walk" | "cycle" | "other";
export type Workout = {
  workoutId: number;
  activityType: ActivityType;
  distanceMiles: number;
  durationMinutes: number;
  workoutDate: string;
  notes: string | null;
};
export type UnlockedBadge = { key: string; name: string };
export type LoggedWorkout = { workout: Workout; unlocked: UnlockedBadge[] };

export const ACTIVITIES: Record<
  ActivityType,
  { label: string; noun: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  run: { label: "Run", noun: "run", icon: "footsteps-outline" },
  walk: { label: "Walk", noun: "walk", icon: "walk-outline" },
  cycle: { label: "Cycle", noun: "ride", icon: "bicycle-outline" },
  other: { label: "Other", noun: "activity", icon: "fitness-outline" },
};
export const ACTIVITY_TYPES = Object.keys(ACTIVITIES) as ActivityType[];
export const isActivityType = (value: unknown): value is ActivityType =>
  ACTIVITY_TYPES.includes(value as ActivityType);

/** Minutes per mile as m:ss, or null when distance or time can't give a pace. */
export function formatPace(distanceMiles: number, durationMinutes: number) {
  if (!(distanceMiles > 0) || !(durationMinutes > 0)) return null;
  const seconds = Math.round((durationMinutes * 60) / distanceMiles);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
