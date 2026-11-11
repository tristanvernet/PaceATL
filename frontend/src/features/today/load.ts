import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../../api/client";
import { errorMessage } from "../workouts/types";

export type Load<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

/**
 * GETs `path` each time the screen gains focus, so data changed on a screen
 * pushed above (the log sheet, history) is fresh on return. A null path
 * (signed out) resets to loading and fetches nothing.
 */
export function useApi<T>(path: string | null, fallback: string): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  const [loaded, setLoaded] = useState<string | null>(null);
  if (loaded !== path) {
    setLoaded(path);
    setState({ status: "loading" });
  }
  useFocusEffect(
    useCallback(() => {
      if (!path) return;
      const controller = new AbortController();
      apiRequest<T>(path, { signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted) setState({ status: "ready", data });
        })
        .catch((e) => {
          if (!controller.signal.aborted)
            setState({ status: "error", message: errorMessage(e, fallback) });
        });
      return () => controller.abort();
    }, [path, fallback]),
  );
  return state;
}
