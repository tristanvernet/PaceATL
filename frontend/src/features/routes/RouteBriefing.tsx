import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import { Card, Label, Button, Notice } from "../../components/ui";

type Briefing = {
  routeId: number;
  summary: string;
  terrain: string;
  highlights: string[];
  hazards: string[];
  tips: string[];
  facts: {
    distanceMiles: number;
    terrain: { climbFeet: number; steepestGradePercent: number } | null;
    highlights: unknown[] | null;
    weather: { temperature: number; aqi: number | null } | null;
  };
  generatedAt: string;
};

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Could not prepare the briefing.";
// MySQL-style UTC "YYYY-MM-DD HH:MM:SS", as in savedOn.
const updatedAt = (briefing: Briefing) =>
  new Date(`${briefing.generatedAt.replace(" ", "T")}Z`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

function Section({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <>
      <Label>{title}</Label>
      {items.length ? (
        items.map((item) => <Label key={item} secondary>• {item}</Label>)
      ) : (
        <Label secondary>{empty}</Label>
      )}
    </>
  );
}

/** AI briefing for one saved route. Remount (key by routeId) when the selection changes. */
export function RouteBriefing({ routeId }: { routeId: number }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function load() {
    controller.current = new AbortController();
    setLoading(true);
    setError("");
    try {
      // Gathering map data and writing the briefing can take up to a minute.
      setBriefing(
        await apiRequest<Briefing>(`/api/routes/${routeId}/briefing`, {
          method: "POST",
          signal: controller.current.signal,
          timeoutMs: 60000,
        }),
      );
    } catch (e) {
      if (!controller.current.signal.aborted) setError(message(e));
    } finally {
      if (!controller.current.signal.aborted) setLoading(false);
    }
  }

  if (!briefing)
    return (
      <Card>
        <Label>AI route briefing</Label>
        <Label secondary>
          Terrain, scenic highlights, reported hazards and current conditions, summarized before you go.
        </Label>
        {loading ? <Label secondary>Checking elevation, nearby places and weather…</Label> : null}
        {error ? <Notice text={error} error /> : null}
        <Button title={error ? "Try again" : "Get briefing"} loading={loading} onPress={load} />
      </Card>
    );

  const { facts } = briefing;
  const stats = [
    `${facts.distanceMiles.toFixed(2)} mi`,
    facts.terrain && `${facts.terrain.climbFeet} ft climb`,
    facts.terrain && `${facts.terrain.steepestGradePercent}% steepest`,
    facts.weather && `${facts.weather.temperature}°F`,
    facts.weather?.aqi != null && `AQI ${facts.weather.aqi}`,
  ].filter(Boolean);
  return (
    <Card>
      <Label>AI route briefing</Label>
      <Label secondary>{stats.join(" • ")}</Label>
      <Label secondary>{briefing.summary}</Label>
      {briefing.terrain ? (
        <>
          <Label>Terrain</Label>
          <Label secondary>{briefing.terrain}</Label>
        </>
      ) : null}
      <Section
        title="Scenic highlights"
        items={briefing.highlights}
        empty={facts.highlights === null ? "Map highlights are unavailable right now." : "No named parks or landmarks found nearby."}
      />
      <Section title="Reported hazards" items={briefing.hazards} empty="No hazards have been reported for this route." />
      <Section title="Before you go" items={briefing.tips} empty="No tips for this route." />
      <Label secondary>
        AI-generated at {updatedAt(briefing)} from map, elevation and weather data. Check conditions yourself before heading out.
      </Label>
    </Card>
  );
}
