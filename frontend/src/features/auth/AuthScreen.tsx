import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { validateAuth } from "./validation";
import {
  Screen,
  Heading,
  BackButton,
  Field,
  Button,
  Notice,
} from "../../components/ui";
import { useTheme } from "../../theme";
import { apiRequest } from "../../api/client";
import { useSession, type SignInResult } from "./SessionProvider";

export default function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const c = useTheme();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  function change(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setNotice("");
  }
  async function submit() {
    const next = validateAuth(values, mode);
    setErrors(next);
    if (Object.keys(next).length) { setNotice("Check the highlighted fields."); return; }
    setLoading(true); setNotice("");
    try {
      const result = await apiRequest<SignInResult>(`/api/auth/${mode}`, {
        method: "POST", body: JSON.stringify(values),
      });
      await session.signIn(result);
      setValues({ name: "", email: "", password: "", confirmPassword: "" });
      router.replace("/profile");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }
  return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow="Your account"
        title={mode === "signup" ? "Create your account" : "Welcome back"}
        subtitle={mode === "signup" ? "Save your progress with a PaceATL account." : "Sign in to keep track of your tutorials."}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
        {mode === "signup" && (
          <Field
            label="Confirm password"
            value={values.confirmPassword}
            onChangeText={(v) => change("confirmPassword", v)}
            error={errors.confirmPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
        )}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: visible }}
          onPress={() => setVisible(!visible)}
          style={{ minHeight: 44, justifyContent: "center", marginBottom: 12 }}
        >
          <Text style={{ color: c.text }}>
            {visible ? "☑" : "☐"} Show password
          </Text>
        </Pressable>
        <Button
          title={mode === "signup" ? "Sign up" : "Log in"}
          onPress={submit}
          loading={loading}
          disabled={!session.ready}
        />
        {notice && (
          <Notice
            text={notice}
            error
          />
        )}
        <Button
          title={mode === "signup" ? "View login screen" : "View signup screen"}
          secondary
          onPress={() =>
            router.replace(mode === "signup" ? "/login" : "/signup")
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
