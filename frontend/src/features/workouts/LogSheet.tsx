import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputProps, type TextStyle } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../../api/client";
import { Button, Card, Field, Label, Notice, SegmentedControl } from "../../components/ui";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { challengeSnapshot, isComplete, refreshChallenge } from "../today/challenge";
import { savedToast, showToast } from "../today/toast";
import { NOTES_MAX, todayString, validateWorkout } from "./validation";
import {
  ACTIVITIES,
  ACTIVITY_TYPES,
  errorMessage,
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
  const router = useRouter();
  const { user, ready } = useSession();
  const params = useLocalSearchParams<{ activity?: string; distance?: string }>();
  const initialActivity = first(params.activity);
  const initialDistance = Number(first(params.distance));
  const [activity, setActivity] = useState<ActivityType>(isActivityType(initialActivity) ? initialActivity : "run");
  const [distance, setDistance] = useState(initialDistance > 0 ? String(Number(initialDistance.toFixed(2))) : "");
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
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
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
      let before = challengeSnapshot();
      if (before.status !== "ready") before = await refreshChallenge();
      const result = await apiRequest<LoggedWorkout>("/api/workouts", { method: "POST", body: JSON.stringify(values) });
      const after = await refreshChallenge();
      showToast(savedToast(activity, isComplete(after) && !isComplete(before), result.unlocked));
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36, maxWidth: 560, width: "100%", alignSelf: "center" }}
      >
        {!ready ? null : !user ? (
          <Card>
            <Label>Sign in to log activity</Label>
            <Label secondary>Your runs, walks, and rides count toward daily challenges and badges.</Label>
            <Button title="Sign in" onPress={() => router.replace("/welcome" as Href)} />
          </Card>
        ) : (
          <>
            <View style={{ marginTop: 6, marginBottom: 22 }}>
              <SegmentedControl label="Activity" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
            </View>
            <BigNumber label="Distance" unit="mi" value={distance} onChangeText={edit("distanceMiles", setDistance)} error={errors.distanceMiles} keyboardType="decimal-pad" placeholder="0.00" />
            <BigNumber label="Duration" unit="min" value={minutes} onChangeText={edit("durationMinutes", setMinutes)} error={errors.durationMinutes} keyboardType="number-pad" placeholder="0" />
            <View style={{ borderBottomWidth: 1, borderBottomColor: c.border, paddingTop: 12, paddingBottom: 12, marginBottom: 14, gap: 10 }}>
              <Text style={{ color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>DATE</Text>
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

// The focus underline replaces the browser outline, which RN types do not expose.
const noWebOutline = (Platform.OS === "web" ? { outlineStyle: "none" } : null) as TextStyle | null;

function BigNumber({ label, unit, error, ...props }: TextInputProps & { label: string; unit: string; error?: string }) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ borderBottomWidth: focused ? 2 : 1, borderBottomColor: error ? c.error : focused ? c.primary : c.border, paddingTop: 12, paddingBottom: 10, marginBottom: 14 }}>
      <Text style={{ color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
        <TextInput
          accessibilityLabel={`${label} in ${unit}`}
          placeholderTextColor={c.muted}
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[noWebOutline, { flex: 1, minWidth: 0, color: c.text, fontSize: 34, fontWeight: "700", letterSpacing: -1.5, fontVariant: ["tabular-nums"], paddingVertical: 0 }]}
        />
        <Text style={{ color: c.muted, fontSize: 15, fontWeight: "600", marginLeft: 6 }}>{unit}</Text>
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: c.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
