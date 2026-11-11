import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton, Button, Heading, ListGroup, Loaded, Notice, Screen, SectionLabel } from "../../components/ui";
import { apiRequest, errorMessage } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { useApi } from "../../api/useResource";

type Person = { id: number; name: string; email: string; role: string; status: string };
type Report = { id: number; title: string; category: string; description: string | null; reporter: string | null };

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
  const reportsLoad = useApi<Report[]>("/api/admin/reports");
  const usersLoad = useApi<Person[]>("/api/admin/users");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function send(url: string, body: object, reload: () => void) {
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

  return (
    <>
      {!!error && <Notice text={error} error />}
      <Loaded state={reportsLoad.state} reload={reportsLoad.reload} loading="Loading reports…">
        {(reports) => (
          <>
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
                          <Button title="Approve" loading={busy === url} disabled={!!busy} onPress={() => void send(url, { decision: "approved" }, reportsLoad.reload)} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button title="Reject" secondary disabled={!!busy} onPress={() => void send(url, { decision: "rejected" }, reportsLoad.reload)} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ListGroup>
            )}
          </>
        )}
      </Loaded>
      <Loaded state={usersLoad.state} reload={usersLoad.reload} loading="Loading users…">
        {(users) => (
          <>
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
                        onPress={() => void send(url, { status: restricted ? "active" : "restricted" }, usersLoad.reload)}
                      />
                    )}
                  </View>
                );
              })}
            </ListGroup>
          </>
        )}
      </Loaded>
    </>
  );
}
