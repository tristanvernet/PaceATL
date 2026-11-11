import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../api/client";
import { Button } from "../../components/ui";
import { useTheme } from "../../theme";
import type { Hazard } from "./types";
import { useResource } from "../../api/useResource";

type Briefing = {
  routeId: number;
  summary: string;
  terrain: string;
  highlights: string[];
  hazards: string[];
  tips: string[];
  facts: {
    distanceMiles: number;
    terrain: { climbFeet: number; steepestGradePercent: number } | null;
    highlights: unknown[] | null;
    weather: { temperature: number; humidity?: number; wind?: number; aqi: number | null } | null;
  };
  generatedAt: string;
};

// MySQL-style UTC "YYYY-MM-DD HH:MM:SS", as in savedOn.
const updatedAt = (briefing: Briefing) =>
  new Date(`${briefing.generatedAt.replace(" ", "T")}Z`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

function conditions({ facts }: Briefing) {
  const w = facts.weather;
  if (!w) return "Weather is unavailable right now.";
  return [
    `${w.temperature}°F`,
    w.aqi != null && `AQI ${w.aqi}`,
    w.wind != null && `wind ${w.wind} mph`,
  ]
    .filter(Boolean)
    .join(", ");
}

function Section({
  icon,
  title,
  lines,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  lines: string[];
}) {
  const c = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={14} color={c.text} />
        <Text style={{ color: c.text, fontSize: 12, fontWeight: "700" }}>{title}</Text>
      </View>
      {lines.map((line) => (
        <Text
          key={line}
          style={{ color: c.text, fontSize: 13, lineHeight: 19, marginLeft: 20, marginTop: 3 }}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

/**
 * AI briefing for one saved route, requested on mount. Reported hazards come from approved
 * community reports near the route, so they show even when the briefing is still loading.
 */
export function RouteBriefing({ routeId, hazards }: { routeId: number; hazards: Hazard[] }) {
  const c = useTheme();
  const { state, reload } = useResource(
    `briefing:${routeId}`,
    // Gathering map data and writing the briefing can take up to a minute.
    (signal) => apiRequest<Briefing>(`/api/routes/${routeId}/briefing`, { method: "POST", timeoutMs: 60000, signal }),
    { staleMs: 10 * 60_000 },
  );

  const hazardLines = hazards.length
    ? hazards.map((h) => (h.description ? `${h.title}. ${h.description}` : h.title))
    : state.status === "ready" && state.data.hazards.length
      ? state.data.hazards
      : ["No hazards have been reported near this route."];

  return (
    <View
      accessibilityLabel="Before you go"
      style={{ backgroundColor: c.soft, borderRadius: 16, padding: 14, marginBottom: 14 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <Ionicons name="sparkles-outline" size={15} color={c.primary} />
        <Text style={{ color: c.primary, fontSize: 13, fontWeight: "700" }}>Before you go</Text>
      </View>
      {state.status === "loading" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
          <ActivityIndicator size="small" color={c.muted} />
          <Text style={{ color: c.muted, fontSize: 13 }}>
            Checking elevation, nearby places and weather…
          </Text>
        </View>
      ) : state.status === "error" ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ color: c.error, fontSize: 13 }}>{state.message}</Text>
          <Button title="Try again" secondary onPress={reload} />
        </View>
      ) : (
        <>
          <Text style={{ color: c.text, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            {state.data.summary}
          </Text>
          <Section
            icon="partly-sunny-outline"
            title="Conditions"
            lines={[conditions(state.data)]}
          />
          {state.data.terrain ? (
            <Section icon="trending-up-outline" title="Terrain" lines={[state.data.terrain]} />
          ) : null}
        </>
      )}
      <Section icon="warning-outline" title="Reported hazards" lines={hazardLines} />
      {state.status === "ready" ? (
        <>
          {state.data.highlights.length ? (
            <Section icon="leaf-outline" title="Scenic highlights" lines={state.data.highlights} />
          ) : null}
          {state.data.tips.length ? (
            <Section icon="checkmark-circle-outline" title="Tips" lines={state.data.tips} />
          ) : null}
          <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 12 }}>
            AI-generated at {updatedAt(state.data)} from map, elevation and weather data. Check
            conditions yourself before heading out.
          </Text>
        </>
      ) : null}
    </View>
  );
}
