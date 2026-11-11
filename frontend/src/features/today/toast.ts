import { useSyncExternalStore } from "react";
import { ACTIVITIES, type ActivityType, type UnlockedBadge } from "../workouts/types";

export type Toast = { id: number; title: string; detail?: string };

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const set = (next: Toast | null) => {
  current = next;
  listeners.forEach((l) => l());
};

export const showToast = (toast: Omit<Toast, "id">) => set({ ...toast, id: nextId++ });
export const dismissToast = (id: number) => {
  if (current?.id === id) set(null);
};
export function useToast() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current,
  );
}

const quoted = (badges: UnlockedBadge[]) => {
  const names = badges.map((b) => `“${b.name}”`);
  return names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export function savedToast(
  activity: ActivityType,
  challengeCompleted: boolean,
  unlocked: UnlockedBadge[],
): Omit<Toast, "id"> {
  const noun = ACTIVITIES[activity].noun;
  if (challengeCompleted)
    return {
      title: "Challenge complete.",
      detail: unlocked.length ? `You also earned ${quoted(unlocked)}.` : undefined,
    };
  return {
    title: `${noun[0].toUpperCase()}${noun.slice(1)} saved.`,
    detail: unlocked.length ? `You earned ${quoted(unlocked)}.` : undefined,
  };
}
