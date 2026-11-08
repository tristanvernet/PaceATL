import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { apiRequest } from "../../api/client";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export function Coach ({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: res,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "bot", text: "Sorry, I ran into an issue connecting. Please try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Fitness Coach</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
              <Text style={item.sender === "user" ? styles.userText : styles.botText}>{item.text}</Text>
            </View>
          )}
        />

        {loading && <ActivityIndicator size="small" color="#0059ff" style={{ marginVertical: 8 }} />}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a workout or health question!"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 18,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeBtn: {
    fontSize: 16,
    color: "#FF69B4",
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#31e274",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E9ECEF",
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#212529",
  },
  inputContainer: {
    flexDirection: "row",
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  sendBtn: {
    backgroundColor: "#FF69B4",
    padding: 15,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});