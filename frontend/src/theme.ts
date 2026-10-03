import { useColorScheme } from "react-native";

export const spacing = { xs: 6, sm: 12, md: 18, lg: 24, xl: 32 };
export const light = {
  background: "#f5f6ef",
  panel: "#ffffff",
  text: "#23372b",
  muted: "#5c6b60",
  soft: "#e6ecdc",
  border: "#d9e0d4",
  primary: "#315e45",
  onPrimary: "#ffffff",
  error: "#a52c31",
};
const dark: typeof light = {
  background: "#18221c",
  panel: "#25332a",
  text: "#eaf1e9",
  muted: "#aebdb1",
  soft: "#344638",
  border: "#415146",
  primary: "#b3d4b4",
  onPrimary: "#18281c",
  error: "#ffb2b7",
};
export function useTheme() {
  return useColorScheme() === "dark" ? dark : light;
}
