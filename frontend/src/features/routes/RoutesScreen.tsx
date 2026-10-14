import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
import {
  metersToMiles,
  routeDistanceMeters,
  type LatLng,
} from "./geometry";
export default function RoutesScreen() {
  const [mode, setMode] = useState<RouteMode>("Explore");
  const [detail, setDetail] = useState(false);
  const [points, setPoints] = useState<LatLng[]>([]);
  const c = useTheme();
  const descriptions = {
    Explore:
      "A selected route’s distance, activity, weather, approved reports and save/share actions will appear here.",
    Hotspots:
      "A selected area’s name, description and popularity source will appear here.",
    Saved: "Saved routes and their download status will appear here.",
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
      ) : (
        <>
          <MapPlaceholder mode={mode} />
          <View style={{ marginTop: 16 }}>
            <Card>
              <Label>
                {mode === "Hotspots"
                  ? "Selected hotspot"
                  : mode === "Saved"
                    ? "Your saved routes"
                    : "Route information"}
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
