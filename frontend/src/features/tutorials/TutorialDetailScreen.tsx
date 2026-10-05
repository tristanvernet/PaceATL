import {useEffect, useState} from "react";

import {useLocalSearchParams} from "expo-router";
import {Screen, Heading, BackButton, Card, Label, Button, Notice} from "../../components/ui";
import {apiRequest} from "../../api/client";
import {Linking, Platform} from "react-native";

const Iframe: any = "iframe";
export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tutorial, setTutorial] = useState<any>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function getYouTubeEmbedUrl(url: string) {
  const videoId=url.split("youtu.be/")[1]?.split("?")[0];
  return `https://www.youtube.com/embed/${videoId}`;
}
  useEffect(() => {
    apiRequest<any>(`/api/tutorials/${id}`)
      .then(setTutorial)
      .catch((e) => setError(e.message));
  }, [id]);

  function markCompleted() {
    apiRequest(`/api/tutorials/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ userId: "user" }),
    })
      .then(() => setDone(true))
      .catch((e) => setError(e.message));
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
                onPress={() => Linking.openURL(tutorial.videoUrl)}
              />
            )}
          </Card>

          {tutorial.steps.map((step: any) => (
            <Card key={step.stepId}>
              <Label>
                Step {step.stepNumber}: {step.instructionText}
              </Label>
              {!!step.tipNotes && <Label secondary>Tip: {step.tipNotes}</Label>}
            </Card>
          ))}

          {done ? (
            <Notice text="Nice work! This tutorial was marked as completed." />
          ) : (
            <Button title="Mark as done" onPress={markCompleted} />
          )}
        </>
      )}
    </Screen>
  );
}