import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Loaded, Notice } from "../../components/ui";
import { apiRequest } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { useResource } from "../../api/useResource";
import { categoryIcon, type Tutorial, type TutorialSummary } from "./types";

type Library = { tutorials: TutorialSummary[]; completed: Set<string> | null };

// The list endpoint has no completion state, so signed-in users fetch each
// tutorial's detail for it. The catalog is a handful of rows.
async function loadLibrary(signedIn: boolean): Promise<Library> {
  const tutorials = await apiRequest<TutorialSummary[]>("/api/tutorials");
  if (!signedIn) return { tutorials, completed: null };
  const details = await Promise.all(
    tutorials.map((t) =>
      apiRequest<Tutorial>(`/api/tutorials/${encodeURIComponent(t.tutId)}`),
    ),
  );
  return {
    tutorials,
    completed: new Set(details.filter((d) => d.completed).map((d) => d.tutId)),
  };
}

export function TutorialLibrary() {
  const c = useTheme();
  const router = useRouter();
  const { user } = useSession();
  const { state, reload } = useResource("/api/tutorials#library", () =>
    loadLibrary(!!user),
  );
  const [filter, setFilter] = useState<string | null>(null);
  const open = (id: string) =>
    router.push({ pathname: "/tutorials/[id]", params: { id } });

  return (
    <Loaded state={state} reload={reload} loading="Loading tutorials…">
      {(data) => {
        const { tutorials, completed } = data;
        if (!tutorials.length)
          return <Notice text="No tutorials are available yet." />;
        const categories = [...new Set(tutorials.map((t) => t.category))];
        const start =
          tutorials.find((t) => !completed?.has(t.tutId)) ?? tutorials[0];
        const shown = filter
          ? tutorials.filter((t) => t.category === filter)
          : tutorials;
        const done = completed?.size ?? 0;

        return (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Start here: ${start.title}`}
              onPress={() => open(start.tutId)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 18,
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
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    color: c.heroAccent,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  {completed && done === tutorials.length
                    ? "WATCH AGAIN"
                    : "START HERE"}
                </Text>
                <Text
                  style={{ color: c.heroText, fontSize: 15, fontWeight: "700" }}
                >
                  {start.title}
                </Text>
                <Text style={{ color: c.heroMuted, fontSize: 12 }}>
                  {start.videoUrl ? "Video · " : ""}
                  {start.estimatedDurationMins} min
                </Text>
              </View>
            </Pressable>

            {completed && (
              <View style={{ marginTop: 14, gap: 6 }}>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {done} of {tutorials.length} completed
                </Text>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: c.border,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(done / tutorials.length) * 100}%`,
                      borderRadius: 3,
                      backgroundColor: c.primary,
                    }}
                  />
                </View>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginTop: 14, marginBottom: 4 }}
              contentContainerStyle={{ gap: 6 }}
            >
              {[null, ...categories].map((category) => {
                const on = filter === category;
                return (
                  <Pressable
                    key={category ?? "all"}
                    accessibilityRole="radio"
                    aria-checked={on}
                    onPress={() => setFilter(category)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 11,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: on ? c.primary : c.border,
                      backgroundColor: on ? c.primary : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: on ? c.onPrimary : c.muted,
                      }}
                    >
                      {category ?? "All"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {shown.map((t, i) => {
              const isDone = completed?.has(t.tutId);
              return (
                <Pressable
                  key={t.tutId}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.title}, ${t.category}, ${t.estimatedDurationMins} minutes${isDone ? ", completed" : ""}`}
                  onPress={() => open(t.tutId)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 11,
                    borderTopWidth: i ? 1 : 0,
                    borderColor: c.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: c.soft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={categoryIcon(t.category)}
                      size={19}
                      color={c.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{ color: c.text, fontSize: 14, fontWeight: "700" }}
                    >
                      {t.title}
                    </Text>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      {t.category} · {t.estimatedDurationMins} min
                    </Text>
                  </View>
                  {completed && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDone ? c.primary : "transparent",
                        borderWidth: isDone ? 0 : 1.5,
                        borderColor: c.border,
                      }}
                    >
                      {isDone && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={c.onPrimary}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </>
        );
      }}
    </Loaded>
  );
}
