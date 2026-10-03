import { Screen, Heading, BackButton, Placeholder } from "../components/ui";
export default function ProgressScreen() {
  return (
    <Screen>
      <BackButton />
      <Heading title="Your progress" />
      <Placeholder
        title="Activity history & coach"
        description="Workout totals, history and an AI coach entry point will appear here in future sprints."
      />
    </Screen>
  );
}
