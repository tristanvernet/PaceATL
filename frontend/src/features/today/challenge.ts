import { useSyncExternalStore } from "react";
import { apiRequest } from "../../api/client";
import { errorMessage } from "../workouts/types";
import type { Load } from "../../api/useResource";

export type ChallengeMetric = "miles" | "minutes" | "workouts";
export type Challenge = {
  challengeId: number;
  challengeDate: string;
  title: string;
  activityType: "run" | "walk" | "cycle" | "other" | "any";
  metric: ChallengeMetric;
  target: number;
};
export type TodayChallenge =
  | { challenge: null; message: string }
  | { challenge: Challenge; progress: number; completed: boolean };

// Shared between Today and the log sheet so a save refreshes the card
// underneath and the sheet can tell whether that save completed it.
let state: Load<TodayChallenge> = { status: "loading" };
let latest = 0;
const listeners = new Set<() => void>();
const set = (next: Load<TodayChallenge>) => {
  state = next;
  listeners.forEach((l) => l());
};

export async function refreshChallenge(): Promise<Load<TodayChallenge>> {
  const request = ++latest;
  let next: Load<TodayChallenge>;
  try {
    next = { status: "ready", data: await apiRequest<TodayChallenge>("/api/challenges/today") };
  } catch (e) {
    next = { status: "error", message: errorMessage(e, "Could not load today's challenge.") };
  }
  if (request === latest) set(next);
  return next;
}
export const resetChallenge = () => set({ status: "loading" });
export const challengeSnapshot = () => state;
export const isComplete = (load: Load<TodayChallenge>) =>
  load.status === "ready" && load.data.challenge !== null && load.data.completed;

export function useChallenge() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    challengeSnapshot,
    challengeSnapshot,
  );
}
