import type { Ionicons } from "@expo/vector-icons";

export type TutorialSummary = {
  tutId: string; title: string; category: string; description: string;
  difficultyLevel: string; estimatedDurationMins: number; targetMuscleGroup: string;
  videoUrl: string;
};
export type Tutorial = TutorialSummary & {
  completed: boolean;
  steps: { stepId: string; stepNumber: number; instructionText: string; tipNotes: string | null }[];
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Warmup: "flame-outline",
  "Form Tips": "footsteps-outline",
  Recovery: "heart-outline",
};
export const categoryIcon = (category: string) => CATEGORY_ICONS[category] ?? "barbell-outline";
