import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiRequest, errorMessage } from "./client";
import { useSession } from "../features/auth/SessionProvider";

export type Load<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

type Loader<T> = (signal: AbortSignal) => Promise<T>;

// Loads once the session is known, again when the user or key changes, and
// quietly again whenever the screen regains focus so counts stay current after
// edits made on other screens. A null key skips loading (for example signed out).
export function useResource<T>(key: string | null, load: Loader<T>) {
  const { ready, user } = useSession();
  const scope = ready && key !== null ? `${user?.id ?? "anon"}:${key}` : null;
  const [entry, setEntry] = useState<{ scope: string | null; state: Load<T> }>({
    scope,
    state: { status: "loading" },
  });
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const state: Load<T> = entry.scope === scope ? entry.state : { status: "loading" };

  useEffect(() => {
    if (scope === null) return;
    const controller = new AbortController();
    loadRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setEntry({ scope, state: { status: "ready", data } });
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setEntry((current) =>
          // A failed background refresh keeps the data already on screen.
          current.scope === scope && current.state.status === "ready"
            ? current
            : { scope, state: { status: "error", message: errorMessage(e, "Something went wrong.") } },
        );
      });
    return () => controller.abort();
  }, [scope, nonce]);

  const reload = useCallback(() => {
    setEntry((current) =>
      current.state.status === "error" ? { ...current, state: { status: "loading" } } : current,
    );
    setNonce((n) => n + 1);
  }, []);
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) reload();
      focused.current = true;
    }, [reload]),
  );
  const set = useCallback(
    (data: T) => setEntry({ scope, state: { status: "ready", data } }),
    [scope],
  );
  return { state, reload, set };
}

export function useApi<T>(path: string | null) {
  return useResource<T>(path, (signal) => apiRequest<T>(path!, { signal }));
}
