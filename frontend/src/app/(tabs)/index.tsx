import { useRouter } from "expo-router";
import { View } from "react-native";
import {
  Screen,
  Heading,
  Button,
  Notice,
} from "../../components/ui";
export default function HomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Heading
        eyebrow="Your daily pace"
        title="What’s your next step?"
        subtitle="Find a route, learn something new, or record your activity."
      />
      <View style={{ gap: 12 }}>
        <Button
          title="Explore routes & hotspots"
          onPress={() => router.push("/routes")}
        />
        <Button
          title="Workout tips & tutorials"
          secondary
          onPress={() => router.push("/learn")}
        />
        <Button title="Achievements & rewards" secondary onPress={() => router.push("/achievements")} />
        <Button
          title="Log a workout"
          secondary
          onPress={() => router.push("/workouts")}
        />
        <Button
          title="Progress & AI coach"
          secondary
          onPress={() => router.push("/progress")}
        />
      </View>
      <Notice text="Browse tutorials freely. Sign in to save completion. Maps, workout logging and progress tools are still in development." />
    </Screen>
  );
}
