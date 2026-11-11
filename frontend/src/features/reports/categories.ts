import type { Ionicons } from "@expo/vector-icons";

// Keys match the backend's allowed report categories.
export const HAZARD_CATEGORIES = {
  hazard: { label: "Obstruction", icon: "warning-outline" },
  surface: { label: "Uneven surface", icon: "footsteps-outline" },
  lighting: { label: "Poor lighting", icon: "flashlight-outline" },
  suspicious: { label: "Suspicious activity", icon: "eye-outline" },
} as const satisfies Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }>;
export type HazardCategory = keyof typeof HAZARD_CATEGORIES;
export const HAZARD_CATEGORY_KEYS = Object.keys(HAZARD_CATEGORIES) as HazardCategory[];

export const categoryLabel = (category: string) =>
  category in HAZARD_CATEGORIES ? HAZARD_CATEGORIES[category as HazardCategory].label : category;
