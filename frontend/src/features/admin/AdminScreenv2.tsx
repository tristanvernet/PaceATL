import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Screen, Heading, Card, Label, Button, Notice } from "../../components/ui";
import { apiRequest } from "../../api/client";
import { useSession } from "../auth/SessionProvider";

type Person = { id: number; name: string; email: string; role: string; status: string };
type Report = { id: number; title: string; category: string; description: string | null; reporter: string | null };

export default function Admin() {
    const router = useRouter();
    const { user, signOut } = useSession();
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<Person[]>([]);
    const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setReports(await apiRequest<Report[]>("/api/admin/reports"));
      setUsers(await apiRequest<Person[]>("/api/admin/users"));} catch (e) {
      setError(e instanceof Error ? 
        e.message : "Could not load admin info.");
    }
  }
    useEffect(() => {
    load();
  }, []);
    async function send(url: string, body: object) {
    try {await apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }
    async function logout() {
        await signOut();
        router.replace("/");
  }

  if (user?.role !== "admin")
    return (
      <Screen>
        <Notice text="Admin only." error />
      </Screen>
    );

  return (
    <Screen>
      <Heading eyebrow="Admin" title="Admin portal" />
      <Button title="Log out" secondary onPress={logout} />
      {error ? <Notice text={error} error /> : null}

      <Label>Reports waiting for review</Label>
      {reports.length === 0 && <Notice text="No reports waiting for review." />}
      {reports.map((r) => (
        <Card key={r.id}>
          <Label>{r.title}</Label>
            <Label 
            secondary>{r.category} · from {r.reporter ?? "unknown"}{r.description ? ` · ${r.description}` : ""}</Label>          <Button title="Approve" onPress={() => send(`/api/admin/reports/${r.id}`, { decision: "approved" })} />
          <Button title="Reject" secondary onPress={() => send(`/api/admin/reports/${r.id}`, { decision: "rejected" })} />
        </Card>
      ))}

      <Label>Users</Label>
      {users.map((u) => (
        <Card key={u.id}>
          <Label>{u.name}</Label>
          <Label secondary>{u.email} · {u.role} · {u.status}</Label>
          {u.role !== "admin" && (
            <Button
              title={u.status === "restricted" ? "Restore account" : "Restrict account"}
              secondary
              onPress={() =>
                send(`/api/admin/users/${u.id}`, { status: u.status === "restricted" ? "active" : "restricted" })
              }
            />
          )}
        </Card>
      ))}
    </Screen>
  );
}