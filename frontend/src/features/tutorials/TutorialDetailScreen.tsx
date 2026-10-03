import { useLocalSearchParams } from "expo-router";
import { Screen, Heading, BackButton, Placeholder } from "../../components/ui";
export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <BackButton />
      <Heading eyebrow="Tutorial detail" title="Workout instructions" />
      <Placeholder
        title={
          id === "preview" ? "Tutorial detail layout" : "Tutorial not connected"
        }
        description="A starting layout for the selected tutorial’s title, activity category, instructions and supporting images or video."
      />
    </Screen>
  );
}
