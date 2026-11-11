import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest, errorMessage } from "../../api/client";
import { Button, Field, Notice, SectionLabel, SegmentedControl, column, useLeave } from "../../components/ui";
import { useTheme } from "../../theme";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useSession } from "../auth/SessionProvider";
import { challengeSnapshot, isComplete, refreshChallenge, type TodayChallenge } from "../today/challenge";
import type { Load } from "../../api/useResource";
import { savedToast, showToast } from "../today/toast";
import { formatNumber } from "../../utils/format";
import { NOTES_MAX, todayString, validateWorkout } from "./validation";
import {
  ACTIVITIES,
  ACTIVITY_TYPES,
  formatPace,
  isActivityType,
  type ActivityType,
  type LoggedWorkout,
} from "./types";

type DateChoice = "today" | "yesterday" | "other";
const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "other", label: "Other date" },
] as const;
const ACTIVITY_OPTIONS = ACTIVITY_TYPES.map((value) => ({ value, label: ACTIVITIES[value].label }));

// An empty field is missing, not zero.
const toNumber = (text: string) => (text.trim() ? Number(text) : NaN);
const yesterday = () => {
  const d = new Date();
  return todayString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
};
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function LogSheet() {
  const c = useTheme();
  const { user, ready } = useSession();
  // The toast needs the challenge as it was before this save. Reading it when
  // the sheet opens keeps it off the save path and can never observe the save.
  const before = useRef<Promise<Load<TodayChallenge>> | null>(null);
  useEffect(() => {
    if (user && challengeSnapshot().status !== "ready") before.current = refreshChallenge();
  }, [user]);
  const params = useLocalSearchParams<{ activity?: string; distance?: string }>();
  const initialActivity = first(params.activity);
  const initialDistance = Number(first(params.distance));
  const [activity, setActivity] = useState<ActivityType>(isActivityType(initialActivity) ? initialActivity : "run");
  const [distance, setDistance] = useState(initialDistance > 0 ? formatNumber(initialDistance, 2) : "");
  const [minutes, setMinutes] = useState("");
  const [dateChoice, setDateChoice] = useState<DateChoice>("today");
  const [customDate, setCustomDate] = useState(yesterday());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const edit = (key: string, setter: (text: string) => void) => (text: string) => {
    setter(text);
    setErrors(({ [key]: _, ...rest }) => rest);
  };
  const close = useLeave();
  const workoutDate =
    dateChoice === "today" ? todayString() : dateChoice === "yesterday" ? yesterday() : customDate.trim();
  const pace = formatPace(toNumber(distance), toNumber(minutes));
  const noun = ACTIVITIES[activity].noun;

  async function save() {
    const values = {
      activityType: activity,
      distanceMiles: toNumber(distance),
      durationMinutes: toNumber(minutes),
      workoutDate,
      notes: notes.trim() || null,
    };
    const found = validateWorkout(values);
    setErrors(found);
    setSaveError("");
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const snapshot = challengeSnapshot();
      const prior = snapshot.status === "ready" ? snapshot : await (before.current ?? refreshChallenge());
      const result = await apiRequest<LoggedWorkout>("/api/workouts", { method: "POST", body: JSON.stringify(values) });
      const after = await refreshChallenge();
      showToast(savedToast(activity, isComplete(after) && !isComplete(prior), result.unlocked));
      close();
    } catch (e) {
      setSaveError(errorMessage(e, "Could not save. Try again."));
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 }}>
        <Pressable accessibilityRole="button" onPress={close} hitSlop={10} style={{ width: 60 }}>
          <Text style={{ color: c.muted, fontSize: 15 }}>Cancel</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
          Log activity
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[column, { paddingHorizontal: 20, paddingBottom: 36 }]}
      >
        {!ready ? null : !user ? (
          <SignInPrompt
            title="Sign in to log activity"
            text="Your runs, walks, and rides count toward daily challenges and badges."
          />
        ) : (
          <>
            <View style={{ marginTop: 6, marginBottom: 22 }}>
              <SegmentedControl label="Activity" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
            </View>
            <Field label="Distance" unit="mi" value={distance} onChangeText={edit("distanceMiles", setDistance)} error={errors.distanceMiles} keyboardType="decimal-pad" placeholder="0.00" />
            <Field label="Duration" unit="min" value={minutes} onChangeText={edit("durationMinutes", setMinutes)} error={errors.durationMinutes} keyboardType="number-pad" placeholder="0" />
            <View style={{ borderBottomWidth: 1, borderBottomColor: c.border, paddingTop: 12, paddingBottom: 12, marginBottom: 14, gap: 10 }}>
              <SectionLabel flush>Date</SectionLabel>
              <SegmentedControl label="Date" options={DATE_OPTIONS} value={dateChoice} onChange={setDateChoice} />
              {dateChoice === "other" ? (
                <TextInput
                  accessibilityLabel="Date (YYYY-MM-DD)"
                  value={customDate}
                  onChangeText={edit("workoutDate", setCustomDate)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ color: c.text, fontSize: 18, fontWeight: "600", paddingVertical: 4 }}
                />
              ) : null}
              {errors.workoutDate ? <Text style={{ color: c.error, fontSize: 12 }}>{errors.workoutDate}</Text> : null}
            </View>
            <View
              accessibilityLabel={pace ? `Pace ${pace} per mile` : "Pace"}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginTop: 6, marginBottom: 14 }}
            >
              <Text style={{ color: c.muted, fontSize: 13 }}>Pace</Text>
              <Text style={{ color: pace ? c.primary : c.muted, fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                {pace ? `${pace} /mi` : "–"}
              </Text>
            </View>
            <Field label="Notes" placeholder="Optional" value={notes} onChangeText={edit("notes", setNotes)} error={errors.notes} maxLength={NOTES_MAX} multiline />
            {saveError ? <Notice text={saveError} error /> : null}
            <Button title={`Save ${noun}`} loading={saving} onPress={save} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
