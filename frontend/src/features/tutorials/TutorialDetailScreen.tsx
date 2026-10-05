import {useEffect, useState} from "react";

import {useLocalSearchParams, useRouter} from "expo-router";
import {Screen, Heading, BackButton, Card, Label, Button, Notice} from "../../components/ui";
import {apiRequest, ApiError} from "../../api/client";
import {Linking, Platform} from "react-native";
import {useSession} from "../auth/SessionProvider";
import type { Tutorial } from "./types";

const Iframe: any = "iframe";
export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  function getYouTubeEmbedUrl(url: string) {
  const videoId=url.split("youtu.be/")[1]?.split("?")[0];
  return `https://www.youtube.com/embed/${videoId}`;
}
  useEffect(() => {
    if (!session.ready) return;
    const controller = new AbortController();
    setTutorial(null); setDone(false); setError("");
    apiRequest<Tutorial>(`/api/tutorials/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) { setTutorial(data); setDone(data.completed); }
      })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id, session.ready, session.user?.id, retry]);

  async function markCompleted() {
    setLoading(true); setError("");
    try {
      await apiRequest(`/api/tutorials/${encodeURIComponent(id)}/complete`, { method: "POST" });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await session.refresh();
      setError(e instanceof Error ? e.message : "Unable to save completion.");
    } finally { setLoading(false); }
  }

  return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow={tutorial?.category ?? "Tutorial"}
        title={tutorial?.title ?? "Workout instructions"}
        subtitle={tutorial?.description}
      />

      {!!error && <Notice text={error} error />}
      {!!error && !tutorial && <Button title="Try again" onPress={() => setRetry(retry + 1)} />}
      {!tutorial && !error && <Notice text="Loading tutorial…" />}

      {tutorial && (
        <>
          <Card>
            <Label secondary>
              {tutorial.difficultyLevel} · {tutorial.estimatedDurationMins} min ·{" "}
              {tutorial.targetMuscleGroup}
            </Label>
            {!!tutorial.videoUrl && Platform.OS === "web" && (
                <Iframe
                src={getYouTubeEmbedUrl(tutorial.videoUrl)}
                title="Tutorial video"
                width="100%"
                height="315"
                style={{ border: 0, borderRadius: 12 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
            {!!tutorial.videoUrl && Platform.OS !== "web" && (
              <Button
                title="Watch video"
                onPress={() => { void Linking.openURL(tutorial.videoUrl).catch(() => setError("Could not open the video.")); }}
              />
            )}
          </Card>

          {tutorial.steps.map((step) => (
            <Card key={step.stepId}>
              <Label>
                Step {step.stepNumber}: {step.instructionText}
              </Label>
              {!!step.tipNotes && <Label secondary>Tip: {step.tipNotes}</Label>}
            </Card>
          ))}

          {!session.user ? (
            <Button title="Log in to save completion" onPress={() => router.push("/login")} />
          ) : done ? (
            <Notice text="Nice work! This tutorial is saved as completed." />
          ) : (
            <Button title="Mark as done" onPress={markCompleted} loading={loading} />
          )}
        </>
      )}
    </Screen>
  );
}
