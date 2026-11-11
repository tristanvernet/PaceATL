import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, ListGroup, ListRow, Notice, Button } from "../../components/ui";
import { fonts, useTheme } from "../../theme";
import { AppearanceSettings } from "../../features/appearance/AppearanceSettings";
import { useSession, type User } from "../../features/auth/SessionProvider";
import { useApi, type Load } from "../../api/useResource";
import { errorMessage } from "../../api/client";
import { SignInPrompt } from "../../features/auth/SignInPrompt";
import { DashboardCard } from "../../features/fitness/DashboardCard";
import type { Rewards } from "../../features/rewards/RewardsScreen";
import type { Share } from "../../features/fitness/SharesScreen";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
const detail = <T,>(state: Load<T>, format: (data: T) => string) =>
  state.status === "ready" ? format(state.data) : undefined;

export default function YouScreen() {
  const c = useTheme();
  const session = useSession();
  return (
    <Screen>
      {!session.ready ? (
        <Notice text="Checking your account…" />
      ) : session.user ? (
        <Account user={session.user} />
      ) : (
        <>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: fonts.heading, fontSize: 29, color: c.text, marginBottom: 16 }}
          >
            You
          </Text>
          {!!session.error && (
            <>
              <Notice text={session.error} error />
              <Button title="Retry session check" secondary onPress={() => void session.refresh()} />
            </>
          )}
          <SignInPrompt
            title="Make PaceATL yours"
            text="Track your workouts, earn achievements, and share progress with the community."
          />
        </>
      )}
      <AppearanceSettings />
      {session.user && <SignOutRow />}
    </Screen>
  );
}

function Account({ user }: { user: User }) {
  const c = useTheme();
  const router = useRouter();
  const admin = user.role === "admin";
  const rewards = useApi<Rewards>("/api/rewards/");
  const shares = useApi<Share[]>("/api/fitness/shares");
  const reports = useApi<unknown[]>(admin ? "/api/admin/reports" : null);
  const pending = reports.state.status === "ready" ? reports.state.data.length : 0;
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4, marginBottom: 18 }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: c.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c.onPrimary, fontSize: 18, fontWeight: "800" }}>{initials(user.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: c.text, fontFamily: fonts.heading, fontSize: 22 }}>
            {user.name}
          </Text>
          <Text style={{ color: c.muted, fontSize: 13 }}>{user.email}</Text>
        </View>
      </View>
      <DashboardCard />
      <ListGroup>
        <ListRow icon="list-outline" title="Activity history" onPress={() => router.push("/history")} />
        <ListRow
          icon="ribbon-outline"
          title="Achievements"
          detail={detail(rewards.state, (r) => `${r.achievements.filter((a) => a.unlocked).length} of ${r.achievements.length}`)}
          onPress={() => router.push("/achievements")}
        />
        <ListRow
          icon="share-social-outline"
          title="My shares"
          detail={detail(shares.state, (s) => String(s.filter((p) => p.isOwner).length))}
          onPress={() => router.push("/shares")}
        />
        {admin && (
          <ListRow
            icon="shield-outline"
            title="Admin portal"
            right={
              pending > 0 && (
                <View
                  accessibilityLabel={`${pending} reports waiting`}
                  style={{ backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}
                >
                  <Text style={{ color: c.onPrimary, fontSize: 10, fontWeight: "800" }}>{pending}</Text>
                </View>
              )
            }
            onPress={() => router.push("/admin")}
          />
        )}
      </ListGroup>
    </>
  );
}

function SignOutRow() {
  const session = useSession();
  const [state, setState] = useState<{ kind: "idle" } | { kind: "busy" } | { kind: "failed"; message: string }>({
    kind: "idle",
  });
  async function signOut() {
    setState({ kind: "busy" });
    try {
      await session.signOut();
      setState({ kind: "idle" });
    } catch (e) {
      setState({ kind: "failed", message: errorMessage(e, "Unable to sign out.") });
    }
  }
  return (
    <>
      <ListGroup>
        <ListRow
          icon="log-out-outline"
          title={state.kind === "busy" ? "Signing out…" : "Sign out"}
          onPress={state.kind === "busy" ? undefined : () => void signOut()}
        />
      </ListGroup>
      {state.kind === "failed" && (
        <>
          <Notice text={state.message} error />
          <Button title="Try again" secondary onPress={() => void signOut()} />
        </>
      )}
    </>
  );
}
