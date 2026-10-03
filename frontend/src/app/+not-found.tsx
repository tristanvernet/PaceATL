import { Screen, Heading, BackButton } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Heading
        title="Screen not found"
        subtitle="This screen is not part of the foundation yet."
      />
      <BackButton />
    </Screen>
  );
}
