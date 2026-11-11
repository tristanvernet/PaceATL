import { useState } from "react";
import { Text, View } from "react-native";
import { SegmentedControl, Button, Stats } from "../../components/ui";
import { useTheme } from "../../theme";
import { useApi } from "../../api/useResource";

type Summary = {
  activities: number;
  distanceMiles: number;
  minutes: number;
  daily: { date: string; minutes: number }[];
};
type Period = "7" | "30" | "all";

// Month and all time show the last 14 days of bars: 30 bars are too thin to
// read on a phone, and all time has no zero-filled days to draw.
const PERIODS: Record<Period, { label: string; title: string; bars: number }> = {
  "7": { label: "Week", title: "This week", bars: 7 },
  "30": { label: "Month", title: "Last 30 days", bars: 14 },
  all: { label: "All time", title: "All time", bars: 14 },
};
const OPTIONS = (Object.keys(PERIODS) as Period[]).map((value) => ({ value, label: PERIODS[value].label }));
const DAY_LETTERS = "SMTWTFS";

// The dashboard counts days in UTC, so the bars do too.
function lastDays(daily: Summary["daily"], count: number) {
  const minutes = new Map(daily.map((d) => [d.date, d.minutes]));
  const today = Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(today - (count - 1 - i) * 86400000);
    const date = day.toISOString().slice(0, 10);
    return { date, letter: DAY_LETTERS[day.getUTCDay()], minutes: minutes.get(date) ?? 0 };
  });
}

export function DashboardCard() {
  const c = useTheme();
  const [period, setPeriod] = useState<Period>("7");
  const { state, reload } = useApi<Summary>(`/api/fitness/dashboard?period=${period}`);
  const config = PERIODS[period];

  return (
    <View
      style={{
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{config.title}</Text>
        <SegmentedControl compact label="Dashboard period" options={OPTIONS} value={period} onChange={setPeriod} />
      </View>
      {state.status === "error" ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          <Text style={{ color: c.error, fontSize: 13 }}>{state.message}</Text>
          <Button title="Try again" secondary onPress={reload} />
        </View>
      ) : (
        <ActivitySummary summary={state.status === "ready" ? state.data : null} bars={config.bars} />
      )}
    </View>
  );
}

function ActivitySummary({ summary, bars }: { summary: Summary | null; bars: number }) {
  const c = useTheme();
  const days = summary ? lastDays(summary.daily, bars) : [];
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const stats = [
    { label: "miles", value: summary ? summary.distanceMiles.toFixed(1) : "–" },
    { label: "minutes", value: summary ? String(summary.minutes) : "–" },
    { label: summary?.activities === 1 ? "workout" : "workouts", value: summary ? String(summary.activities) : "–" },
  ];
  return (
    <>
      <Stats items={stats} />
      <View style={{ flexDirection: "row", gap: bars > 7 ? 4 : 6, alignItems: "flex-end", height: 56 }}>
        {(summary ? days : Array.from({ length: bars }, (_, i) => ({ date: String(i), letter: "", minutes: 0 }))).map((d) => (
          <View
            key={d.date}
            accessible={!!summary}
            accessibilityLabel={`${d.date}: ${d.minutes} minutes`}
            style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 4 }}
          >
            <View
              style={{
                width: "100%",
                borderRadius: 5,
                height: d.minutes ? `${Math.max(8, (d.minutes / max) * 100) * 0.72}%` : 3,
                backgroundColor: d.minutes ? c.primary : c.border,
              }}
            />
            <Text style={{ color: c.muted, fontSize: 10, fontWeight: "600" }}>{d.letter}</Text>
          </View>
        ))}
      </View>
    </>
  );
}
