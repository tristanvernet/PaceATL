import { Screen, Heading, BackButton, Placeholder } from "../components/ui";
export default function WorkoutsScreen() {
  return (
    <Screen>
      <BackButton />
      <Heading title="Log a workout" />
      <Placeholder
        title="Manual workout entry"
        description="Activity type, date, distance and duration will be entered here. This is planned for a later implementation."
      />
    </Screen>
  );
}
