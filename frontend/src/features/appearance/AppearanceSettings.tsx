import { Pressable, Text, View } from "react-native";
import { ListGroup, ListRow, SectionLabel, SegmentedControl } from "../../components/ui";
import {
  THEMES,
  THEME_NAMES,
  useAppearance,
  useTheme,
  type Mode,
} from "../../theme";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AppearanceSettings() {
  const c = useTheme();
  const { appearance, setTheme, setMode } = useAppearance();
  return (
    <>
      <SectionLabel>Appearance</SectionLabel>
      <ListGroup>
        <ListRow
          icon="contrast-outline"
          title="Mode"
          right={
            <SegmentedControl
              compact
              label="Mode"
              options={MODE_OPTIONS}
              value={appearance.mode}
              onChange={setMode}
            />
          }
        />
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Theme"
          style={{ flexDirection: "row", gap: 10, padding: 14 }}
        >
          {THEME_NAMES.map((name) => {
            const on = appearance.theme === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                aria-checked={on}
                accessibilityLabel={THEMES[name].label}
                onPress={() => setTheme(name)}
                style={{ flex: 1, alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    padding: 2,
                    borderRadius: 21,
                    borderWidth: 2,
                    borderColor: on ? c.text : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: THEMES[name].swatch,
                      borderWidth: 1,
                      borderColor: "#00000022",
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: on ? c.text : c.muted,
                  }}
                >
                  {THEMES[name].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ListGroup>
    </>
  );
}
