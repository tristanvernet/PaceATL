import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { apiRequest } from "../../api/client";
import { useSession } from "../auth/SessionProvider";
import {
  BackButton, Button, Card, Field,
  Heading, Label, Notice, Screen,
} from "../../components/ui";
import { useTheme } from "../../theme";

type Summary = {
  activities: number;
  distanceMiles: number;
  minutes: number;
  daily: { date: string; minutes: number }[];
};

type Source = {
  id: number;
  name: string;
  distanceMiles?: number;
};

type Sources = {
  routes: Source[];
  workouts: Source[];
};

type Post = {
  id: number;
  kind: string;
  title: string;
  author: string;
  isOwner: boolean;
  target?: number;
  unit?: string;
  routeName?: string;
  distanceMeters?: number;
  activityType?: string;
  distanceMiles?: number;
  durationMinutes?: number;
};

export default function FitnessScreen() {
  const { user, ready } = useSession();
  const router = useRouter();
  const c = useTheme();

  const [period, setPeriod] = useState("7");
  const [attempt, setAttempt] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sources, setSources] = useState<Sources>({
    routes: [],
    workouts: [],
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [kind, setKind] = useState("goal");
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("miles");

  useEffect(() => {
    const controller = new AbortController();

    setSummary(null);
    setPosts([]);
    setSources({ routes: [], workouts: [] });

    if (!ready || !user) return () => controller.abort();

    setLoading(true);
    setError("");

    const options = { signal: controller.signal };

    Promise.all([
      apiRequest<Summary>(
        `/api/fitness/dashboard?period=${period}`, options
      ),
      apiRequest<Sources>("/api/fitness/sources", options),
      apiRequest<Post[]>("/api/fitness/shares", options),
    ])
      .then(([dashboard, saved, feed]) => {
        if (!controller.signal.aborted) {
          setSummary(dashboard);
          setSources(saved);
          setPosts(feed);
        }
      })
      .catch(e => {
        if (!controller.signal.aborted) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not load fitness data."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [ready, user?.id, period, attempt]);

  async function publish() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest("/api/fitness/shares", {
        method: "POST",
        body: JSON.stringify({
          kind,
          title,
          sourceId,
          target: target.trim() ? Number(target) : null,
          unit,
        }),
      });

      setTitle("");
      setTarget("");
      setSourceId(null);
      setNotice("Shared with the signed-in community.");
      setAttempt(n => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/fitness/shares/${id}`, {
        method: "DELETE",
      });

      setPosts(items => items.filter(item => item.id !== id));
      setNotice("Share removed. Your original item is kept.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not remove share."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <Screen>
        <Notice text="Checking your account…" />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <Heading title="Fitness dashboard" />
        <Notice text="Sign in to view your progress and share activity." />
        <Button
          title="Log in"
          onPress={() => router.push("/login")}
        />
      </Screen>
    );
  }

  const busy = loading || saving;
  const max = Math.max(
    1, ...(summary?.daily.map(day => day.minutes) || [])
  );
  const choices =
    kind === "route" ? sources.routes : sources.workouts;

  return (
    <Screen>
      <BackButton />
      <Heading
        title="Fitness dashboard"
        subtitle="Review your saved workouts and share selected activity."
      />

      {error ? <Notice text={error} error /> : null}
      {notice ? <Notice text={notice} /> : null}

      <Card>
        <Label>Reporting period (UTC)</Label>

        {["7", "30", "all"].map(p => (
          <Button
            key={p}
            title={`${period === p ? "✓ " : ""}${
              p === "all" ? "All time" : `Last ${p} days`
            }`}
            secondary
            disabled={busy}
            onPress={() => setPeriod(p)}
          />
        ))}

        <Button
          title="Refresh"
          loading={loading}
          disabled={saving}
          onPress={() => setAttempt(n => n + 1)}
        />
      </Card>

      {summary ? (
        <>
          <Card>
            <Label>{summary.distanceMiles.toFixed(2)} miles</Label>
            <Label>{summary.minutes} active minutes</Label>
            <Label>{summary.activities} recorded activities</Label>

            {!summary.activities ? (
              <Notice text="No workouts in this period. Log one to get started." />
            ) : null}
          </Card>

          <Card>
            <Label>Daily active minutes</Label>

            {summary.daily.map(day => (
              <View
                key={day.date}
                accessible
                accessibilityLabel={`${day.date}: ${day.minutes} minutes`}
                style={{ gap: 4, marginVertical: 4 }}
              >
                <Label secondary>
                  {day.date}: {day.minutes} min
                </Label>
                <View
                  style={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: c.primary,
                    width: `${(day.minutes / max) * 100}%`,
                  }}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Button
        title="Log a workout"
        onPress={() => router.push("/workouts")}
      />

      <Heading
        title="Social sharing"
        subtitle="Published items are visible to other signed-in users."
      />

      <Card>
        <Label>Choose what to share</Label>

        {["route", "workout", "goal"].map(k => (
          <Button
            key={k}
            title={`${kind === k ? "✓ " : ""}${k}`}
            secondary
            disabled={busy}
            onPress={() => {
              setKind(k);
              setSourceId(null);
            }}
          />
        ))}

        <Field
          label="Share title"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {kind === "goal" ? (
          <>
            <Field
              label="Goal target"
              keyboardType="decimal-pad"
              value={target}
              onChangeText={setTarget}
            />

            {["miles", "minutes", "workouts"].map(u => (
              <Button
                key={u}
                title={`${unit === u ? "✓ " : ""}${u}`}
                secondary
                disabled={busy}
                onPress={() => setUnit(u)}
              />
            ))}
          </>
        ) : (
          <>
            {!choices.length ? (
              <Notice text="No saved items available. Save a route or log a workout first." />
            ) : null}

            {choices.map(item => (
              <Button
                key={item.id}
                title={`${sourceId === item.id ? "✓ " : ""}#${
                  item.id
                } ${item.name}${
                  item.distanceMiles != null
                    ? ` · ${item.distanceMiles} mi`
                    : ""
                }`}
                secondary
                disabled={busy}
                onPress={() => setSourceId(item.id)}
              />
            ))}
          </>
        )}

        <Button
          title="Publish to community"
          loading={saving}
          disabled={
            loading || !title.trim() ||
            (kind !== "goal" && !sourceId)
          }
          onPress={() => void publish()}
        />
      </Card>

      <Label>Community feed</Label>

      {!loading && !error && !posts.length ? (
        <Notice text="No community shares yet." />
      ) : null}

      {posts.map(post => (
        <Card key={post.id}>
          <Label>{post.title}</Label>
          <Label secondary>
            {post.author} · {post.kind}
          </Label>

          {post.kind === "goal" ? (
            <Label>{post.target} {post.unit}</Label>
          ) : post.kind === "route" ? (
            <Label>
              {post.routeName} ·{" "}
              {((post.distanceMeters || 0) / 1609.344).toFixed(2)} mi
            </Label>
          ) : (
            <Label>
              {post.activityType} · {post.distanceMiles} mi ·{" "}
              {post.durationMinutes} min
            </Label>
          )}

          {post.isOwner ? (
            <Button
              title="Remove my share"
              secondary
              disabled={busy}
              onPress={() => void remove(post.id)}
            />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}