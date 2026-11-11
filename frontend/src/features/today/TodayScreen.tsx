import { useCallback, useEffect, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Avatar, Card, Label, Screen, SectionLabel } from "../../components/ui";
import { fonts, useTheme, type Palette } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { todayString } from "../workouts/validation";
import { ACTIVITIES, isActivityType, type Workout } from "../workouts/types";
import { refreshChallenge, resetChallenge, useChallenge, type ChallengeMetric, type TodayChallenge } from "./challenge";
import { useApi, type Load } from "../../api/useResource";
import { formatNumber } from "../../utils/format";
import { metersToMiles } from "../routes/geometry";
import { Toast } from "./Toast";

type Weather = { temperature: number; humidity: number; wind: number; aqi: number | null };
type Stats = { workoutCount: number; totalDistanceMiles: number; totalMinutes: number };
type Rewards = {
  stats: Stats;
  achievements: Array<{ key: string; name: string; description: string; unlocked: boolean }>;
};
type Post = {
  id: number;
  kind: "goal" | "route" | "workout";
  title: string;
  author: string;
  target: number | null;
  unit: string | null;
  routeName: string | null;
  distanceMeters: number | null;
  activityType: string | null;
  distanceMiles: number | null;
  durationMinutes: number | null;
};

const METRICS: Record<ChallengeMetric, string> = { miles: "mi", minutes: "min", workouts: "workouts" };
// Mirrors the thresholds in backend/src/features/rewards/service.js BADGES so
// the tile can say how far away the next badge is.
const BADGE_GOALS: Record<string, { stat: keyof Stats; target: number; unit: string }> = {
  first_workout: { stat: "workoutCount", target: 1, unit: "workouts" },
  five_workouts: { stat: "workoutCount", target: 5, unit: "workouts" },
  five_miles: { stat: "totalDistanceMiles", target: 5, unit: "mi" },
  hour_active: { stat: "totalMinutes", target: 60, unit: "min" },
};

function greeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Evening";
}

export function TodayScreen() {
  const c = useTheme();
  const { user, ready } = useSession();
  const signedIn = ready && !!user;
  const now = new Date();
  const date = `${now.toLocaleDateString("en-US", { weekday: "long" })} · ${now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
  const name = user?.name.trim().split(/\s+/)[0];
  const weather = useApi<Weather>("/api/weather").state;
  const workouts = useApi<Workout[]>(signedIn ? "/api/workouts" : null).state;
  const rewards = useApi<Rewards>(signedIn ? "/api/rewards" : null).state;
  const posts = useApi<Post[]>(signedIn ? "/api/fitness/shares" : null).state;
  const challenge = useChallenge();
  useEffect(() => {
    if (!signedIn) resetChallenge();
  }, [signedIn, user?.id]);
  useFocusEffect(
    useCallback(() => {
      if (signedIn) void refreshChallenge();
    }, [signedIn, user?.id]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Screen>
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginTop: 8, marginBottom: 8 }}>
          {date.toUpperCase()}
        </Text>
        <Text
          accessibilityRole="header"
          style={{ color: c.text, fontFamily: fonts.heading, fontSize: 29, lineHeight: 34, letterSpacing: -0.6 }}
        >
          {greeting(now.getHours())}
          {name ? `, ${name}.` : "."}
        </Text>
        {weather.status === "ready" ? <WeatherLine c={c} weather={weather.data} /> : <View style={{ height: 18 }} />}
        {!ready ? null : signedIn ? <ChallengeCard c={c} load={challenge} /> : <SignedOutCard c={c} />}
        {signedIn && workouts.status === "ready" ? <WeekStrip c={c} workouts={workouts.data} /> : null}
        {signedIn && rewards.status === "ready" ? <NextBadge c={c} rewards={rewards.data} /> : null}
        {signedIn && posts.status === "ready" && posts.data.length ? <Community c={c} posts={posts.data.slice(0, 2)} /> : null}
      </Screen>
      <Toast />
    </View>
  );
}

function WeatherLine({ c, weather }: { c: Palette; weather: Weather }) {
  const item = (icon: ReactNode, text: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      {icon}
      <Text style={{ color: c.muted, fontSize: 13 }}>{text}</Text>
    </View>
  );
  return (
    <View accessibilityLabel="Current conditions" style={{ flexDirection: "row", gap: 14, marginTop: 12, marginBottom: 18 }}>
      {item(<Ionicons name="thermometer-outline" size={15} color={c.muted} />, `${Math.round(weather.temperature)}°F`)}
      {weather.aqi != null && item(<Ionicons name="leaf-outline" size={15} color={c.muted} />, `AQI ${weather.aqi}`)}
      {item(<Feather name="wind" size={15} color={c.muted} />, `${Math.round(weather.wind)} mph`)}
    </View>
  );
}

function Hero({ c, kicker, right, title, children }: { c: Palette; kicker: string; right?: string; title: string; children: ReactNode }) {
  return (
    <View accessibilityLabel="Today's challenge" style={{ backgroundColor: c.hero, borderRadius: 22, padding: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: c.heroAccent, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 }}>{kicker}</Text>
        {right ? <Text style={{ color: c.heroAccent, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 }}>{right}</Text> : null}
      </View>
      <Text style={{ color: c.heroText, fontFamily: fonts.heading, fontSize: 22, marginTop: 6, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );
}

function HeroButton({ c, title, onPress }: { c: Palette; title: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: c.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, opacity: pressed ? 0.8 : 1 })}
    >
      <Text style={{ color: c.onPrimary, fontSize: 13, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

function ChallengeCard({ c, load }: { c: Palette; load: Load<TodayChallenge> }) {
  const router = useRouter();
  if (load.status !== "ready" || !load.data.challenge)
    return (
      <Card>
        <Label secondary>TODAY'S CHALLENGE</Label>
        <Label>
          {load.status === "loading"
            ? "Loading today's challenge…"
            : load.status === "error"
              ? load.message
              : "No challenge is set for today."}
        </Label>
      </Card>
    );
  const { challenge, progress, completed } = load.data;
  const unit = METRICS[challenge.metric];
  const fraction = completed ? 1 : Math.min(1, challenge.target ? progress / challenge.target : 1);
  const activity = isActivityType(challenge.activityType) ? challenge.activityType : null;
  return (
    <Hero
      c={c}
      kicker="TODAY'S CHALLENGE"
      right={completed ? "DONE" : `${formatNumber(progress)} / ${formatNumber(challenge.target)} ${unit}`.toUpperCase()}
      title={challenge.title}
    >
      <View
        accessibilityRole="progressbar"
        aria-valuenow={Math.round(fraction * 100)}
        style={{ height: 8, borderRadius: 99, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.heroText, opacity: 0.15 }} />
        <View style={{ height: 8, width: `${fraction * 100}%`, borderRadius: 99, backgroundColor: c.heroAccent }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, minHeight: 36 }}>
        <Text style={{ color: c.heroMuted, fontSize: 13 }}>
          {completed
            ? `${formatNumber(progress)} ${unit} today`
            : `${formatNumber(Math.max(0, challenge.target - progress))} ${unit} to go`}
        </Text>
        {completed ? (
          <Text style={{ color: c.heroAccent, fontSize: 13, fontWeight: "700" }}>✓ Complete</Text>
        ) : (
          <HeroButton
            c={c}
            title={activity ? `Log a ${ACTIVITIES[activity].noun}` : "Log activity"}
            onPress={() => router.push((activity ? `/log?activity=${activity}` : "/log") as Href)}
          />
        )}
      </View>
    </Hero>
  );
}

function SignedOutCard({ c }: { c: Palette }) {
  const router = useRouter();
  return (
    <Hero c={c} kicker="TODAY'S CHALLENGE" title="A new goal every day">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Text style={{ color: c.heroMuted, fontSize: 13, flex: 1 }}>Sign in to see today's challenge and track your progress.</Text>
        <HeroButton c={c} title="Sign in" onPress={() => router.push("/welcome" as Href)} />
      </View>
    </Hero>
  );
}

function WeekStrip({ c, workouts }: { c: Palette; workouts: Workout[] }) {
  const logged = new Set(workouts.map((w) => w.workoutDate));
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i);
    return { key: todayString(d), letter: "SMTWTFS"[d.getDay()], isToday: i === 6 };
  });
  return (
    <View accessibilityLabel="This week" style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 6 }}>
      {days.map((day) => {
        const done = logged.has(day.key);
        return (
          <View
            key={day.key}
            testID={`day-${day.key}`}
            accessibilityLabel={`${day.key} ${done ? "active" : "rest"}`}
            style={{ alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: done ? c.primary : "transparent",
                borderWidth: day.isToday ? 2 : done ? 0 : 1.5,
                borderStyle: day.isToday || done ? "solid" : "dashed",
                borderColor: day.isToday ? c.text : c.border,
              }}
            >
              {done ? <Ionicons name="checkmark" size={15} color={c.onPrimary} /> : null}
            </View>
            <Text style={{ fontSize: 11, fontWeight: day.isToday ? "800" : "600", color: day.isToday ? c.text : c.muted }}>
              {day.letter}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Tile({ c, icon, title, subtitle, onPress }: { c: Palette; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        marginTop: 10,
        borderRadius: 18,
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={19} color={c.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: c.muted, fontSize: 12 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.muted} />
    </Pressable>
  );
}

function NextBadge({ c, rewards }: { c: Palette; rewards: Rewards }) {
  const router = useRouter();
  const next = rewards.achievements.find((a) => !a.unlocked);
  const open = () => router.push("/achievements");
  if (!next) {
    const count = rewards.achievements.length;
    return <Tile c={c} icon="trophy-outline" title="Every badge earned" subtitle={`${count} of ${count} unlocked`} onPress={open} />;
  }
  const goal = BADGE_GOALS[next.key];
  const away = goal ? Math.max(0, goal.target - rewards.stats[goal.stat]) : null;
  return (
    <Tile
      c={c}
      icon="ribbon-outline"
      title={`Next badge: ${next.name}`}
      subtitle={goal && away !== null ? `${formatNumber(away)} ${away === 1 && goal.unit === "workouts" ? "workout" : goal.unit} away` : next.description}
      onPress={open}
    />
  );
}

function postLine(post: Post): { title: string; subtitle: string } {
  const who = post.author.trim().split(/\s+/)[0] || "Someone";
  if (post.kind === "goal")
    return { title: `${who} set a goal`, subtitle: post.title };
  if (post.kind === "route")
    return {
      title: `${who} shared a route`,
      subtitle: [post.routeName || post.title, post.distanceMeters ? `${formatNumber(metersToMiles(post.distanceMeters))} mi` : null].filter(Boolean).join(" · "),
    };
  const noun = isActivityType(post.activityType) ? ACTIVITIES[post.activityType].noun : "workout";
  return {
    title: `${who} shared a ${noun}`,
    subtitle: [post.title, post.distanceMiles != null ? `${formatNumber(post.distanceMiles)} mi` : null, post.durationMinutes != null ? `${post.durationMinutes} min` : null]
      .filter(Boolean)
      .join(" · "),
  };
}

function Community({ c, posts }: { c: Palette; posts: Post[] }) {
  const router = useRouter();
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginHorizontal: 2, marginBottom: 2 }}>
        <SectionLabel flush>Community</SectionLabel>
        <Pressable accessibilityRole="link" onPress={() => router.push("/shares" as Href)} hitSlop={10}>
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: "700" }}>See all</Text>
        </Pressable>
      </View>
      {posts.map((post, i) => {
        const line = postLine(post);
        return (
          <View
            key={post.id}
            style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 10, borderBottomWidth: i < posts.length - 1 ? 1 : 0, borderBottomColor: c.border }}
          >
            <Avatar name={post.author} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>{line.title}</Text>
              {line.subtitle ? <Text style={{ color: c.muted, fontSize: 12 }}>{line.subtitle}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
