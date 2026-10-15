import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { apiRequest } from "../../api/client";
import {
  Screen,
  Heading,
  Card,
  Label,
  Button,
  Notice,
} from "../../components/ui";
import {
  MapPlaceholder,
  type RouteMode,
} from "../../components/MapPlaceholder";
import { RouteMap } from "../../components/RouteMap";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import {
  metersToMiles,
  routeDistanceMeters,
  type LatLng,
} from "./geometry";
import { savedOn, type SavedRoute, type SavedRoutes } from "./types";

const miles = (meters: number) => `${metersToMiles(meters).toFixed(2)} mi`;
const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function RoutesScreen() {
  const [mode, setMode] = useState<RouteMode>("Explore");
  const [detail, setDetail] = useState(false);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [saved, setSaved] = useState<SavedRoutes>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [attempt, setAttempt] = useState(0);
  // The list is loaded once per signed-in user, then kept current by save and delete.
  const loadedFor = useRef<number | null>(null);
  const { user, ready } = useSession();
  const router = useRouter();
  const c = useTheme();
  const listUser = mode === "Saved" && ready ? user?.id : undefined;
  useEffect(() => {
    if (listUser === undefined || loadedFor.current === listUser) return;
    const controller = new AbortController();
    setSaved({ status: "loading" });
    apiRequest<SavedRoute[]>("/api/routes", { signal: controller.signal })
      .then((routes) => {
        if (controller.signal.aborted) return;
        loadedFor.current = listUser;
        setSaved({ status: "ready", routes });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setSaved({ status: "error", message: message(e, "Could not load your routes.") });
      });
    return () => controller.abort();
  }, [listUser, attempt]);
  async function deleteRoute(routeId: number) {
    setDeleting(true);
    setSavedError("");
    try {
      await apiRequest(`/api/routes/${routeId}`, { method: "DELETE" });
      setSaved((list) =>
        list.status === "ready"
          ? { status: "ready", routes: list.routes.filter((r) => r.routeId !== routeId) }
          : list,
      );
      setConfirmingId(null);
    } catch (e) {
      setSavedError(message(e, "Could not delete the route."));
    } finally {
      setDeleting(false);
    }
  }
  const selected =
    saved.status === "ready"
      ? (saved.routes.find((r) => r.routeId === selectedId) ?? saved.routes[0])
      : undefined;
  const descriptions = {
    Explore:
      "A selected route’s distance, activity, weather, approved reports and save/share actions will appear here.",
    Hotspots:
      "A selected area’s name, description and popularity source will appear here.",
  };
  return (
    <Screen>
      <Heading eyebrow="Explore your pace" title="Find your next route." />
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          backgroundColor: c.soft,
          padding: 4,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        {(["Explore", "Hotspots", "Build", "Saved"] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: item === mode }}
            onPress={() => {
              setMode(item);
              setDetail(false);
              setConfirmingId(null);
              setSavedError("");
            }}
            style={{
              flex: 1,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: item === mode ? c.panel : "transparent",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: c.text, fontSize: 12 }}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {mode === "Build" ? (
        <>
          <RouteMap
            points={points}
            onAddPoint={(point) => setPoints((current) => [...current, point])}
          />
          <View style={{ marginTop: 16 }}>
            <Card>
              <Label>
                {metersToMiles(routeDistanceMeters(points)).toFixed(2)} mi
              </Label>
              <Label secondary>Tap the map to add points</Label>
              <Button
                title="Undo last point"
                secondary
                disabled={points.length === 0}
                onPress={() => setPoints((current) => current.slice(0, -1))}
              />
              <Button
                title="Clear"
                secondary
                disabled={points.length === 0}
                onPress={() => setPoints([])}
              />
            </Card>
          </View>
        </>
      ) : mode === "Saved" ? (
        !ready ? (
          <Notice text="Checking your account…" />
        ) : !user ? (
          <Card>
            <Label>Sign in to see your saved routes</Label>
            <Label secondary>Routes you save are kept in your PaceATL account.</Label>
            <Button title="Log in" onPress={() => router.push("/login")} />
          </Card>
        ) : saved.status === "loading" ? (
          <Notice text="Loading your routes…" />
        ) : saved.status === "error" ? (
          <>
            <Notice text={saved.message} error />
            <Button title="Try again" onPress={() => setAttempt((n) => n + 1)} />
          </>
        ) : !selected ? (
          <Card>
            <Label>No saved routes yet</Label>
            <Label secondary>Draw a route in Build and save it to see it here.</Label>
            <Button title="Build a route" onPress={() => setMode("Build")} />
          </Card>
        ) : (
          <>
            {/* Remounting per route refits the map to the newly selected path. */}
            <RouteMap key={selected.routeId} points={selected.points} />
            {savedError ? <Notice text={savedError} error /> : null}
            <View style={{ marginTop: 16, gap: 12 }}>
              {saved.routes.map((route) => (
                <View
                  key={route.routeId}
                  style={{
                    padding: 16,
                    gap: 8,
                    borderRadius: 18,
                    backgroundColor: c.panel,
                    borderWidth: route === selected ? 2 : 1,
                    borderColor: route === selected ? c.primary : c.border,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: route === selected }}
                    onPress={() => setSelectedId(route.routeId)}
                  >
                    <Label>{route.name}</Label>
                    <Label secondary>
                      {miles(route.distanceMeters)} • Saved {savedOn(route)}
                    </Label>
                  </Pressable>
                  {confirmingId === route.routeId ? (
                    <>
                      <Label secondary>Delete this route? This cannot be undone.</Label>
                      <Button
                        title="Delete route"
                        loading={deleting}
                        onPress={() => deleteRoute(route.routeId)}
                      />
                      <Button
                        title="Keep route"
                        secondary
                        disabled={deleting}
                        onPress={() => setConfirmingId(null)}
                      />
                    </>
                  ) : (
                    <Button
                      title="Delete"
                      secondary
                      disabled={deleting}
                      onPress={() => {
                        setConfirmingId(route.routeId);
                        setSavedError("");
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </>
        )
      ) : (
        <>
          <MapPlaceholder mode={mode} />
          <View style={{ marginTop: 16 }}>
            <Card>
              <Label>
                {mode === "Hotspots" ? "Selected hotspot" : "Route information"}
              </Label>
              <Label secondary>{descriptions[mode]}</Label>
              <Button
                title={detail ? "Hide detail preview" : "Show detail preview"}
                secondary
                onPress={() => setDetail(!detail)}
              />
              {detail && (
                <Label secondary>
                  This panel will show the selected record. No route or
                  geographic data is loaded.
                </Label>
              )}
            </Card>
          </View>
        </>
      )}
      <Notice text="Build uses OpenStreetMap to draw routes. Explore, Hotspots and Saved are still layout previews, and no location permissions are requested." />
    </Screen>
  );
}
