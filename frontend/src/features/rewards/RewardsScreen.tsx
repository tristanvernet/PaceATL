import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { apiRequest } from "../../api/client";
import { BackButton, Button, Card, Field, Heading, Label, Notice, Screen } from "../../components/ui";
import { useSession } from "../auth/SessionProvider";

type Achievement = { key: string; name: string; description: string; icon: string; unlocked: boolean; earnedAt: string | null };
type Rewards = { stats: { workoutCount: number; totalDistanceMiles: number; totalMinutes: number }; achievements: Achievement[] };
type ActivityResult = { unlocked: Array<{ key: string; name: string; description: string }> };

export function RewardsScreen() {
  const router = useRouter(); const { user, ready } = useSession();
  const [data,setData]=useState<Rewards|null>(null); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [distance,setDistance]=useState("1"); const [minutes,setMinutes]=useState("20"); const [loading,setLoading]=useState(false);
  async function load(){ if(!user)return; setLoading(true); setError(""); try{setData(await apiRequest<Rewards>("/api/rewards/"));}catch(e){setError(e instanceof Error?e.message:"Could not load achievements.");}finally{setLoading(false);} }
  useEffect(()=>{
    const controller = new AbortController();
    setData(null); setError(""); setNotice("");
    if (!ready || !user) return () => controller.abort();
    setLoading(true);
    apiRequest<Rewards>("/api/rewards/", {signal: controller.signal})
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load achievements."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  },[ready,user?.id]);
  async function addTestWorkout(){
    const d=Number(distance), m=Number(minutes); setError(""); setNotice("");
    if(!Number.isFinite(d)||d<0||d>500){setError("Distance must be between 0 and 500 miles.");return;}
    if(!Number.isFinite(m)||m<1||m>1440){setError("Duration must be between 1 and 1440 minutes.");return;}
    setLoading(true); try{
      const result=await apiRequest<ActivityResult>("/api/rewards/activity",{method:"POST",body:JSON.stringify({activityType:"run",distanceMiles:d,durationMinutes:m})});
      setNotice(result.unlocked.length ? `New Achievement Unlocked: ${result.unlocked.map(x=>x.name).join(", ")}` : "Workout added. Keep going toward your next achievement!");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Workout could not be added.");}finally{setLoading(false);}
  }
  return <Screen><BackButton/><Heading eyebrow="Rewards" title="My Achievements" subtitle="Build consistency and unlock badges as you record activity."/>
    {!ready ? <Notice text="Checking your account…"/> : !user ? <Card><Label>Sign in required</Label><Label secondary>Achievements are saved to your PaceATL account.</Label><Button title="Log in" onPress={()=>router.push("/login")}/></Card> : <>
      {notice && <Notice text={notice}/>} {error && <Notice text={error} error/>}
      <Card><Label>Your progress</Label><Label secondary>{data ? `${data.stats.workoutCount} workouts • ${data.stats.totalDistanceMiles.toFixed(2)} miles • ${data.stats.totalMinutes} minutes` : "Loading progress…"}</Label></Card>
      {data?.achievements.map(a=><Card key={a.key}><Label>{a.unlocked ? "✓ " : "○ "}{a.name}</Label><Label secondary>{a.description}{a.unlocked && a.earnedAt ? ` Unlocked ${new Date(a.earnedAt).toLocaleDateString()}.` : ""}</Label></Card>)}
      <Card><Label>Test the reward system</Label><Label secondary>Add a sample completed run. This writes a real test activity to your account so the full screen → API → database → badge flow can be verified.</Label><Field label="Distance in miles" keyboardType="decimal-pad" value={distance} onChangeText={setDistance}/><Field label="Duration in minutes" keyboardType="number-pad" value={minutes} onChangeText={setMinutes}/><Button title="Add sample workout" loading={loading} onPress={addTestWorkout}/></Card>
    </>}
  </Screen>;
}
