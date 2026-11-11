import { useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteMap } from "../../components/RouteMap";
import { boundsOf, type Layer, type MapMessage, type MapScene, type Selection } from "../../components/routeMapBridge";
import { Button, Notice } from "../../components/ui";
import { fonts, useTheme } from "../../theme";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useSession } from "../auth/SessionProvider";
import { categoryLabel } from "../reports/categories";
import { FloatingButton, LayerChip, RoundButton, Sheet, passThrough } from "./controls";
import { RouteShape } from "./RouteShape";
import { useApi, type Load } from "../../api/useResource";
import {
  ATLANTA,
  miles,
  savedOn,
  type Hazard,
  type Hotspot,
  type HotspotResult,
  type SavedRoute,
} from "./types";
import type { LatLng } from "./geometry";

const LAYERS: {
  layer: Layer;
  label: string;
  icon: "trail-sign-outline" | "flame-outline" | "warning-outline";
}[] = [
  { layer: "routes", label: "My routes", icon: "trail-sign-outline" },
  { layer: "hotspots", label: "Hotspots", icon: "flame-outline" },
  { layer: "hazards", label: "Hazards", icon: "warning-outline" },
];
const LAYER_OF: Record<Selection["kind"], Layer> = {
  route: "routes",
  hotspot: "hotspots",
  hazard: "hazards",
};
const ACTIVITY_LABELS: Record<string, string> = {
  run: "running",
  walk: "walking",
  cycle: "cycling",
};

type Chosen =
  | { kind: "route"; route: SavedRoute }
  | { kind: "hotspot"; hotspot: Hotspot }
  | { kind: "hazard"; hazard: Hazard };
function resolve(
  selection: Selection | null,
  routes: SavedRoute[],
  hotspots: Hotspot[],
  hazards: Hazard[],
): Chosen | null {
  if (!selection) return null;
  if (selection.kind === "route") {
    const route = routes.find((r) => r.routeId === selection.id);
    return route ? { kind: "route", route } : null;
  }
  if (selection.kind === "hotspot") {
    const hotspot = hotspots.find((h) => h.id === selection.id);
    return hotspot ? { kind: "hotspot", hotspot } : null;
  }
  const hazard = hazards.find((h) => h.id === selection.id);
  return hazard ? { kind: "hazard", hazard } : null;
}
// Stable empties keep the memoized map scene from changing on every render while loading.
const NO_ROUTES: SavedRoute[] = [];
const NO_HOTSPOTS: Hotspot[] = [];
const NO_HAZARDS: Hazard[] = [];
const valueOf = <T,>(load: Load<T>, empty: T) => (load.status === "ready" ? load.data : empty);
const settled = (load: Load<unknown>) => load.status !== "loading";

export default function RoutesScreen() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, ready } = useSession();
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    routes: true,
    hotspots: true,
    hazards: true,
  });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [bottomHeight, setBottomHeight] = useState(0);
  const center = useRef<LatLng>(ATLANTA);

  const savedRoutes = useApi<SavedRoute[]>(user ? "/api/routes" : null);
  const routesLoad = savedRoutes.state;
  const hotspotsLoad = useApi<HotspotResult>("/api/hotspots", { staleMs: 10 * 60_000 }).state;
  const hazardsLoad = useApi<Hazard[]>("/api/reports/approved").state;
  const routes = user ? valueOf(routesLoad, NO_ROUTES) : NO_ROUTES;
  const hotspots = valueOf(hotspotsLoad, null)?.hotspots ?? NO_HOTSPOTS;
  const hazards = valueOf(hazardsLoad, NO_HAZARDS);

  const allSettled =
    ready && (!user || settled(routesLoad)) && settled(hotspotsLoad) && settled(hazardsLoad);
  const fitKey = allSettled && bottomHeight ? "initial" : "";
  const scene = useMemo<MapScene>(
    () => ({
      routes: routes.map((route) => ({ id: route.routeId, points: route.points })),
      hotspots,
      hazards,
      draft: [],
      layers,
      selection,
      fit: {
        key: fitKey,
        bounds: boundsOf(routes.length ? routes.flatMap((route) => route.points) : [...hotspots, ...hazards]),
        inset: { top: insets.top + 52, bottom: bottomHeight },
      },
    }),
    [routes, hotspots, hazards, layers, selection, fitKey, insets.top, bottomHeight],
  );
  const onMessage = (message: MapMessage) => {
    if (message.type === "moved") center.current = message.center;
    else if (message.type === "tap") setSelection(null);
    else setSelection(message.target);
  };

  const chosen = resolve(selection, routes, hotspots, hazards);
  const layerErrors = [hotspotsLoad, hazardsLoad].flatMap((load) =>
    load.status === "error" ? [load.message] : [],
  );
  const hotspotNote = valueOf(hotspotsLoad, null)?.message;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <RouteMap
        label="Routes map"
        scene={scene}
        onMessage={onMessage}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={[
          passThrough,
          {
            position: "absolute",
            top: insets.top + 10,
            left: 14,
            right: 14,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          },
        ]}
      >
        {LAYERS.map(({ layer, label, icon }) => (
          <LayerChip
            key={layer}
            label={label}
            icon={icon}
            on={layers[layer]}
            onPress={() => {
              setLayers((current) => ({ ...current, [layer]: !current[layer] }));
              if (selection && LAYER_OF[selection.kind] === layer) setSelection(null);
            }}
          />
        ))}
      </View>
      <View
        onLayout={(event) => setBottomHeight(Math.round(event.nativeEvent.layout.height))}

        style={[passThrough, { position: "absolute", left: 0, right: 0, bottom: 0 }]}
      >
        <View
          style={[
            passThrough,
            {
              alignItems: "flex-end",
              gap: 8,
              paddingHorizontal: 14,
              marginBottom: 12,
            },
          ]}
        >
          <FloatingButton
            label="Report"
            icon="flag-outline"
            onPress={() =>
              router.push({
                pathname: "/report",
                params: {
                  latitude: center.current.latitude.toFixed(5),
                  longitude: center.current.longitude.toFixed(5),
                },
              })
            }
          />
          <FloatingButton
            primary
            label="Build a route"
            icon="pencil-outline"
            onPress={() => router.push("/routes/new")}
          />
        </View>
        {chosen ? (
          <SelectionCard onClose={() => setSelection(null)}>
            {chosen.kind === "route" ? (
              <>
                <Title>{chosen.route.name}</Title>
                <Meta>
                  {miles(chosen.route.distanceMeters)} · saved {savedOn(chosen.route)}
                </Meta>
                <Button
                  title="Open route"
                  onPress={() => router.push(`/routes/${chosen.route.routeId}`)}
                />
              </>
            ) : chosen.kind === "hotspot" ? (
              <>
                <Title>{chosen.hotspot.name}</Title>
                {chosen.hotspot.description ? <Body>{chosen.hotspot.description}</Body> : null}
                <Meta>
                  Popular for{" "}
                  {chosen.hotspot.activities.map((a) => ACTIVITY_LABELS[a] ?? a).join(", ")}
                </Meta>
              </>
            ) : (
              <>
                <Title>{chosen.hazard.title}</Title>
                {chosen.hazard.description ? <Body>{chosen.hazard.description}</Body> : null}
                <Meta>Reported hazard · {categoryLabel(chosen.hazard.category)}</Meta>
              </>
            )}
          </SelectionCard>
        ) : null}
        <Sheet>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{ color: c.text, fontFamily: fonts.heading, fontSize: 19 }}
            >
              Saved routes
            </Text>
            {routes.length ? (
              <Text style={{ color: c.muted, fontSize: 12 }}>
                {routes.length} {routes.length === 1 ? "route" : "routes"}
              </Text>
            ) : null}
          </View>
          {!ready ? (
            <Meta>Checking your account…</Meta>
          ) : !user ? (
            <SignInPrompt compact text="Sign in to save routes, get a briefing before you go, and log them." />
          ) : routesLoad.status === "loading" ? (
            <Meta>Loading your routes…</Meta>
          ) : routesLoad.status === "error" ? (
            <>
              <Notice text={routesLoad.message} error />
              <Button title="Try again" secondary onPress={savedRoutes.reload} />
            </>
          ) : routes.length === 0 ? (
            <View style={{ paddingVertical: 6, gap: 4 }}>
              <Body>No saved routes yet.</Body>
              <Meta>Tap Build a route and draw one on the map.</Meta>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 190 }}>
              {routes.map((route, i) => (
                <Pressable
                  key={route.routeId}
                  accessibilityRole="button"
                  accessibilityLabel={`${route.name}, ${miles(route.distanceMeters)}`}
                  onPress={() => router.push(`/routes/${route.routeId}`)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 11,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: c.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <RouteShape points={route.points} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                      {route.name}
                    </Text>
                    <Meta>
                      {miles(route.distanceMeters)} · saved {savedOn(route)}
                    </Meta>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.muted} />
                </Pressable>
              ))}
            </ScrollView>
          )}
          {layerErrors.length || hotspotNote ? (
            <Meta>{[...layerErrors, hotspotNote].filter(Boolean).join(" ")}</Meta>
          ) : null}
        </Sheet>
      </View>
    </View>
  );
}

function SelectionCard({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const c = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 14,
        marginBottom: 12,
        padding: 14,
        gap: 6,
        borderRadius: 18,
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <View style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
        <RoundButton icon="close" label="Close" onPress={onClose} />
      </View>
      {children}
    </View>
  );
}

function Title({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.text, fontSize: 16, fontWeight: "700", marginRight: 44 }}>
      {children}
    </Text>
  );
}
function Body({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>{children}</Text>;
}
function Meta({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{children}</Text>;
}
