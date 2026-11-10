import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { apiRequest } from "../../api/client";
import { BackButton, Button, Card, Heading, Label, Notice, Screen } from "../../components/ui";
import { useTheme } from "../../theme";
import { HotspotMap } from "./HotspotMap";
export type Hotspot = { id: string; name: string; latitude: number; longitude: number; activities: string[]; description: string };
type Result = { hotspots: Hotspot[]; sourceConfigured: boolean; message: string | null };
const filters = ["all", "run", "walk", "cycle"] as const;
export function HotspotMapScreen() {
  const c = useTheme(); const [activity, setActivity] = useState<string>("all");
  const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null); const [reload, setReload] = useState(0);
  useEffect(() => { const controller = new AbortController(); setError(""); setResult(null); setSelected(null);
    apiRequest<Result>(`/api/hotspots?activity=${encodeURIComponent(activity)}`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Hotspot data is unavailable."); });
    return () => controller.abort(); }, [activity, reload]);
  const chosen = result?.hotspots.find(item => item.id === selected);
  return <Screen><BackButton/><Heading eyebrow="Explore Atlanta" title="Hotspot Map" subtitle="Explore activity hotspots from the configured popularity data source."/>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {filters.map(value => <Pressable key={value} onPress={() => setActivity(value)} style={{ padding: 10, borderRadius: 10, backgroundColor: activity === value ? c.primary : c.soft }}><Text style={{ color: activity === value ? c.onPrimary : c.text }}>{value === "all" ? "All" : value === "run" ? "Running" : value === "walk" ? "Walking" : "Cycling"}</Text></Pressable>)}
    </View>
    <HotspotMap hotspots={result?.hotspots || []} onSelect={setSelected}/>
    {error ? <Notice text={error} error/> : null}
    {result?.message ? <Notice text={result.message}/> : null}
    {chosen ? <Card><Label>{chosen.name}</Label><Label secondary>{chosen.activities.join(", ")}</Label><Label secondary>{chosen.description || "No additional details provided."}</Label></Card> : null}
    {result?.hotspots.map(item => <Pressable key={item.id} onPress={() => setSelected(item.id)}><Card><Label>{item.name}</Label><Label secondary>{item.activities.join(", ")}</Label></Card></Pressable>)}
    <Button title="Refresh hotspots" onPress={() => setReload(value => value + 1)}/>
  </Screen>;
}
