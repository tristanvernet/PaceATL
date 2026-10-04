export class TutorialError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class TutorialStep {
  constructor(stepId, tutorialId, stepNumber, instructionText, tipNotes) {
    this.stepId = stepId;
    this.tutorialId = tutorialId;
    this.stepNumber = stepNumber;
    this.instructionText = instructionText;
    this.tipNotes = tipNotes;
  }
}

class WorkoutTut {
  constructor(tutId, title, category, difficultyLevel, targetMuscleGroup,
              estimatedDurationMins, description, steps) {
    this.tutId = tutId;
    this.title = title;
    this.category = category;
    this.difficultyLevel = difficultyLevel;
    this.targetMuscleGroup = targetMuscleGroup;
    this.estimatedDurationMins = estimatedDurationMins;
    this.description = description;
    this.createdAt = new Date();
    this.steps = steps;
  }
}

class CompletedTut {
  constructor(completionId, userId, tutorialId) {
    this.completionId = completionId;
    this.userId = userId;
    this.tutorialId = tutorialId;
    this.completedAt = new Date();
  }
}

const workoutTutsCatalog = [
  new WorkoutTut(
    "tut-01", "How to Improve Your Running Endurance?", "Form Tips", "Beginner",
    "Full Body", 5,
    "Prevent fatigue and joint strain with a proper warmup before performing activities.",
    [
      new TutorialStep("s-01-1", "tut-01", 1,
        "Start with short, manageable workouts and gradually increase your exercise time.",
        null),
      new TutorialStep("s-01-2", "tut-01", 2,
        "Maintain a steady pace instead of exercising at maximum intensity.",
        "You have no one to impress but yourself. Start slow and consistent!"),
      new TutorialStep("s-01-3", "tut-01", 3,
        "Take short recovery breaks when needed and increase workout difficulty over time.",
        null),
    ]
  ),
  new WorkoutTut(
    "tut-02", "How to Properly Warm Up Before a Workout?", "Warmup", "Beginner",
    "Legs & Core", 8,
    "Prepare muscles and joints before tackling high-elevation routes.",
    [
      new TutorialStep("s-02-1", "tut-02", 1,
        "10 Forward Leg Swings per leg.", "Hold a wall for balance."),
      new TutorialStep("s-02-2", "tut-02", 2,
        "60 seconds walking lunges with torso twists.", null),
      new TutorialStep("s-02-3", "tut-02", 3,
        "30 seconds high knees.", null),
      new TutorialStep("s-02-4", "tut-02", 4,
        "Perform dynamic stretches such as leg swings and arm circles.",
        "Start slowly with few reps, then increase your pace."),
    ]
  ),
  new WorkoutTut(
    "tut-03", "How to Recover you lower body after a run?", "Recovery", "Intermediate",
    "Hamstrings & Calves", 10,
    "Minimize muscle soreness and improve recovery time after long workouts.",
    [
      new TutorialStep("s-03-1", "tut-03", 1,
        "Hold standing quad stretch for 30 seconds each side.",
        "Drink water in between or after these steps to ensure hydration and recovery of the body. "),
      new TutorialStep("s-03-2", "tut-03", 2,
        "Seated hamstring fold held for 45 seconds.", null),
      new TutorialStep("s-03-3", "tut-03", 3,
        "Standing calf stretch against wall for 30 seconds.", null),
    ]
  ),
];

const completedTutsLogs = [];
let completionCounter = 0;

export function listTutorials(category) {
  if (category === undefined) {
    return [...workoutTutsCatalog];
  }
  if (String(category).trim() === "") {
    throw new TutorialError("ERROR", "Error: Category filter cannot be blank.", 400);
  }
  return workoutTutsCatalog.filter(
    (tut) => tut.category.toLowerCase() === String(category).trim().toLowerCase()
  );
}

export function getTutorial(tutId) {
  const cleanId = String(tutId ?? "").trim().toLowerCase();
  const found = workoutTutsCatalog.find((tut) => tut.tutId.toLowerCase() === cleanId);
  if (!found) {
    throw new TutorialError("ERROR", "Tutorial not found.", 404);
  }
  return found;
}

export function logCompleted(userId, tutId) {
  if (!userId || String(userId).trim() === "" || !tutId || String(tutId).trim() === "") {
    throw new TutorialError("ERROR", "Error: User ID and Tutorial ID are required.", 400);
  }
  const found = getTutorial(tutId);
  completionCounter++;
  const record = new CompletedTut("comp-" + completionCounter, String(userId).trim(), found.tutId);
  completedTutsLogs.push(record);
  return record;
}

export function getCompletedTuts(userId) {
  return completedTutsLogs.filter((c) => c.userId === userId);
}