import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HeroButton } from "./HeroButton";
import { useTheme } from "../../theme";

export function SignInPrompt({ title, text }: { title: string; text: string }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        padding: 18,
        gap: 12,
        borderRadius: 20,
        backgroundColor: c.hero,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="lock-closed-outline" size={16} color={c.heroAccent} />
        <Text style={{ color: c.heroAccent, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 }}>
          PACEATL ACCOUNT
        </Text>
      </View>
      <Text style={{ color: c.heroText, fontSize: 17, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: c.heroMuted, fontSize: 13, lineHeight: 19 }}>{text}</Text>
      <HeroButton title="Sign in or create account" onPress={() => router.push("/welcome")} />
    </View>
  );
}
