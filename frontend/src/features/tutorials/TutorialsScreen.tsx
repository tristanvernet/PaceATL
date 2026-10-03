import { useRouter } from "expo-router";
import {
  Screen,
  Heading,
  Card,
  Label,
  Button,
  Notice,
} from "../../components/ui";
export default function TutorialsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Heading
        eyebrow="Workout tips & tutorials"
        title="Learn at your pace."
        subtitle="Workout instructions and information will live here."
      />
      <Card>
        <Label>Tutorial library</Label>
        <Label secondary>
          Iyana can add the tutorial list, activity categories and content here
          using the shared components.
        </Label>
        <Button
          title="Preview tutorial detail layout"
          onPress={() => router.push("/tutorials/preview")}
        />
      </Card>
      <Notice text="Feature placeholder. No tutorial records or workout instructions have been published." />
    </Screen>
  );
}
