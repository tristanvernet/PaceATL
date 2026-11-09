import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { apiRequest } from "../../api/client";
import { BackButton, Button, Card, Field, Heading, Label, Notice, Screen } from "../../components/ui";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { NOTES_MAX, WORKOUT_TYPES, todayString, validateWorkout } from "./validation";

type ActivityType = "run" | "walk" | "cycle" | "other";
type Workout = {
  workoutId: number;
  activityType: ActivityType;
  distanceMiles: number;
  durationMinutes: number;
  workoutDate: string;
  notes: string | null;
};
type LoggedWorkout = { workout: Workout; unlocked: Array<{ key: string; name: string }> };
type History = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; workouts: Workout[] };

const LABELS: Record<ActivityType, string> = { run: "Run", walk: "Walk", cycle: "Cycle", other: "Other" };
const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
// An empty field is missing, not zero.
const toNumber = (text: string) => (text.trim() ? Number(text) : NaN);
const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

export function WorkoutsScreen() {
  const router = useRouter();
  const c = useTheme();
  const { user, ready } = useSession();
  const [activityType, setActivityType] = useState<ActivityType>("run");
  const [workoutDate, setWorkoutDate] = useState(todayString());
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [history, setHistory] = useState<History>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setHistory({ status: "loading" });
    setNotice("");
    if (!ready || !user) return () => controller.abort();
    apiRequest<Workout[]>("/api/workouts", { signal: controller.signal })
      .then((workouts) => { if (!controller.signal.aborted) setHistory({ status: "ready", workouts }); })
      .catch((e) => {
        if (!controller.signal.aborted) setHistory({ status: "error", message: message(e, "Could not load your workouts.") });
      });
    return () => controller.abort();
  }, [ready, user?.id, attempt]);

  async function logWorkout() {
    const values = {
      activityType,
      distanceMiles: toNumber(distance),
      durationMinutes: toNumber(minutes),
      workoutDate: workoutDate.trim(),
      notes: notes.trim() || null,
    };
    const found = validateWorkout(values);
    setErrors(found);
    setNotice("");
    setSaveError("");
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const result = await apiRequest<LoggedWorkout>("/api/workouts", { method: "POST", body: JSON.stringify(values) });
      setHistory((list) =>
        list.status === "ready"
          ? { status: "ready", workouts: [result.workout, ...list.workouts].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate) || b.workoutId - a.workoutId) }
          : list,
      );
      setDistance("");
      setMinutes("");
      setNotes("");
      setNotice(result.unlocked.length
        ? `Workout logged. New achievement unlocked: ${result.unlocked.map((b) => b.name).join(", ")}!`
        : "Workout logged.");
    } catch (e) {
      setSaveError(message(e, "Could not log the workout."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(workoutId: number) {
    setDeleting(true);
    setDeleteError("");
    try {
      await apiRequest(`/api/workouts/${workoutId}`, { method: "DELETE" });
      setHistory((list) =>
        list.status === "ready" ? { status: "ready", workouts: list.workouts.filter((w) => w.workoutId !== workoutId) } : list,
      );
      setConfirmingId(null);
    } catch (e) {
      setDeleteError(message(e, "Could not delete the workout."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <BackButton />
      <Heading eyebrow="Workout tracker" title="Log a workout" subtitle="Record your activity and keep a history. Every workout counts toward your achievements." />
      {!ready ? (
        <Notice text="Checking your account…" />
      ) : !user ? (
        <Card>
          <Label>Sign in required</Label>
          <Label secondary>Workouts are saved to your PaceATL account.</Label>
          <Button title="Log in" onPress={() => router.push("/login")} />
        </Card>
      ) : (
        <>
          <Card>
            <Label>New workout</Label>
            <Text style={{ color: c.text, fontSize: 14 }}>Activity</Text>
            <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: c.soft, padding: 4, borderRadius: 14, marginBottom: 8 }}>
              {(WORKOUT_TYPES as ActivityType[]).map((type) => (
                <Pressable
                  key={type}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: type === activityType }}
                  onPress={() => setActivityType(type)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: type === activityType ? c.panel : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: c.text, fontSize: 13 }}>{LABELS[type]}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Date (YYYY-MM-DD)" value={workoutDate} onChangeText={setWorkoutDate} error={errors.workoutDate} autoCapitalize="none" autoCorrect={false} />
            <Field label="Distance in miles" keyboardType="decimal-pad" placeholder="e.g. 3.1" value={distance} onChangeText={setDistance} error={errors.distanceMiles} />
            <Field label="Duration in minutes" keyboardType="number-pad" placeholder="e.g. 30" value={minutes} onChangeText={setMinutes} error={errors.durationMinutes} />
            <Field label="Notes (optional)" value={notes} onChangeText={setNotes} error={errors.notes} maxLength={NOTES_MAX} multiline />
            {saveError ? <Notice text={saveError} error /> : null}
            <Button title="Log workout" loading={saving} onPress={logWorkout} />
          </Card>
          {notice ? <Notice text={notice} /> : null}
          <Button title="View my achievements" secondary onPress={() => router.push("/achievements")} />
          <View style={{ marginTop: 24 }}>
            <Label>Workout history</Label>
          </View>
          {history.status === "loading" ? (
            <Notice text="Loading your workouts…" />
          ) : history.status === "error" ? (
            <>
              <Notice text={history.message} error />
              <Button title="Try again" secondary onPress={() => setAttempt((n) => n + 1)} />
            </>
          ) : !history.workouts.length ? (
            <Notice text="No workouts yet. Log your first one above." />
          ) : (
            <View style={{ gap: 12, marginTop: 12 }}>
              {deleteError ? <Notice text={deleteError} error /> : null}
              {history.workouts.map((w) => (
                <Card key={w.workoutId}>
                  <Label>{LABELS[w.activityType]} • {w.distanceMiles.toFixed(2)} mi • {w.durationMinutes} min</Label>
                  <Label secondary>{formatDate(w.workoutDate)}{w.notes ? `\n${w.notes}` : ""}</Label>
                  {confirmingId === w.workoutId ? (
                    <>
                      <Label secondary>Delete this workout? It will no longer count toward your totals. Badges you already earned are kept.</Label>
                      <Button title="Delete workout" loading={deleting} onPress={() => deleteWorkout(w.workoutId)} />
                      <Button title="Keep workout" secondary disabled={deleting} onPress={() => setConfirmingId(null)} />
                    </>
                  ) : (
                    <Button title="Delete" secondary disabled={deleting} onPress={() => { setConfirmingId(w.workoutId); setDeleteError(""); }} />
                  )}
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
