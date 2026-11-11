import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, Heading, BackButton, Button, Notice, SectionLabel } from "../../components/ui";
import { apiRequest, ApiError, errorMessage } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { invalidate, useApi } from "../../api/useResource";
import type { Tutorial } from "./types";

type Save = { kind: "idle" } | { kind: "saving" } | { kind: "failed"; message: string };

export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const router = useRouter();
  const session = useSession();
  const { state, reload, set } = useApi<Tutorial>(`/api/tutorials/${encodeURIComponent(id)}`);
  const [save, setSave] = useState<Save>({ kind: "idle" });
  const [videoError, setVideoError] = useState(false);

  async function markDone(tutorial: Tutorial) {
    setSave({ kind: "saving" });
    try {
      await apiRequest(`/api/tutorials/${encodeURIComponent(tutorial.tutId)}/complete`, { method: "POST" });
      set({ ...tutorial, completed: true });
      void invalidate("/api/tutorials");
      setSave({ kind: "idle" });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await session.refresh();
      setSave({ kind: "failed", message: errorMessage(e, "Unable to save completion.") });
    }
  }

  if (state.status !== "ready")
    return (
      <Screen>
        <BackButton />
        {state.status === "loading" ? (
          <Notice text="Loading tutorial…" />
        ) : (
          <>
            <Notice text={state.message} error />
            <Button title="Try again" onPress={reload} />
          </>
        )}
      </Screen>
    );

  const t = state.data;
  return (
    <Screen>
      <BackButton />
      <Heading eyebrow={t.category} title={t.title} subtitle={t.description} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: -8, marginBottom: 18 }}>
        {[t.difficultyLevel, `${t.estimatedDurationMins} min`, t.targetMuscleGroup].map((tag) => (
          <View key={tag} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.soft }}>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
          </View>
        ))}
      </View>

      {!!t.videoUrl && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Watch video"
          onPress={() => {
            setVideoError(false);
            Linking.openURL(t.videoUrl).catch(() => setVideoError(true));
          }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: 18,
            marginBottom: 18,
            backgroundColor: c.hero,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: c.heroAccent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={18} color={c.hero} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.heroText, fontSize: 15, fontWeight: "700" }}>Watch video</Text>
            <Text style={{ color: c.heroMuted, fontSize: 12 }}>Opens on YouTube</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={c.heroMuted} />
        </Pressable>
      )}
      {videoError && <Notice text="Could not open the video." error />}

      <SectionLabel>Steps</SectionLabel>
      <View
        style={{
          backgroundColor: c.panel,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          marginBottom: 18,
        }}
      >
        {t.steps.map((step, i) => (
          <View
            key={step.stepId}
            style={{ flexDirection: "row", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: c.border }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: c.soft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.primary, fontSize: 13, fontWeight: "800" }}>{step.stepNumber}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ color: c.text, fontSize: 14, lineHeight: 20 }}>{step.instructionText}</Text>
              {!!step.tipNotes && (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Ionicons name="bulb-outline" size={14} color={c.muted} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, color: c.muted, fontSize: 13, lineHeight: 19 }}>{step.tipNotes}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {save.kind === "failed" && <Notice text={save.message} error />}
      {!session.user ? (
        <Button title="Sign in to track progress" secondary onPress={() => router.push("/welcome")} />
      ) : t.completed ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14 }}>
          <Ionicons name="checkmark-circle" size={20} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>Completed</Text>
        </View>
      ) : (
        <Button title="Mark as done" loading={save.kind === "saving"} onPress={() => void markDone(t)} />
      )}
    </Screen>
  );
}
