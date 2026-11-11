import { Pressable, Text } from "react-native";
import { useTheme } from "../../theme";

// On hero surfaces the accent, not primary, is the button fill: BeltLine's
// light primary is the same ink as its hero.
export function HeroButton({ title, onPress }: { title: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 14,
        paddingHorizontal: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.heroAccent,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: c.hero, fontSize: 15, fontWeight: "800" }}>{title}</Text>
    </Pressable>
  );
}
