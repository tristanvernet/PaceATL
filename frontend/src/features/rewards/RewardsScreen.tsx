import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BackButton,
  Loaded,
  Heading,
  Notice,
  Screen,
} from "../../components/ui";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useApi } from "../../api/useResource";

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  earnedAt: string | null;
};
export type Rewards = {
  stats: {
    workoutCount: number;
    totalDistanceMiles: number;
    totalMinutes: number;
  };
  achievements: Achievement[];
};

const glyph = (icon: string) =>
  (icon in Ionicons.glyphMap
    ? icon
    : "ribbon") as keyof typeof Ionicons.glyphMap;
// earnedAt is a MySQL DATETIME in UTC ("2026-11-10 15:46:50"), which not every
// JS engine parses, so read the date part only.
const earnedOn = (earnedAt: string) =>
  new Date(`${earnedAt.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function RewardsScreen() {
  const { ready, user } = useSession();
  return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow="Rewards"
        title="Achievements"
        subtitle="Badges unlock as you log workouts."
      />
      {!ready ? (
        <Notice text="Checking your account…" />
      ) : user ? (
        <Badges />
      ) : (
        <SignInPrompt
          title="Earn badges"
          text="Achievements are saved to your PaceATL account."
        />
      )}
    </Screen>
  );
}

function Badges() {
  const c = useTheme();
  const { state, reload } = useApi<Rewards>("/api/rewards");
  return (
    <Loaded state={state} reload={reload} loading="Loading achievements…">
      {(data) => {
        const { stats, achievements } = data;
        const unlocked = achievements.filter((a) => a.unlocked).length;
        return (
          <>
            <View
              style={{
                flexDirection: "row",
                padding: 14,
                borderRadius: 18,
                backgroundColor: c.hero,
                marginBottom: 18,
              }}
            >
              {[
                {
                  value: `${unlocked}/${achievements.length}`,
                  label: "unlocked",
                },
                { value: String(stats.workoutCount), label: "workouts" },
                { value: stats.totalDistanceMiles.toFixed(1), label: "miles" },
                { value: String(stats.totalMinutes), label: "minutes" },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: c.heroText,
                      fontSize: 19,
                      fontWeight: "700",
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {s.value}
                  </Text>
                  <Text style={{ color: c.heroMuted, fontSize: 11 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {achievements.map((a) => (
                <View
                  key={a.key}
                  accessible
                  accessibilityLabel={`${a.name}, ${a.unlocked ? "unlocked" : "locked"}. ${a.description}`}
                  style={{
                    flexBasis: "47%",
                    flexGrow: 1,
                    padding: 14,
                    gap: 6,
                    borderRadius: 18,
                    backgroundColor: c.panel,
                    borderWidth: 1,
                    borderColor: c.border,
                    opacity: a.unlocked ? 1 : 0.7,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                      backgroundColor: a.unlocked ? c.primary : c.soft,
                    }}
                  >
                    <Ionicons
                      name={a.unlocked ? glyph(a.icon) : "lock-closed-outline"}
                      size={20}
                      color={a.unlocked ? c.onPrimary : c.muted}
                    />
                  </View>
                  <Text
                    style={{ color: c.text, fontSize: 14, fontWeight: "700" }}
                  >
                    {a.name}
                  </Text>
                  <Text
                    style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}
                  >
                    {a.description}
                  </Text>
                  <Text
                    style={{
                      color: a.unlocked ? c.primary : c.muted,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {a.unlocked && a.earnedAt
                      ? `Unlocked ${earnedOn(a.earnedAt)}`
                      : "Locked"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        );
      }}
    </Loaded>
  );
}
