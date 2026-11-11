import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export const spacing = { xs: 6, sm: 12, md: 18, lg: 24, xl: 32 };
export const fonts = { heading: "Fraunces_600SemiBold" };

export type Palette = {
  background: string;
  panel: string;
  text: string;
  muted: string;
  soft: string;
  border: string;
  primary: string;
  onPrimary: string;
  error: string;
  hero: string;
  heroText: string;
  heroMuted: string;
  heroAccent: string;
};
export type ThemeName = "clay" | "piedmont" | "hooch" | "beltline";
export type Mode = "system" | "light" | "dark";
export type Appearance = { theme: ThemeName; mode: Mode };

const errorLight = "#a52c31";
const errorDark = "#ffb2b7";

// soft is primary at 12% over panel, precomputed so native needs no color-mix.
export const THEMES: Record<
  ThemeName,
  { label: string; swatch: string; light: Palette; dark: Palette }
> = {
  clay: {
    label: "Clay",
    swatch: "#d0532b",
    light: {
      background: "#f6f1e8",
      panel: "#fffaf2",
      text: "#2a2320",
      muted: "#8a7b6d",
      soft: "#f9e6da",
      border: "#ebe1d2",
      primary: "#d0532b",
      onPrimary: "#ffffff",
      error: errorLight,
      hero: "#2a2320",
      heroText: "#f6f1e8",
      heroMuted: "#c9bdb1",
      heroAccent: "#f0a07f",
    },
    dark: {
      background: "#1a1614",
      panel: "#25201c",
      text: "#f3ebe1",
      muted: "#a39384",
      soft: "#3d2b22",
      border: "#3a322c",
      primary: "#ec7a50",
      onPrimary: "#1a1614",
      error: errorDark,
      hero: "#3a2a22",
      heroText: "#f6f1e8",
      heroMuted: "#d2c2b3",
      heroAccent: "#f0a07f",
    },
  },
  piedmont: {
    label: "Piedmont",
    swatch: "#2f6b47",
    light: {
      background: "#f3f5ef",
      panel: "#ffffff",
      text: "#1d2a22",
      muted: "#6a776e",
      soft: "#e6ede9",
      border: "#e1e7dc",
      primary: "#2f6b47",
      onPrimary: "#ffffff",
      error: errorLight,
      hero: "#1f3a2a",
      heroText: "#eef4ec",
      heroMuted: "#b5c7b9",
      heroAccent: "#9fd4a8",
    },
    dark: {
      background: "#121a15",
      panel: "#1b251f",
      text: "#e8f0e9",
      muted: "#93a398",
      soft: "#27392d",
      border: "#2a372f",
      primary: "#7fcf95",
      onPrimary: "#0f1a13",
      error: errorDark,
      hero: "#1f3a2a",
      heroText: "#eef4ec",
      heroMuted: "#b5c7b9",
      heroAccent: "#9fd4a8",
    },
  },
  hooch: {
    label: "Hooch",
    swatch: "#2a64c5",
    light: {
      background: "#f2f4f7",
      panel: "#ffffff",
      text: "#18212e",
      muted: "#667385",
      soft: "#e5ecf8",
      border: "#dfe4ec",
      primary: "#2a64c5",
      onPrimary: "#ffffff",
      error: errorLight,
      hero: "#16263f",
      heroText: "#edf2fa",
      heroMuted: "#aebbd0",
      heroAccent: "#8db6ff",
    },
    dark: {
      background: "#0f141c",
      panel: "#18202b",
      text: "#e6ecf5",
      muted: "#8d99ab",
      soft: "#243044",
      border: "#263142",
      primary: "#7aa8ff",
      onPrimary: "#0b1220",
      error: errorDark,
      hero: "#1b2c48",
      heroText: "#edf2fa",
      heroMuted: "#aebbd0",
      heroAccent: "#8db6ff",
    },
  },
  beltline: {
    label: "BeltLine",
    swatch: "#c8f53b",
    light: {
      background: "#f4f5f1",
      panel: "#ffffff",
      text: "#111511",
      muted: "#69716a",
      soft: "#e2e3e2",
      border: "#e2e5df",
      primary: "#111511",
      onPrimary: "#c8f53b",
      error: errorLight,
      hero: "#111511",
      heroText: "#f2f5f1",
      heroMuted: "#9aa39b",
      heroAccent: "#c8f53b",
    },
    dark: {
      background: "#0c0f0d",
      panel: "#161b17",
      text: "#f2f5f1",
      muted: "#8a948c",
      soft: "#2b351b",
      border: "#232a25",
      primary: "#c8f53b",
      onPrimary: "#0c0f0d",
      error: errorDark,
      hero: "#1a211c",
      heroText: "#f2f5f1",
      heroMuted: "#9aa39b",
      heroAccent: "#c8f53b",
    },
  },
};
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
export const MODES: readonly Mode[] = ["system", "light", "dark"];
export const DEFAULT_APPEARANCE: Appearance = { theme: "clay", mode: "system" };

export function parseAppearance(raw: string | null): Appearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return DEFAULT_APPEARANCE;
    const { theme, mode } = value as Record<string, unknown>;
    if (
      THEME_NAMES.includes(theme as ThemeName) &&
      MODES.includes(mode as Mode)
    )
      return { theme: theme as ThemeName, mode: mode as Mode };
  } catch {}
  return DEFAULT_APPEARANCE;
}

const storageKey = "paceatl-appearance";
const isWeb = Platform.OS === "web";
async function saveAppearance(appearance: Appearance) {
  const raw = JSON.stringify(appearance);
  if (isWeb) window.localStorage.setItem(storageKey, raw);
  else await SecureStore.setItemAsync(storageKey, raw);
}

type AppearanceValue = {
  appearance: Appearance;
  palette: Palette;
  dark: boolean;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: Mode) => void;
};
const AppearanceContext = createContext<AppearanceValue | null>(null);

export function AppearanceProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance | null>(() =>
    isWeb ? parseAppearance(window.localStorage.getItem(storageKey)) : null,
  );
  useEffect(() => {
    if (isWeb) return;
    SecureStore.getItemAsync(storageKey)
      .then(parseAppearance, () => DEFAULT_APPEARANCE)
      .then(setAppearance);
  }, []);
  const value = useMemo<AppearanceValue | null>(() => {
    if (!appearance) return null;
    const set = (next: Appearance) => {
      setAppearance(next);
      saveAppearance(next).catch(() => {});
    };
    const dark =
      appearance.mode === "system" ? scheme === "dark" : appearance.mode === "dark";
    return {
      appearance,
      dark,
      palette: THEMES[appearance.theme][dark ? "dark" : "light"],
      setTheme: (theme) => set({ ...appearance, theme }),
      setMode: (mode) => set({ ...appearance, mode }),
    };
  }, [appearance, scheme]);
  // Native reads storage asynchronously; render nothing until then so the
  // saved theme never flashes the default.
  if (!value) return null;
  return createElement(AppearanceContext.Provider, { value }, children);
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside AppearanceProvider");
  return value;
}
export function useTheme(): Palette {
  return useAppearance().palette;
}
