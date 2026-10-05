export type Tutorial = {
  tutId: string; title: string; category: string; description: string;
  difficultyLevel: string; estimatedDurationMins: number; targetMuscleGroup: string;
  videoUrl: string; completed: boolean;
  steps: { stepId: string; stepNumber: number; instructionText: string; tipNotes: string | null }[];
};
