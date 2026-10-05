import test from "node:test";
import assert from "node:assert/strict";
import { BADGES, validateActivity, RewardError } from "../src/features/rewards/service.js";

test("reward activity validation accepts a normal workout", () => {
  assert.deepEqual(validateActivity({ activityType:"run", distanceMiles:3.1, durationMinutes:30 }), { activityType:"run", distanceMiles:3.1, durationMinutes:30 });
});
test("reward activity validation rejects unsafe or malformed values", () => {
  assert.throws(() => validateActivity({ activityType:"fly", distanceMiles:1, durationMinutes:20 }), RewardError);
  assert.throws(() => validateActivity({ activityType:"run", distanceMiles:-1, durationMinutes:20 }), /Distance/);
  assert.throws(() => validateActivity({ activityType:"run", distanceMiles:1, durationMinutes:0 }), /Duration/);
});
test("badge rules unlock at documented thresholds", () => {
  const stats={workoutCount:5,totalDistanceMiles:5,totalMinutes:60};
  assert.deepEqual(BADGES.filter(b=>b.test(stats)).map(b=>b.key), ["first_workout","five_workouts","five_miles","hour_active"]);
});
