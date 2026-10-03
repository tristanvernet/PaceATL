import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
export type RouteMode = "Explore" | "Hotspots" | "Build" | "Saved";
export function MapPlaceholder({ mode }: { mode: RouteMode }) {
  const c = useTheme();
  const descriptions = {
    Explore: "Streets, trails and route previews from the chosen map service.",
    Hotspots:
      "Popular running and walking areas, once a data source is selected.",
    Build: "Starting point and calculated path from a routing service.",
    Saved: "A selected saved path, with download status when available.",
  };
  return (
    <View
      accessible
      accessibilityLabel={`${mode} map placeholder. No live map connected.`}
      style={{
        minHeight: 270,
        backgroundColor: c.soft,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: c.muted,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
      }}
    >
      <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 1 }}>
        FUTURE MAP AREA
      </Text>
      <Ionicons name="map-outline" size={32} color={c.primary} />
      <Text
        style={{
          color: c.text,
          fontSize: 19,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {mode === "Explore" ? "Map goes here" : `${mode} map goes here`}
      </Text>
      <Text
        style={{
          color: c.muted,
          fontSize: 13,
          lineHeight: 21,
          textAlign: "center",
        }}
      >
        {descriptions[mode]}
      </Text>
    </View>
  );
}
