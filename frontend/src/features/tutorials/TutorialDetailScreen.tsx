import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Heading, BackButton, Placeholder } from "../../components/ui";

const API = "http://localhost:3001";

export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tut, setTut] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/tutorials/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body) => setTut(body.data))
      .catch(() => setError(true));
  }, [id]);

  return (
    <Screen>
      <BackButton />
      {error ? (
        <Placeholder title="Tutorial not found" description="This tutorial couldn't be loaded." />
      ) : !tut ? (
        <Placeholder title="Loading…" description="" />
      ) : (
        <>
          <Heading eyebrow={tut.category} title={tut.title} />
          <Text>{tut.difficultyLevel} · {tut.estimatedDurationMins} min</Text>
          <Text>{tut.description}</Text>
          {tut.steps.map((s: any) => (
            <View key={s.stepId}>
              <Text>{s.stepNumber}. {s.instructionText}</Text>
              {s.tipNotes ? <Text>Tip: {s.tipNotes}</Text> : null}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}