import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { apiRequest } from "../../api/client";
import { BackButton, Button, Card, Heading, Label, Notice, Screen } from "../../components/ui";
import { useSession } from "../auth/SessionProvider";

type Challenge = { challengeId: number; challengeDate: string; title: string; activityType: string; metric: "miles" | "minutes" | "workouts"; target: number };
type Result = { challenge: Challenge | null; progress?: number; completed?: boolean; message?: string };
export function DailyChallengeScreen() {
  const { user, ready } = useSession(); const router = useRouter();
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try { setData(await apiRequest<Result>("/api/challenges/today")); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load today's challenge."); }
    finally { setLoading(false); }
  }, [user?.id]);
  useEffect(() => { if (ready && user) void load(); else setData(null); }, [ready, user?.id, load]);
  return <Screen><BackButton/><Heading eyebrow="Daily fitness" title="Today's Challenge" subtitle="Complete the goal by logging qualifying workouts for today's date."/>
    {!ready ? <Notice text="Checking your account…"/> : !user ? <Card><Label>Sign in to see your daily challenge.</Label><Button title="Log in" onPress={() => router.push("/login")}/></Card> : <>
      {error ? <Notice text={error} error/> : null}
      {data?.challenge ? <Card><Label>{data.challenge.title}</Label>
        <Label secondary>{data.challenge.activityType === "any" ? "Any activity" : data.challenge.activityType} · {data.challenge.challengeDate}</Label>
        <Label>{data.progress ?? 0} / {data.challenge.target} {data.challenge.metric}</Label>
        <Label>{data.completed ? "Completed" : "In progress"}</Label>
        <Button title="Record workout" onPress={() => router.push("/workouts")}/>
      </Card> : data ? <Notice text={data.message || "No challenge available."}/> : null}
      <Button title="Refresh progress" loading={loading} onPress={load}/>
    </>}
  </Screen>;
}
