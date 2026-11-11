import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { validateAuth } from "./validation";
import { Screen, Heading, BackButton, Field, Button, Notice } from "../../components/ui";
import { useTheme } from "../../theme";
import { apiRequest } from "../../api/client";
import { useSession, type SignInResult } from "./SessionProvider";

type Mode = "login" | "signup";
const COPY: Record<
  Mode,
  { title: string; subtitle: string; submit: string; switchText: string; switchLink: string; other: Mode }
> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to pick up your week, routes, and coach.",
    submit: "Sign in",
    switchText: "New to PaceATL?",
    switchLink: "Create account",
    other: "signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Save workouts, routes, and progress across devices.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLink: "Sign in",
    other: "login",
  },
};

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const c = useTheme();
  const session = useSession();
  const copy = COPY[mode];
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  function change(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    // Drop the key rather than store "": Field renders an empty error string as a stray text node.
    setErrors(({ [key]: _, ...rest }) => rest);
    setNotice("");
  }
  async function submit() {
    const next = validateAuth(values, mode);
    setErrors(next);
    if (Object.keys(next).length) {
      setNotice("Check the highlighted fields.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const result = await apiRequest<SignInResult>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      await session.signIn(result);
      setValues({ name: "", email: "", password: "", confirmPassword: "" });
      router.replace("/");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }
  const password = { secureTextEntry: !visible, autoCapitalize: "none", autoCorrect: false, autoComplete: "off" } as const;
  return (
    <Screen>
      <BackButton />
      <Heading eyebrow="PaceATL" title={copy.title} subtitle={copy.subtitle} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {mode === "signup" && (
          <Field
            label="Name"
            value={values.name}
            onChangeText={(v) => change("name", v)}
            error={errors.name}
            autoComplete="name"
            maxLength={100}
          />
        )}
        <Field
          label="Email"
          value={values.email}
          onChangeText={(v) => change("email", v)}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          autoCorrect={false}
          maxLength={254}
        />
        <Field
          label="Password"
          value={values.password}
          onChangeText={(v) => change("password", v)}
          error={errors.password}
          {...password}
        />
        {mode === "signup" && (
          <Field
            label="Confirm password"
            value={values.confirmPassword}
            onChangeText={(v) => change("confirmPassword", v)}
            error={errors.confirmPassword}
            {...password}
          />
        )}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: visible }}
          onPress={() => setVisible(!visible)}
          style={{ minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}
        >
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color={c.muted} />
          <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600" }}>
            {visible ? "Hide password" : "Show password"}
          </Text>
        </Pressable>
        {!!notice && <Notice text={notice} error />}
        <Button title={copy.submit} onPress={submit} loading={loading} disabled={!session.ready} />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 }}>
          <Text style={{ color: c.muted, fontSize: 14 }}>{copy.switchText}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace(`/${copy.other}`)}>
            <Text style={{ color: c.primary, fontSize: 14, fontWeight: "700" }}>{copy.switchLink}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
