import { useRef, useState } from "react";
import {Modal, View, Text, TextInput, FlatList} from "react-native";
import { apiRequest } from "../../api/client";
import { Button } from "../../components/ui";
import { Notice } from "../../components/ui";
import { useTheme } from "../../theme";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export function Coach ({onClose }: 
    {onClose: () => void }) {
    const c = useTheme();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "bot", text: "Hi! I'm your PaceATL AI Fitness Coach. How can I help with your workouts or training goals today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: userText };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiRequest<string>("/api/chatbot/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          history: messages,
        }),
      });
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: res }]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: "Connection issues! Try Again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: 40, 
      paddingHorizontal: 15, 
        backgroundColor: c.panel }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", 
            alignItems: "center", marginBottom: 15 }}>
          <Text style={{ fontSize: 20, 
            fontWeight: "bold", 
            color: c.text }}>AI Fitness Coach</Text>
             <Button title="Close" secondary onPress={onClose} />
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender === "user";
            return (
              <View
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: 12,
                  borderRadius: 12,
                  marginVertical: 4,
                  backgroundColor: mine ? c.primary : c.soft,
                }}
              >
                <Text style={{ color: mine ? c.onPrimary : c.text }}>{item.text}</Text>
              </View>
            );
          }}
        />

        {loading && <Notice text="..." />}

        <View style={{ flexDirection: "row", paddingVertical: 15 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 8,
              paddingHorizontal: 15,
              backgroundColor: c.panel,
              color: c.text,
            }}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholder="Ask a workout or health question!"
            placeholderTextColor={c.muted}
          />
             <Button title="Send" loading={loading} onPress={sendMessage} />
        </View>
        </View>      
    </Modal>
  );
}