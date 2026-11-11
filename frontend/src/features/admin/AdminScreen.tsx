import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton, Button, Heading, Notice, Screen } from "../../components/ui";
import { apiRequest } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { useResource } from "../auth/useResource";

type Person = { id: number; name: string; email: string; role: string; status: string };
type Report = { id: number; title: string; category: string; description: string | null; reporter: string | null };
type Portal = { reports: Report[]; users: Person[] };

export default function AdminScreen() {
  const { ready, user } = useSession();
  return (
    <Screen>
      <BackButton />
      <Heading eyebrow="Admin" title="Admin portal" subtitle="Review hazard reports and manage accounts." />
      {!ready ? <Notice text="Checking your account…" /> : user?.role === "admin" ? <Portal /> : <Notice text="Admin only." error />}
    </Screen>
  );
}

function Portal() {
  const c = useTheme();
  const { state, reload } = useResource<Portal>("admin", async (signal) => {
    const [reports, users] = await Promise.all([
      apiRequest<Report[]>("/api/admin/reports", { signal }),
      apiRequest<Person[]>("/api/admin/users", { signal }),
    ]);
    return { reports, users };
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function send(url: string, body: object) {
    setBusy(url);
    setError("");
    try {
      await apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (state.status === "loading") return <Notice text="Loading admin info…" />;
  if (state.status === "error")
    return (
      <>
        <Notice text={state.message} error />
        <Button title="Try again" onPress={reload} />
      </>
    );
  const { reports, users } = state.data;
  const sectionLabel = { color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, margin: 4, marginBottom: 8 } as const;
  const panel = { backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, borderRadius: 16, marginBottom: 18 } as const;
  const row = (i: number) => ({ padding: 14, gap: 10, borderTopWidth: i ? 1 : 0, borderColor: c.border });

  return (
    <>
      {!!error && <Notice text={error} error />}
      <Text style={sectionLabel}>REPORTS WAITING · {reports.length}</Text>
      {!reports.length ? (
        <Notice text="No reports waiting for review." />
      ) : (
        <View style={panel}>
          {reports.map((r, i) => {
            const url = `/api/admin/reports/${r.id}`;
            return (
              <View key={r.id} style={row(i)}>
                <View style={{ gap: 3 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{r.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {r.category} · from {r.reporter ?? "unknown"}
                  </Text>
                  {!!r.description && <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>{r.description}</Text>}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Approve" loading={busy === url} disabled={!!busy} onPress={() => void send(url, { decision: "approved" })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Reject" secondary disabled={!!busy} onPress={() => void send(url, { decision: "rejected" })} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={sectionLabel}>USERS · {users.length}</Text>
      <View style={panel}>
        {users.map((u, i) => {
          const url = `/api/admin/users/${u.id}`;
          const restricted = u.status === "restricted";
          return (
            <View key={u.id} style={[row(i), { flexDirection: "row", alignItems: "center" }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>{u.name}</Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {u.email} · {u.role}
                  {restricted ? " · restricted" : ""}
                </Text>
              </View>
              {u.role !== "admin" && (
                <Button
                  title={restricted ? "Restore" : "Restrict"}
                  secondary
                  loading={busy === url}
                  disabled={!!busy}
                  onPress={() => void send(url, { status: restricted ? "active" : "restricted" })}
                />
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}
