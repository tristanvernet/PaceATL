import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiRequest, errorMessage } from "../../api/client";
import { BackButton, Button, Card, Heading, Label, ListGroup, Notice, Screen, SectionLabel } from "../../components/ui";
import { useTheme } from "../../theme";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useSession } from "../auth/SessionProvider";
import { refreshChallenge } from "../today/challenge";
import { invalidate, useApi } from "../../api/useResource";
import { Toast } from "../today/Toast";
import { formatNumber } from "../../utils/format";
import { ACTIVITIES, formatPace, type Workout } from "./types";
import { todayString } from "./validation";

function dayLabel(date: string) {
  const today = new Date();
  if (date === todayString(today)) return "Today";
  if (date === todayString(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))) return "Yesterday";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export function HistoryScreen() {
  const c = useTheme();
  const router = useRouter();
  const { user, ready } = useSession();
  const load = useApi<Workout[]>(ready && user ? "/api/workouts" : null).state;
  const [deleted, setDeleted] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function remove(workoutId: number) {
    setDeleting(true);
    setDeleteError("");
    try {
      await apiRequest(`/api/workouts/${workoutId}`, { method: "DELETE" });
      setDeleted((ids) => new Set(ids).add(workoutId));
      setConfirming(null);
      void refreshChallenge();
      void invalidate("/api/workouts", "/api/rewards", "/api/fitness");
    } catch (e) {
      setDeleteError(errorMessage(e, "Could not delete the activity."));
    } finally {
      setDeleting(false);
    }
  }

  const workouts = load.status === "ready" ? load.data.filter((w) => !deleted.has(w.workoutId)) : [];
  const days: Array<[string, Workout[]]> = [];
  for (const w of workouts) {
    const last = days[days.length - 1];
    if (last?.[0] === w.workoutDate) last[1].push(w);
    else days.push([w.workoutDate, [w]]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Screen>
        <BackButton />
        <Heading title="Activity history" />
        {!ready ? null : !user ? (
          <SignInPrompt title="Sign in to see your activity" />
        ) : load.status === "loading" ? (
          <Notice text="Loading your activity…" />
        ) : load.status === "error" ? (
          <Notice text={load.message} error />
        ) : !workouts.length ? (
          <Card>
            <Label>No activity yet</Label>
            <Label secondary>Log a run, walk, or ride and it will show up here.</Label>
            <Button title="Log activity" onPress={() => router.push("/log")} />
          </Card>
        ) : (
          <>
            {deleteError ? <Notice text={deleteError} error /> : null}
            {days.map(([date, list]) => (
              <View key={date}>
                <SectionLabel>{dayLabel(date)}</SectionLabel>
                <ListGroup>
                  {list.map((w) => {
                    const activity = ACTIVITIES[w.activityType];
                    const pace = formatPace(w.distanceMiles, w.durationMinutes);
                    const stats = [`${formatNumber(w.distanceMiles, 2)} mi`, `${w.durationMinutes} min`, pace && `${pace} /mi`].filter(Boolean).join(" · ");
                    return (
                      <View key={w.workoutId} testID={`workout-${w.workoutId}`} style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name={activity.icon} size={18} color={c.primary} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{activity.label}</Text>
                            <Text style={{ color: c.muted, fontSize: 12, fontVariant: ["tabular-nums"] }}>{stats}</Text>
                            {w.notes ? <Text style={{ color: c.text, fontSize: 13, marginTop: 2 }}>{w.notes}</Text> : null}
                          </View>
                          {confirming !== w.workoutId ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${activity.noun} on ${dayLabel(date)}`}
                              disabled={deleting}
                              hitSlop={8}
                              onPress={() => {
                                setConfirming(w.workoutId);
                                setDeleteError("");
                              }}
                            >
                              <Ionicons name="trash-outline" size={18} color={c.muted} />
                            </Pressable>
                          ) : null}
                        </View>
                        {confirming === w.workoutId ? (
                          <View style={{ gap: 8 }}>
                            <Label secondary>Delete this {activity.noun}? It stops counting toward your totals and today's challenge. Badges you already earned are kept.</Label>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <View style={{ flex: 1 }}>
                                <Button title="Keep" secondary disabled={deleting} onPress={() => setConfirming(null)} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Button title="Delete" loading={deleting} onPress={() => void remove(w.workoutId)} />
                              </View>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </ListGroup>
              </View>
            ))}
          </>
        )}
      </Screen>
      <Toast />
    </View>
  );
}
