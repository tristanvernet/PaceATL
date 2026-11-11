import { Pressable, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeroButton, column, useLeave } from "../../components/ui";
import { fonts, useTheme } from "../../theme";
import { useSession } from "./SessionProvider";

// Arcs cut from bordered circles stand in for the mockup's route lines, so the
// hero needs no SVG dependency.
const ARCS = [
  { size: 520, left: -250, top: 60, width: 5, opacity: 1 },
  { size: 360, left: 150, top: -40, width: 5, opacity: 1 },
  { size: 640, left: -160, top: 150, width: 2, opacity: 0.4 },
] as const;

export default function WelcomeScreen() {
  const c = useTheme();
  const router = useRouter();
  const { user } = useSession();
  const leave = useLeave();
  if (user) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.hero }}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        {ARCS.map((arc, i) => (
          <View
            key={i}
            style={{
              pointerEvents: "none",
              position: "absolute",
              width: arc.size,
              height: arc.size,
              left: arc.left,
              top: arc.top,
              borderRadius: arc.size / 2,
              borderWidth: arc.width,
              borderColor: "transparent",
              borderTopColor: c.heroAccent,
              borderRightColor: i === 1 ? "transparent" : c.heroAccent,
              opacity: arc.opacity,
              transform: [{ rotate: i === 1 ? "-35deg" : "-20deg" }],
            }}
          />
        ))}
      </View>
      <View style={[column, { paddingHorizontal: 24, paddingBottom: 30 }]}>
        <Text style={{ color: c.heroAccent, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 }}>
          PACEATL
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            color: c.heroText,
            fontFamily: fonts.heading,
            fontSize: 32,
            lineHeight: 36,
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          Move through Atlanta at your own pace.
        </Text>
        <Text style={{ color: c.heroMuted, fontSize: 14, lineHeight: 21, marginBottom: 22 }}>
          Routes, daily challenges, and a coach that knows your week.
        </Text>
        <HeroButton title="Create account" onPress={() => router.push("/signup")} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/login")}
          style={({ pressed }) => ({ padding: 14, marginTop: 6, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: c.heroText, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
            I have an account
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={leave}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: c.heroMuted, fontSize: 13, textAlign: "center" }}>
            Browse without an account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
