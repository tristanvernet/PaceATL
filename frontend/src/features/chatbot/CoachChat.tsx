import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, ApiError, errorMessage } from "../../api/client";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import { SignInPrompt } from "../auth/SignInPrompt";

type Message = { id: number; role: "user" | "coach"; text: string };
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "failed"; message: string; text: string };

const SUGGESTIONS = ["How's my week?", "Suggest a route", "Warm-up tips"];
// The intro is sent as history too: the chat endpoint only forwards the new
// message to the model once per history entry, so empty history drops it.
const INTRO: Message = {
  id: 0,
  role: "coach",
  text: "Hi, I'm your PaceATL coach. Ask me about your week, a route to try, or how to warm up.",
};

// The model answers in light markdown. Bold renders as bold; other emphasis
// markers are dropped rather than shown as literal asterisks.
function Markdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <Text key={i} style={{ fontWeight: "700" }}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part.replace(/^\s*[*-] /gm, "• ").replace(/\*([^*\n]+)\*/g, "$1")
    ),
  );
}

export function CoachChat() {
  const c = useTheme();
  const session = useSession();
  const scroll = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [input, setInput] = useState("");

  if (session.ready && !session.user)
    return (
      <View style={{ padding: 18 }}>
        <SignInPrompt
          title="Chat with your coach"
          text="The coach reads your recent activity, so it needs your PaceATL account."
        />
      </View>
    );

  async function ask(text: string, history: Message[]) {
    setStatus({ kind: "sending" });
    try {
      const reply = await apiRequest<string>("/api/chatbot/chat", {
        method: "POST",
        timeoutMs: 40000,
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ sender: m.role === "user" ? "user" : "bot", text: m.text })),
        }),
      });
      setMessages((current) => [...current, { id: current.length, role: "coach", text: reply }]);
      setStatus({ kind: "idle" });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) void session.refresh();
      setStatus({ kind: "failed", message: errorMessage(e, "The coach could not answer."), text });
    }
  }
  function send(raw: string) {
    const text = raw.trim();
    if (!text || status.kind === "sending") return;
    const history = messages;
    setMessages([...history, { id: history.length, role: "user", text }]);
    setInput("");
    void ask(text, history);
  }
  function retry() {
    if (status.kind !== "failed") return;
    void ask(status.text, messages.slice(0, -1));
  }

  const sending = status.kind === "sending";
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, gap: 10, maxWidth: 560, width: "100%", alignSelf: "center" }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => {
          const mine = m.role === "user";
          return (
            <View
              key={m.id}
              accessibilityLabel={`${mine ? "You" : "Coach"}: ${m.text}`}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "82%",
                paddingVertical: 11,
                paddingHorizontal: 14,
                borderRadius: 18,
                borderBottomRightRadius: mine ? 6 : 18,
                borderBottomLeftRadius: mine ? 18 : 6,
                backgroundColor: mine ? c.hero : c.panel,
                borderWidth: mine ? 0 : 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ color: mine ? c.heroText : c.text, fontSize: 14, lineHeight: 20 }}>
                {mine ? m.text : <Markdown text={m.text} />}
              </Text>
            </View>
          );
        })}
        {sending && (
          <View
            accessibilityLabel="Coach is typing"
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 18,
              borderBottomLeftRadius: 6,
              backgroundColor: c.panel,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <ActivityIndicator size="small" color={c.muted} />
            <Text style={{ color: c.muted, fontSize: 13 }}>Thinking…</Text>
          </View>
        )}
        {status.kind === "failed" && (
          <View
            accessibilityLiveRegion="polite"
            style={{
              alignSelf: "flex-start",
              maxWidth: "82%",
              gap: 8,
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 18,
              borderBottomLeftRadius: 6,
              backgroundColor: c.soft,
            }}
          >
            <Text style={{ color: c.error, fontSize: 14, lineHeight: 20 }}>{status.message}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry"
              onPress={retry}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="refresh" size={15} color={c.text} />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 14, paddingBottom: 10 }}
      >
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            disabled={sending}
            onPress={() => send(s)}
            style={({ pressed }) => ({
              paddingVertical: 7,
              paddingHorizontal: 11,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.border,
              opacity: sending ? 0.5 : pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: "600" }}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 14,
          marginBottom: 10,
          paddingLeft: 16,
          paddingRight: 5,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.panel,
        }}
      >
        <TextInput
          accessibilityLabel="Message your coach"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          placeholder="Ask your coach…"
          placeholderTextColor={c.muted}
          returnKeyType="send"
          style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 12 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={sending || !input.trim()}
          onPress={() => send(input)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: input.trim() && !sending ? c.primary : c.soft,
          }}
        >
          <Ionicons name="arrow-up" size={18} color={input.trim() && !sending ? c.onPrimary : c.muted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
