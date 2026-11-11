import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Hero, HeroButton } from "./ui";
import { useTheme } from "../theme";

/** Points a signed-out user to /welcome. `compact` fits inside a map sheet, where a hero card is too heavy. */
export function SignInPrompt(props: { title: string; text?: string } | { compact: true; text: string }) {
  const c = useTheme();
  const router = useRouter();
  const signIn = () => router.push("/welcome");
  if ("compact" in props)
    return (
      <View style={{ gap: 10, paddingVertical: 6 }}>
        <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>{props.text}</Text>
        <Button title="Sign in" onPress={signIn} />
      </View>
    );
  return (
    <View style={{ marginBottom: 14 }}>
      <Hero icon="lock-closed-outline" kicker="PACEATL ACCOUNT" title={props.title}>
        {props.text ? (
          <Text style={{ color: c.heroMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>{props.text}</Text>
        ) : null}
        <HeroButton title="Sign in or create account" onPress={signIn} />
      </Hero>
    </View>
  );
}
