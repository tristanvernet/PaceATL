import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];
type Slot =
  | { route: string; label: string; icon: keyof typeof Ionicons.glyphMap }
  | "log";

const BAR: Slot[] = [
  { route: "index", label: "Today", icon: "sunny-outline" },
  { route: "routes", label: "Routes", icon: "map-outline" },
  "log",
  { route: "coach", label: "Coach", icon: "chatbubble-outline" },
  { route: "you", label: "You", icon: "person-outline" },
];

function TabBar({ state, navigation }: TabBarProps) {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index]?.name;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingTop: 8,
        paddingHorizontal: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: c.background,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      {BAR.map((slot) => {
        if (slot === "log")
          return (
            <Pressable
              key="log"
              accessibilityRole="button"
              accessibilityLabel="Log activity"
              onPress={() => router.push("/log")}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 18,
                marginTop: -6,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.primary,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="add" size={28} color={c.onPrimary} />
            </Pressable>
          );
        const on = active === slot.route;
        const color = on ? c.text : c.muted;
        return (
          <Pressable
            key={slot.route}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={slot.label}
            onPress={() => {
              if (!on) navigation.navigate(slot.route);
            }}
            style={{ width: 56, alignItems: "center", gap: 3 }}
          >
            <Ionicons name={slot.icon} size={22} color={color} />
            <Text style={{ color, fontSize: 10, fontWeight: "600" }}>
              {slot.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const c = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="routes" options={{ title: "Routes" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
      <Tabs.Screen name="you" options={{ title: "You" }} />
    </Tabs>
  );
}
