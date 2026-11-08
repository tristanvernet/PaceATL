import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen, Heading, Card, BackButton, Label, Button } from "../../components/ui";
import { Coach } from "./CoachMap";

export default function ProgressScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <View style={styles.container}>
      <Screen>
        <Heading 
          title="Your progress" 
          subtitle="See your progress and chat with your AI Coach." 
        />
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

      <Coach visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
