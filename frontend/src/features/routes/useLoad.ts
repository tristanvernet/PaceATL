import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import type { Load } from "./types";

/**
 * GETs `path` whenever it or `attempt` changes. A null path skips the request.
 * A reload keeps showing the previous value instead of flashing back to loading.
 */
export function useLoad<T>(path: string | null, attempt = 0): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    setState((current) => (current.status === "ready" ? current : { status: "loading" }));
    apiRequest<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setState({ status: "ready", value });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Could not load this.",
          });
      });
    return () => controller.abort();
  }, [path, attempt]);
  return state;
}
