import { useRouter } from "expo-router";
import { View } from "react-native";
import InfoCard from "../../features/weather/InfoCard";
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
          title="Fitness dashboard & sharing"
          secondary
          onPress={() => router.push("/fitness")}
        />
        <Button
          title="Progress & AI coach"
          secondary
          onPress={() => router.push("/progress")}
        />
      </View>
      <Notice text="Browse tutorials freely. Sign in to save completions, log workouts and earn achievements." />
    </Screen>
  );
}
