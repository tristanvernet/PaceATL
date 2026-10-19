import {useEffect, useState} from "react";
import {Card, Label, Notice} from "../../components/ui";
import {apiRequest} from "../../api/client";

type Conditions = {
  temperature: number;
  humidity: number;
  wind: number;
  aqi: number | null;
};

export default function InfoCard() {
  const [data, setData] = useState<Conditions | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<Conditions>("/api/weather", { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e?.message || "Can't load weather information.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <Card>
      <Label>Weather & Air Quality</Label>
      <Label secondary>Atlanta, GA</Label>
      {loading && <Label secondary>Loading conditions…</Label>}
      {!loading && !!error && <Notice text={error} error />}
      {!loading && data && (
        <>
          <Label>
            {Math.round(data.temperature)}°F
            </Label>
          <Label secondary> Air quality index: {data.aqi}</Label>
          <Label secondary>Wind: {Math.round(data.wind)} mph</Label>
          <Label secondary>Humidity: {Math.round(data.humidity)}%</Label>
        </>
      )}
    </Card>
  );
}