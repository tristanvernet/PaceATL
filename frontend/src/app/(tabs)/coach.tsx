import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SegmentedControl } from "../../components/ui";
import { useTheme } from "../../theme";
import { CoachChat } from "../../features/chatbot/CoachChat";
import { TutorialLibrary } from "../../features/tutorials/TutorialLibrary";

const VIEWS = [
  { value: "chat", label: "Chat" },
  { value: "library", label: "Library" },
] as const;
const column = { maxWidth: 560, width: "100%", alignSelf: "center" } as const;

export default function CoachScreen() {
  const c = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const view = params.view === "library" ? "library" : "chat";
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 2, paddingBottom: 10, borderBottomWidth: 1, borderColor: c.border }}>
        <View style={column}>
          <SegmentedControl
            label="Coach view"
            options={VIEWS}
            value={view}
            onChange={(next) => router.setParams({ view: next })}
          />
        </View>
      </View>
      {/* Both stay mounted so the conversation survives a trip to the library. */}
      <View style={{ flex: 1, display: view === "chat" ? "flex" : "none" }}>
        <CoachChat />
      </View>
      <ScrollView
        style={{ display: view === "library" ? "flex" : "none" }}
        contentContainerStyle={[column, { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 }]}
      >
        <TutorialLibrary />
      </ScrollView>
    </SafeAreaView>
  );
}
