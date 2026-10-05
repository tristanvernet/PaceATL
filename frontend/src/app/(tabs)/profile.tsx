import { useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";
import {
  Screen,
  Heading,
  Card,
  Label,
  Button,
  Notice,
} from "../../components/ui";
import { apiRequest } from "../../api/client";
import { useSession } from "../../features/auth/SessionProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  async function logout() {
    setSigningOut(true); setAuthError("");
    try { await session.signOut(); }
    catch (e) { setAuthError(e instanceof Error ? e.message : "Unable to log out."); }
    finally { setSigningOut(false); }
  }
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  async function checkBackend() {
    const controller = new AbortController();
    pending.current?.abort();
    pending.current = controller;
    setLoading(true);
    setStatus("");
    try {
      const health = await apiRequest<{ status: string; service: string }>(
        "/api/health",
        { signal: controller.signal },
      );
      if (!controller.signal.aborted)
        setStatus(
          health.status === "ok"
            ? `${health.service} backend is reachable. This checks connectivity only, not database access.`
            : "The backend reported an unexpected status.",
        );
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof Error ? error.message : "Connection failed.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  return (
    <Screen>
      <Heading eyebrow="Your account" title="Your pace. Your profile." />
      <Card>
        <Label>{session.user ? `Welcome, ${session.user.name}` : "Your account"}</Label>
        {session.user ? <>
          <Label secondary>{session.user.email}</Label>
          <Button title="Log out" loading={signingOut} onPress={logout} />
        </> : <View style={{ gap: 12 }}>
          <Button title="Log in" disabled={!session.ready} onPress={() => router.push("/login")} />
          <Button
            title="Sign up"
            secondary
            onPress={() => router.push("/signup")}
          />
        </View>}
        {(authError || session.error) && <Notice text={authError || session.error} error />}
        {session.error && <Button title="Retry session check" onPress={() => { void session.refresh(); }} />}
      </Card>
      <Card>
        <Label>Achievements & preferences</Label>
        <Button title="My Achievements" onPress={() => router.push("/achievements")} />
        <Label secondary>
          View the badges you earn as you record activity.
        </Label>
      </Card>
      <Card>
        <Label>Development connection check</Label>
        <Label secondary>
          Tests the shared API connection without needing a database.
        </Label>
        <Button
          title="Check backend connection"
          secondary
          loading={loading}
          onPress={checkBackend}
        />
        {status && <Notice text={status} />}
      </Card>
    </Screen>
  );
}
