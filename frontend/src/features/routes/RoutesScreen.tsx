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
import { useTheme } from "../../theme";
export default function RoutesScreen() {
  const [mode, setMode] = useState<RouteMode>("Explore");
  const [detail, setDetail] = useState(false);
  const c = useTheme();
  const descriptions = {
    Explore:
      "A selected route’s distance, activity, weather, approved reports and save/share actions will appear here.",
    Hotspots:
      "A selected area’s name, description and popularity source will appear here.",
    Build:
      "Starting point, activity type and preferred distance will be entered here.",
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
      <MapPlaceholder mode={mode} />
      <View style={{ marginTop: 16 }}>
        <Card>
          <Label>
            {mode === "Build"
              ? "Route setup"
              : mode === "Hotspots"
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
              {mode === "Build"
                ? "Future inputs: start location, walking/running/cycling, preferred distance. No route requests are made."
                : "This panel will show the selected record. No route or geographic data is loaded."}
            </Label>
          )}
        </Card>
      </View>
      <Notice text="Layout only. No maps, routes, location permissions or external map services are connected." />
    </Screen>
  );
}
