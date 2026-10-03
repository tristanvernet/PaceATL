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

export default function ProfileScreen() {
  const router = useRouter();
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
        <Label>Account screens</Label>
        <Label secondary>
          Preview the shared account forms while Jacob prepares the database.
        </Label>
        <View style={{ gap: 12 }}>
          <Button title="View login" onPress={() => router.push("/login")} />
          <Button
            title="View signup"
            secondary
            onPress={() => router.push("/signup")}
          />
        </View>
      </Card>
      <Card>
        <Label>Achievements & preferences</Label>
        <Label secondary>
          Fitness preferences, earned rewards and sign-out will live here after
          their implementation.
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
      <Notice text="No user is signed in. This is an open development preview, not a protected account screen." />
    </Screen>
  );
}
