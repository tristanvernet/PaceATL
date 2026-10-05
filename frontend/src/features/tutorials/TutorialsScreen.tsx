import {useEffect, useState} from "react";
import {useRouter} from "expo-router";
import {Screen, Heading, BackButton, Card, Label, Button, Notice}
  from "../../components/ui";
import { apiRequest } from "../../api/client";
import type { Tutorial } from "./types";

export default function TutorialsScreen() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    apiRequest<Tutorial[]>("/api/tutorials", { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setTutorials(data); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  return (
    <Screen>
      <Heading
        eyebrow="Workout tips & tutorials"
        title="Learn at your pace."
        subtitle="Instructions and tips to help you practice a proper workout."
      />

      {!!error && <Notice text={error} error />}
      {!!error && <Button title="Try again" onPress={() => setRetry(retry + 1)} />}
      {loading && <Notice text="Loading tutorials…" />}
      {!loading && !error && !tutorials.length && <Notice text="No tutorials are available yet." />}

      {tutorials.map((tut) => (
        <Card key={tut.tutId}>
          <Label>{tut.title}</Label>
          <Label secondary>{tut.description}</Label>
          <Label secondary>
            {tut.category} · {tut.difficultyLevel} · {tut.estimatedDurationMins} min
          </Label>
          <Button
            title="View instructions"
            onPress={() =>
              router.push({ pathname: "/tutorials/[id]", params: { id: tut.tutId } })
            }
          />
        </Card>
      ))}

    </Screen>
  );
}
