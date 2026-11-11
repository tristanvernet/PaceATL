import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest, errorMessage } from "../../api/client";
import { RouteMap } from "../../components/RouteMap";
import { EMPTY_SCENE, boundsOf, type MapScene } from "../../components/routeMapBridge";
import { Button, Notice, column, useLeave } from "../../components/ui";
import { fonts, useTheme } from "../../theme";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useSession } from "../auth/SessionProvider";
import { RoundButton, Stats, passThrough } from "./controls";
import { metersToMiles } from "./geometry";
import { RouteBriefing } from "./RouteBriefing";
import { invalidate, useApi } from "../../api/useResource";
import {
  averagePace,
  hazardsNear,
  miles,
  savedOn,
  type Hazard,
  type SavedRoute,
  type Workout,
} from "./types";

type Share = { status: "idle" | "sending" | "shared" } | { status: "error"; message: string };
type Menu =
  { status: "closed" | "open" | "confirm" | "deleting" } | { status: "error"; message: string };
const HERO_HEIGHT = 250;
const NO_HAZARDS: Hazard[] = [];

export default function RouteDetailScreen({ routeId }: { routeId: number }) {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, ready } = useSession();
  const routes = useApi<SavedRoute[]>(user ? "/api/routes" : null).state;
  const workouts = useApi<Workout[]>(user ? "/api/workouts" : null).state;
  const reports = useApi<Hazard[]>("/api/reports/approved").state;
  const [share, setShare] = useState<Share>({ status: "idle" });
  const [menu, setMenu] = useState<Menu>({ status: "closed" });

  const leave = useLeave("/routes");
  const route =
    routes.status === "ready" ? routes.data.find((r) => r.routeId === routeId) : undefined;
  const hazards = useMemo(
    () => (route && reports.status === "ready" ? hazardsNear(route, reports.data) : NO_HAZARDS),
    [route, reports],
  );
  const scene = useMemo<MapScene | null>(
    () =>
      route
        ? {
            ...EMPTY_SCENE,
            routes: [{ id: route.routeId, points: route.points }],
            hazards,
            layers: { routes: true, hotspots: false, hazards: true },
            selection: { kind: "route", id: route.routeId },
            fit: {
              key: String(route.routeId),
              bounds: boundsOf(route.points),
              inset: { top: insets.top + 30, bottom: 0 },
            },
          }
        : null,
    [route, hazards, insets.top],
  );

  async function shareRoute(route: SavedRoute) {
    setShare({ status: "sending" });
    try {
      await apiRequest("/api/fitness/shares", {
        method: "POST",
        body: JSON.stringify({ kind: "route", sourceId: route.routeId, title: route.name }),
      });
      setShare({ status: "shared" });
      void invalidate("/api/fitness/shares");
    } catch (e) {
      setShare({ status: "error", message: errorMessage(e, "Could not share the route.") });
    }
  }
  async function deleteRoute() {
    setMenu({ status: "deleting" });
    try {
      await apiRequest(`/api/routes/${routeId}`, { method: "DELETE" });
      leave();
      void invalidate("/api/routes", "/api/fitness");
    } catch (e) {
      setMenu({ status: "error", message: errorMessage(e, "Could not delete the route.") });
    }
  }

  const pace = workouts.status === "ready" ? averagePace(workouts.data) : null;
  const routeMiles = route ? metersToMiles(route.distanceMeters) : 0;

  let content: ReactNode;
  if (!ready) content = <Notice text="Checking your account…" />;
  else if (!user) content = <SignInPrompt title="Sign in to see your saved routes" />;
  else if (routes.status === "loading") content = <Notice text="Loading the route…" />;
  else if (routes.status === "error") content = <Notice text={routes.message} error />;
  else if (!route) content = <Notice text="This route was not found. It may have been deleted." error />;
  else
    content = (
      <>
        <Text
          accessibilityRole="header"
          style={{ color: c.text, fontFamily: fonts.heading, fontSize: 26, lineHeight: 32 }}
        >
          {route.name}
        </Text>
        <Stats
          items={[
            { value: miles(route.distanceMeters), label: "Distance" },
            ...(pace ? [{ value: `~${Math.round(pace * routeMiles)} min`, label: "At your pace" }] : []),
            { value: savedOn(route), label: "Saved" },
          ]}
        />
        <RouteBriefing routeId={route.routeId} hazards={hazards} />
        {share.status === "shared" ? (
          <Notice text="Shared with the community. It shows in Shares." />
        ) : share.status === "error" ? (
          <Notice text={share.message} error />
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              title={share.status === "shared" ? "Shared" : "Share"}
              loading={share.status === "sending"}
              disabled={share.status === "shared"}
              onPress={() => shareRoute(route)}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              title="Log this route"
              onPress={() => router.push({ pathname: "/log", params: { distance: routeMiles.toFixed(2) } })}
            />
          </View>
        </View>
      </>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View style={{ height: HERO_HEIGHT, backgroundColor: c.soft }}>
          {route && scene ? <RouteMap label={`Map of ${route.name}`} style={{ flex: 1 }} scene={scene} /> : null}
        </View>
        <View style={[column, { paddingHorizontal: 22, paddingTop: 16 }]}>
          {content}
        </View>
      </ScrollView>
      <View
        style={[
          passThrough,
          {
            position: "absolute",
            top: insets.top + 12,
            left: 14,
            right: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          },
        ]}
      >
        <RoundButton icon="chevron-back" label="Back" onPress={leave} />
        {route ? (
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <RoundButton
              icon="ellipsis-horizontal"
              label="More actions"
              onPress={() =>
                setMenu((m) => ({ status: m.status === "closed" ? "open" : "closed" }))
              }
            />
            {menu.status !== "closed" ? (
              <View
                style={{
                  width: 230,
                  padding: 6,
                  borderRadius: 14,
                  backgroundColor: c.panel,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                {menu.status === "open" ? (
                  <>
                    <MenuItem
                      label="Report a hazard here"
                      onPress={() => {
                        setMenu({ status: "closed" });
                        router.push({
                          pathname: "/report",
                          params: {
                            latitude: route.points[0].latitude.toFixed(5),
                            longitude: route.points[0].longitude.toFixed(5),
                            routeId: String(route.routeId),
                          },
                        });
                      }}
                    />
                    <MenuItem
                      label="Delete route"
                      danger
                      onPress={() => setMenu({ status: "confirm" })}
                    />
                  </>
                ) : (
                  <View style={{ padding: 8, gap: 8 }}>
                    <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
                      Delete {route.name}? This cannot be undone.
                    </Text>
                    {menu.status === "error" ? (
                      <Text style={{ color: c.error, fontSize: 12 }}>{menu.message}</Text>
                    ) : null}
                    <Button
                      title="Delete"
                      loading={menu.status === "deleting"}
                      onPress={deleteRoute}
                    />
                    <Button
                      title="Keep route"
                      secondary
                      disabled={menu.status === "deleting"}
                      onPress={() => setMenu({ status: "closed" })}
                    />
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function MenuItem({
  label,
  danger = false,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: pressed ? c.soft : "transparent",
      })}
    >
      <Text style={{ color: danger ? c.error : c.text, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}
