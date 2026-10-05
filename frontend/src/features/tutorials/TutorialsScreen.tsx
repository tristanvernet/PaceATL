import {useEffect, useState} from "react";
import {useRouter} from "expo-router";
import {Screen, Heading, BackButton, Card, Label, Button, Notice}
  from "../../components/ui";
import { apiRequest } from "../../api/client";

export default function TutorialsScreen() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<any[]>("/api/tutorials")
      .then(setTutorials)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Screen>
      <Heading
        eyebrow="Workout tips & tutorials"
        title="Learn at your pace."
        subtitle="Instructions and tips to help you practice a proper workout."
      />

      {!!error && <Notice text={error} error />}

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

      <Notice text="Preview: tutorial content is sample data until the database is connected." />
    </Screen>
  );
}