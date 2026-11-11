import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton, Button, Heading, ListGroup, Notice, Screen, SectionLabel } from "../../components/ui";
import { apiRequest, errorMessage } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { useResource } from "../../api/useResource";

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
  const { state, reload } = useResource<Portal>("/api/admin", async () => {
    const [reports, users] = await Promise.all([
      apiRequest<Report[]>("/api/admin/reports"),
      apiRequest<Person[]>("/api/admin/users"),
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
      setError(errorMessage(e, "Something went wrong."));
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

  return (
    <>
      {!!error && <Notice text={error} error />}
      <SectionLabel>{`Reports waiting · ${reports.length}`}</SectionLabel>
      {!reports.length ? (
        <Notice text="No reports waiting for review." />
      ) : (
        <ListGroup>
          {reports.map((r) => {
            const url = `/api/admin/reports/${r.id}`;
            return (
              <View key={r.id} style={{ padding: 14, gap: 10 }}>
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
        </ListGroup>
      )}

      <SectionLabel>{`Users · ${users.length}`}</SectionLabel>
      <ListGroup>
        {users.map((u) => {
          const url = `/api/admin/users/${u.id}`;
          const restricted = u.status === "restricted";
          return (
            <View key={u.id} style={{ padding: 14, gap: 10, flexDirection: "row", alignItems: "center" }}>
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
      </ListGroup>
    </>
  );
}
