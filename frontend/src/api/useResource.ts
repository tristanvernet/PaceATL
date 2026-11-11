import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import { apiRequest, errorMessage } from "./client";
import { useSession } from "../features/auth/SessionProvider";

export type Load<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

type Loader<T> = (signal: AbortSignal) => Promise<T>;
type Entry = {
  state: Load<unknown>;
  fetchedAt: number;
  /** Id of the newest request. A response from an older one is dropped. */
  run: number;
  pending: Promise<void> | null;
  controller: AbortController | null;
  /** The loader the latest subscriber passed, kept so `invalidate` can refetch. */
  load: Loader<unknown> | null;
  listeners: Set<() => void>;
};

const LOADING: Load<never> = { status: "loading" };
// Keyed by user and path, so signing out or switching accounts never shows
// another user's data.
const cache = new Map<string, Entry>();

function entryFor(scope: string) {
  let entry = cache.get(scope);
  if (!entry) {
    entry = { state: LOADING, fetchedAt: 0, run: 0, pending: null, controller: null, load: null, listeners: new Set() };
    cache.set(scope, entry);
  }
  return entry;
}
function publish(entry: Entry, state: Load<unknown>) {
  entry.state = state;
  entry.listeners.forEach((listener) => listener());
}
function cancelEntry(entry: Entry) {
  entry.run++;
  entry.controller?.abort();
  entry.controller = null;
  entry.pending = null;
}
function fetchEntry(entry: Entry, load: Loader<unknown>) {
  cancelEntry(entry);
  const run = entry.run;
  const controller = new AbortController();
  entry.controller = controller;
  if (entry.state.status === "error") publish(entry, LOADING);
  const pending = Promise.resolve()
    .then(() => {
      if (controller.signal.aborted) return undefined;
      return load(controller.signal);
    })
    .then(
      (data) => {
        if (run !== entry.run || controller.signal.aborted) return;
        entry.fetchedAt = Date.now();
        publish(entry, { status: "ready", data });
      },
      (e) => {
        // A failed background refresh keeps the data already on screen.
        if (run === entry.run && !controller.signal.aborted && entry.state.status !== "ready")
          publish(entry, { status: "error", message: errorMessage(e, "Something went wrong.") });
      },
    )
    .finally(() => {
      if (run === entry.run) {
        entry.pending = null;
        entry.controller = null;
      }
    });
  entry.pending = pending;
  return pending;
}

/**
 * Refetches every cached key that starts with one of `prefixes`, for use after
 * a mutation. Screens showing one keep their data until the new response
 * lands. Keys no screen shows are dropped and load fresh when next shown.
 * Resolves once the refetches settle.
 */
export async function invalidate(...prefixes: string[]) {
  const refetches: Promise<void>[] = [];
  for (const [scope, entry] of cache) {
    const key = scope.slice(scope.indexOf(":") + 1);
    if (!prefixes.some((prefix) => key.startsWith(prefix))) continue;
    if (!entry.listeners.size) {
      cancelEntry(entry);
      cache.delete(scope);
    } else if (entry.load) refetches.push(fetchEntry(entry, entry.load));
    else entry.fetchedAt = 0;
  }
  await Promise.all(refetches);
}

/**
 * Shares one cached load per key across every screen that asks for it. Loads
 * when first shown, and again on focus once the data is older than `staleMs`,
 * or right away when `invalidate` names it. Two screens asking at once share
 * one request. A null key skips loading (for example signed out).
 */
export function useResource<T>(
  key: string | null,
  load: Loader<T>,
  { staleMs = 30_000 }: { staleMs?: number } = {},
) {
  const { ready, user } = useSession();
  const scope = ready && key !== null ? `${user?.id ?? "anon"}:${key.replace(/\/+$/, "")}` : null;
  // Keep callbacks tied to their original scope when the key or user changes.
  const loader = useMemo(() => ({ current: load }), [scope]);
  loader.current = load;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (scope === null) return () => {};
      const entry = entryFor(scope);
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
        if (!entry.listeners.size) cancelEntry(entry);
      };
    },
    [scope],
  );
  const snapshot = () => (scope === null ? LOADING : entryFor(scope).state);
  const state = useSyncExternalStore(subscribe, snapshot, snapshot) as Load<T>;

  useEffect(() => {
    if (scope !== null) entryFor(scope).load = load;
  }, [scope, load]);

  const ensure = useCallback(() => {
    if (scope === null) return;
    const entry = entryFor(scope);
    entry.load = loader.current;
    const fresh = entry.state.status === "ready" && Date.now() - entry.fetchedAt < staleMs;
    if (!entry.pending && !fresh) void fetchEntry(entry, loader.current);
  }, [scope, loader, staleMs]);
  useEffect(ensure, [ensure]);
  useFocusEffect(ensure);

  const reload = useCallback(() => {
    if (scope !== null) void fetchEntry(entryFor(scope), loader.current);
  }, [scope, loader]);
  const set = useCallback(
    (data: T) => {
      if (scope === null) return;
      const entry = entryFor(scope);
      cancelEntry(entry);
      entry.fetchedAt = Date.now();
      publish(entry, { status: "ready", data });
    },
    [scope],
  );
  return { state, reload, set };
}

export function useApi<T>(path: string | null, options?: { staleMs?: number }) {
  return useResource<T>(path, (signal) => apiRequest<T>(path!, { signal }), options);
}
