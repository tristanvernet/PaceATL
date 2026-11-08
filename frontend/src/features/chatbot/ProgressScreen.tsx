import { useState } from "react";
import { Screen, Heading, Card, BackButton, Label, Button } from "../../components/ui";
import { Coach } from "./CoachMap";

export default function ProgressScreen() {
  const [chatOpen, setChatOpen] = useState(false);

    if (chatOpen) return <Coach onClose={() => setChatOpen(false)} />;

  return (
      <Screen>
    <BackButton />
      <Heading
        title="Your progress"
        subtitle="See your progress and chat with your AI Coach."
      />
        <Card>
          <Label>AI Fitness Coach</Label>
          <Label secondary>
            Get personalized workout tips, form advice, and exercise guidance tailored to your goals.
          </Label>
          <Button title="Chat with AI Coach" onPress={() => setChatOpen(true)} />
        </Card>
            </Screen>
  );
}
