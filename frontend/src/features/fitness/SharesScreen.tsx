import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, errorMessage } from "../../api/client";
import { BackButton, Button, Field, Heading, Notice, Screen, SegmentedControl } from "../../components/ui";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { SignInPrompt } from "../auth/SignInPrompt";
import { useApi } from "../../api/useResource";

type Kind = "route" | "workout" | "goal";
type Unit = "miles" | "minutes" | "workouts";
type Source = { id: number; name: string; distanceMiles?: number };
type Sources = { routes: Source[]; workouts: Source[] };
export type Share = {
  id: number;
  kind: Kind;
  title: string;
  author: string;
  isOwner: boolean;
  target: number | null;
  unit: Unit | null;
  routeName: string | null;
  distanceMeters: number | null;
  activityType: string | null;
  distanceMiles: number | null;
  durationMinutes: number | null;
};

const KINDS = [
  { value: "route", label: "Route" },
  { value: "workout", label: "Workout" },
  { value: "goal", label: "Goal" },
] as const;
const UNITS = [
  { value: "miles", label: "Miles" },
  { value: "minutes", label: "Minutes" },
  { value: "workouts", label: "Workouts" },
] as const;
const DESCRIBE: Record<Kind, (s: Share) => string> = {
  goal: (s) => `Goal · ${s.target} ${s.unit}`,
  route: (s) => `Route · ${s.routeName} · ${((s.distanceMeters ?? 0) / 1609.344).toFixed(1)} mi`,
  workout: (s) => `Workout · ${s.activityType} · ${s.distanceMiles} mi · ${s.durationMinutes} min`,
};
const sourceLabel = (s: Source) =>
  `${s.name[0]!.toUpperCase()}${s.name.slice(1)}${s.distanceMiles != null ? ` · ${s.distanceMiles} mi` : ""}`;

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "done"; message: string } | { kind: "failed"; message: string };

export default function SharesScreen() {
  const { ready, user } = useSession();
  return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow="Community"
        title="Shares"
        subtitle="Share a route, workout, or goal with other PaceATL members."
      />
      {!ready ? (
        <Notice text="Checking your account…" />
      ) : user ? (
        <Community />
      ) : (
        <SignInPrompt title="Join the community" text="Sign in to see what others share and post your own progress." />
      )}
    </Screen>
  );
}

function Community() {
  const c = useTheme();
  const shares = useApi<Share[]>("/api/fitness/shares");
  const sources = useApi<Sources>("/api/fitness/sources");
  const [kind, setKind] = useState<Kind>("route");
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState<Unit>("miles");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function publish() {
    setStatus({ kind: "busy" });
    try {
      await apiRequest("/api/fitness/shares", {
        method: "POST",
        body: JSON.stringify({ kind, title, sourceId, target: target.trim() ? Number(target) : null, unit }),
      });
      setTitle("");
      setTarget("");
      setSourceId(null);
      setStatus({ kind: "done", message: "Shared with the community." });
      shares.reload();
    } catch (e) {
      setStatus({ kind: "failed", message: errorMessage(e, "Could not share.") });
    }
  }
  async function remove(id: number) {
    setStatus({ kind: "busy" });
    try {
      await apiRequest(`/api/fitness/shares/${id}`, { method: "DELETE" });
      if (shares.state.status === "ready") shares.set(shares.state.data.filter((s) => s.id !== id));
      setStatus({ kind: "done", message: "Share removed. The original item is kept." });
    } catch (e) {
      setStatus({ kind: "failed", message: errorMessage(e, "Could not remove share.") });
    }
  }

  const busy = status.kind === "busy";
  const choices = sources.state.status === "ready" ? sources.state.data[kind === "route" ? "routes" : "workouts"] : [];
  const sectionLabel = { color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, margin: 4, marginBottom: 8 } as const;
  const panel = { backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, borderRadius: 16, marginBottom: 14 } as const;

  return (
    <>
      <Text style={sectionLabel}>NEW SHARE</Text>
      <View style={[panel, { padding: 14, gap: 14 }]}>
        <SegmentedControl
          label="What to share"
          options={KINDS}
          value={kind}
          onChange={(next) => {
            setKind(next);
            setSourceId(null);
          }}
        />
        <Field label="Title" value={title} onChangeText={setTitle} maxLength={120} placeholder="Sunday long run" style={{ backgroundColor: c.background }} />
        {kind === "goal" ? (
          <>
            <Field
              label="Target"
              keyboardType="decimal-pad"
              value={target}
              onChangeText={setTarget}
              placeholder="20"
              style={{ backgroundColor: c.background }}
            />
            <SegmentedControl label="Goal unit" options={UNITS} value={unit} onChange={setUnit} />
          </>
        ) : sources.state.status === "loading" ? (
          <Notice text="Loading your saved items…" />
        ) : sources.state.status === "error" ? (
          <Notice text={sources.state.message} error />
        ) : !choices.length ? (
          <Notice text={kind === "route" ? "Save a route first to share it." : "Log a workout first to share it."} />
        ) : (
          <View accessibilityRole="radiogroup" accessibilityLabel={`Choose a ${kind}`} style={{ gap: 6 }}>
            {choices.map((item) => {
              const on = sourceId === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  aria-checked={on}
                  onPress={() => setSourceId(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: on ? c.primary : c.border,
                    backgroundColor: on ? c.soft : c.background,
                  }}
                >
                  <Ionicons
                    name={on ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={on ? c.primary : c.muted}
                  />
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>{sourceLabel(item)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Button
          title="Publish"
          loading={busy}
          disabled={!title.trim() || (kind === "goal" ? !target.trim() : !sourceId)}
          onPress={() => void publish()}
        />
      </View>
      {(status.kind === "done" || status.kind === "failed") && (
        <Notice text={status.message} error={status.kind === "failed"} />
      )}

      <Text style={sectionLabel}>COMMUNITY FEED</Text>
      {shares.state.status === "loading" ? (
        <Notice text="Loading shares…" />
      ) : shares.state.status === "error" ? (
        <>
          <Notice text={shares.state.message} error />
          <Button title="Try again" secondary onPress={shares.reload} />
        </>
      ) : !shares.state.data.length ? (
        <Notice text="No one has shared anything yet. Be the first." />
      ) : (
        <View style={panel}>
          {shares.state.data.map((s, i) => (
            <View
              key={s.id}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderColor: c.border }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: c.primary, fontSize: 11, fontWeight: "800" }}>
                  {s.author.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>{s.title}</Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {s.isOwner ? "You" : s.author} · {DESCRIBE[s.kind](s)}
                </Text>
              </View>
              {s.isOwner && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${s.title}`}
                  disabled={busy}
                  onPress={() => void remove(s.id)}
                  style={({ pressed }) => ({ padding: 6, opacity: busy ? 0.4 : pressed ? 0.6 : 1 })}
                >
                  <Ionicons name="trash-outline" size={18} color={c.muted} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </>
  );
}
