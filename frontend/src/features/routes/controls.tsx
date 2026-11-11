import type { PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type Palette } from "../../theme";

type IconName = keyof typeof Ionicons.glyphMap;

// The hero color is dark in every theme and mode, so it doubles as the shadow color.
const lifted = (c: Palette, y = 3) => ({ boxShadow: `0px ${y}px 10px ${c.hero}29` });

export function LayerChip({
  label,
  icon,
  on,
  onPress,
}: {
  label: string;
  icon: IconName;
  on: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const color = on ? c.background : c.text;
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: on ? c.text : c.panel,
        opacity: pressed ? 0.8 : 1,
        ...lifted(c),
      })}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function FloatingButton({
  label,
  icon,
  primary = false,
  onPress,
}: {
  label: string;
  icon: IconName;
  primary?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const color = primary ? c.onPrimary : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 14,
        backgroundColor: primary ? c.primary : c.panel,
        opacity: pressed ? 0.8 : 1,
        ...lifted(c),
      })}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.panel,
        opacity: pressed ? 0.8 : 1,
        ...lifted(c),
      })}
    >
      <Ionicons name={icon} size={19} color={c.text} />
    </Pressable>
  );
}

/** Bottom panel that sits over a full-bleed map. */
export function Sheet({ children }: PropsWithChildren) {
  const c = useTheme();
  return (
    <View
      style={{
        backgroundColor: c.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 14,
        ...lifted(c, -4),
      }}
    >
      <View
        style={{
          width: 38,
          height: 5,
          borderRadius: 9,
          backgroundColor: c.border,
          alignSelf: "center",
          marginBottom: 12,
        }}
      />
      {children}
    </View>
  );
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        marginVertical: 12,
      }}
    >
      {items.map((item, i) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            paddingVertical: 11,
            paddingHorizontal: 12,
            borderLeftWidth: i ? 1 : 0,
            borderLeftColor: c.border,
          }}
        >
          <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }}>{item.value}</Text>
          <Text style={{ color: c.muted, fontSize: 11 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
