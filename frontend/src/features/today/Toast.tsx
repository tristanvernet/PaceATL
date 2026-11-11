import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { dismissToast, useToast } from "./toast";

const VISIBLE_MS = 5000;

export function Toast() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissToast(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityLabel={[toast.title, toast.detail].filter(Boolean).join(" ")}
      onPress={() => dismissToast(toast.id)}
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 14,
        right: 14,
        maxWidth: 532,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: c.hero,
        shadowColor: c.text,
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <Ionicons name="sparkles-outline" size={20} color={c.heroAccent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.heroText, fontSize: 13, fontWeight: "700" }}>{toast.title}</Text>
        {toast.detail ? (
          <Text style={{ color: c.heroMuted, fontSize: 13 }}>{toast.detail}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
