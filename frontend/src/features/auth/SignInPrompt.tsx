import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Hero, HeroButton } from "../../components/ui";
import { useTheme } from "../../theme";

export function SignInPrompt({ title, text }: { title: string; text: string }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View style={{ marginBottom: 14 }}>
      <Hero icon="lock-closed-outline" kicker="PACEATL ACCOUNT" title={title}>
        <Text style={{ color: c.heroMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>{text}</Text>
        <HeroButton title="Sign in or create account" onPress={() => router.push("/welcome")} />
      </Hero>
    </View>
  );
}
