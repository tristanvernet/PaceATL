import { Children, Fragment, type PropsWithChildren, type ReactNode } from "react";
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
import { fonts, spacing, useTheme } from "../theme";

type IconName = keyof typeof Ionicons.glyphMap;

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
            fontSize: 12,
            letterSpacing: 0.5,
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
          fontFamily: fonts.heading,
          fontSize: 29,
          lineHeight: 34,
          letterSpacing: -0.6,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>
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
        fontSize: secondary ? 13 : 16,
        lineHeight: secondary ? 20 : 22,
        fontWeight: secondary ? "400" : "700",
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
        minHeight: 50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: secondary ? c.panel : c.primary,
        borderWidth: secondary ? 1 : 0,
        borderColor: c.border,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={{ color, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
          {title}
        </Text>
      )}
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
        borderRadius: 14,
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
      <Text
        style={{
          color: c.muted,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1,
        }}
      >
        {label.toUpperCase()}
      </Text>
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
            borderRadius: 14,
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
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        marginBottom: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={18} color={c.text} />
    </Pressable>
  );
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  label?: string;
}) {
  const c = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        padding: compact ? 3 : 4,
        borderRadius: compact ? 10 : 12,
        backgroundColor: compact ? c.background : c.panel,
        borderWidth: compact ? 0 : 1,
        borderColor: c.border,
      }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(option.value)}
            style={{
              flex: compact ? 0 : 1,
              alignItems: "center",
              paddingVertical: compact ? 5 : 9,
              paddingHorizontal: compact ? 9 : 4,
              borderRadius: compact ? 8 : 9,
              backgroundColor: on ? (compact ? c.panel : c.primary) : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: compact ? 12 : 13,
                fontWeight: "600",
                color: on ? (compact ? c.text : c.onPrimary) : c.muted,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export function ListGroup({ children }: PropsWithChildren) {
  const c = useTheme();
  const rows = Children.toArray(children);
  return (
    <View
      style={{
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={{ height: 1, backgroundColor: c.border }} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
export function ListRow({
  title,
  subtitle,
  icon,
  detail,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  detail?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const c = useTheme();
  const body = (
    <>
      {icon && <Ionicons name={icon} size={18} color={c.text} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>{title}</Text>
        {subtitle && <Text style={{ color: c.muted, fontSize: 12 }}>{subtitle}</Text>}
      </View>
      {right}
      {detail && <Text style={{ color: c.muted, fontSize: 13 }}>{detail}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={c.muted} />}
    </>
  );
  const row = {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  } as const;
  if (!onPress) return <View style={row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {body}
    </Pressable>
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
    paddingHorizontal: 22,
    paddingTop: spacing.sm,
    paddingBottom: 36,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
});
