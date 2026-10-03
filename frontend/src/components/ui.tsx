import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { spacing, useTheme } from "../theme";

export function Screen({ children }: PropsWithChildren) {
  const c = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.screen}
      >
        <View style={styles.brand}>
          <Text style={[styles.brandText, { color: c.text }]}>PaceATL</Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>
            Foundation preview
          </Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  eyebrow,
  subtitle,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 10, marginBottom: spacing.lg }}>
      {eyebrow && (
        <Text
          style={{
            color: c.muted,
            fontSize: 11,
            letterSpacing: 1.5,
            fontWeight: "600",
          }}
        >
          {eyebrow.toUpperCase()}
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={{
          color: c.text,
          fontSize: 30,
          fontWeight: "600",
          letterSpacing: -0.9,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: c.muted, fontSize: 15, lineHeight: 23 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  const c = useTheme();
  return (
    <View
      style={{
        padding: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.md,
        borderRadius: 18,
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      {children}
    </View>
  );
}
export function Label({
  children,
  secondary = false,
}: PropsWithChildren<{ secondary?: boolean }>) {
  const c = useTheme();
  return (
    <Text
      style={{
        color: secondary ? c.muted : c.text,
        fontSize: secondary ? 13 : 17,
        lineHeight: secondary ? 21 : 24,
        fontWeight: secondary ? "400" : "600",
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const c = useTheme();
  const color = secondary ? c.text : c.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: secondary ? c.soft : c.primary,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
      })}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={{ color, fontSize: 15, fontWeight: "600", flexShrink: 1 }}>
          {title}
        </Text>
      )}
      <Ionicons name="arrow-forward" color={color} size={18} />
    </Pressable>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  const c = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: c.soft,
        marginVertical: 12,
      }}
    >
      <Text
        style={{
          color: error ? c.error : c.muted,
          fontSize: 13,
          lineHeight: 21,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <Text style={{ color: c.text, fontSize: 14 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          {
            backgroundColor: c.panel,
            color: c.text,
            borderWidth: 1,
            borderColor: error ? c.error : c.border,
            borderRadius: 12,
            padding: 13,
            fontSize: 16,
            minHeight: 48,
          },
          props.style,
        ]}
      />
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: c.error, fontSize: 12 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function BackButton() {
  const router = useRouter();
  return (
    <View style={{ marginBottom: 18 }}>
      <Button
        title="Back"
        secondary
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
    </View>
  );
}
export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <Card>
        <Label>{title}</Label>
        <Label secondary>{description}</Label>
      </Card>
      <Notice text="Feature placeholder only. No information is saved or submitted." />
    </>
  );
}
const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
    paddingBottom: 36,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    gap: 12,
  },
  brandText: { fontSize: 20, fontWeight: "700", letterSpacing: -0.6 },
});
