import test from "node:test";
import assert from "node:assert/strict";
import { utcDay, progressFor } from "../src/features/challenges/service.js";
import { normalizeHotspots } from "../src/features/hotspots/service.js";
test("daily challenge uses a stable UTC date", () => assert.equal(utcDay(new Date("2026-11-09T23:59:00Z")), "2026-11-09"));
test("challenge counts only eligible workout types", () => {
  const workouts = [{ activityType: "run", distanceMiles: 2, durationMinutes: 20 }, { activityType: "walk", distanceMiles: 10, durationMinutes: 40 }, { activityType: "run", distanceMiles: 1, durationMinutes: 10 }];
  assert.equal(progressFor({ activityType: "run", metric: "miles" }, workouts), 3);
  assert.equal(progressFor({ activityType: "run", metric: "minutes" }, workouts), 30);
  assert.equal(progressFor({ activityType: "any", metric: "workouts" }, workouts), 3);
});
test("hotspot data validates coordinates and activity types", () => {
  const input = [{ id: "a", name: "Test", latitude: 33.75, longitude: -84.39, activities: ["run"] }, { id: "b", name: "Invalid", latitude: 50, longitude: -84.39, activities: ["run"] }];
  assert.equal(normalizeHotspots(input).length, 1);
});
