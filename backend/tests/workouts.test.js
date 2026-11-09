import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { app } from "../src/app.js";
import { databaseOptions, getDatabase, closeDatabase } from "../src/database.js";
import { validateWorkout, todayString } from "../../frontend/src/features/workouts/validation.js";

const valid = { activityType: "run", distanceMiles: 3.1, durationMinutes: 30, workoutDate: "2026-11-01", notes: null };

test("workout validation accepts a normal workout and today's date", () => {
  assert.deepEqual(validateWorkout(valid, "2026-11-08"), {});
  assert.deepEqual(validateWorkout({ ...valid, workoutDate: "2026-11-08", distanceMiles: 0 }, "2026-11-08"), {});
  assert.equal(todayString(new Date(2026, 0, 5)), "2026-01-05");
});

test("workout validation rejects each malformed field", () => {
  const cases = [
    [{ activityType: "fly" }, "activityType"],
    [{ distanceMiles: -1 }, "distanceMiles"],
    [{ distanceMiles: 501 }, "distanceMiles"],
    [{ distanceMiles: "3" }, "distanceMiles"],
    [{ distanceMiles: NaN }, "distanceMiles"],
    [{ durationMinutes: 0 }, "durationMinutes"],
    [{ durationMinutes: 12.5 }, "durationMinutes"],
    [{ durationMinutes: 1441 }, "durationMinutes"],
    [{ workoutDate: "2026-11-09" }, "workoutDate"],
    [{ workoutDate: "2026-02-30" }, "workoutDate"],
    [{ workoutDate: "11/01/2026" }, "workoutDate"],
    [{ workoutDate: "1999-12-31" }, "workoutDate"],
    [{ notes: "x".repeat(501) }, "notes"],
    [{ notes: 5 }, "notes"],
  ];
  for (const [change, field] of cases)
    assert.deepEqual(Object.keys(validateWorkout({ ...valid, ...change }, "2026-11-08")), [field], JSON.stringify(change));
});

let skip = false;
try { databaseOptions(); } catch (error) { skip = `needs MySQL: ${error.message}`; }

describe("workouts API", { skip }, () => {
  let server, base, alice, bob;
  const userIds = [];
  async function call(path, { body, token, method = "GET" } = {}) {
    const response = await fetch(base + path, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  }
  async function signup() {
    const password = randomBytes(24).toString("hex");
    const result = await call("/api/auth/signup", { method: "POST", body: {
      name: "Workouts test", email: `workouts-${randomBytes(12).toString("hex")}@example.test`, password, confirmPassword: password,
    } });
    assert.equal(result.status, 201);
    userIds.push(result.data.user.id);
    return result.data;
  }
  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    base = `http://127.0.0.1:${server.address().port}`;
    alice = await signup();
    bob = await signup();
  });
  after(async () => {
    for (const id of userIds) {
      await getDatabase().execute("DELETE FROM workouts WHERE user_id = ?", [id]);
      await getDatabase().execute("DELETE FROM users WHERE id = ?", [id]);
    }
    await closeDatabase();
    await new Promise((resolve) => server.close(resolve));
  });

  test("every endpoint requires a session", async () => {
    for (const request of [{}, { method: "POST", body: valid }, { method: "DELETE" }]) {
      const result = await call(request.method === "DELETE" ? "/api/workouts/1" : "/api/workouts", request);
      assert.equal(result.status, 401);
      assert.equal(result.error.code, "UNAUTHORIZED");
    }
  });

  test("invalid workouts are rejected and nothing is saved", async () => {
    const result = await call("/api/workouts", { method: "POST", token: alice.token, body: { ...valid, durationMinutes: 0 } });
    assert.equal(result.status, 400);
    assert.deepEqual(result.error, { code: "INVALID_WORKOUT", message: "Duration must be a whole number from 1 to 1440 minutes." });
    assert.deepEqual((await call("/api/workouts", { token: alice.token })).data, []);
  });

  test("logged workouts are owned by the session user and count toward rewards", async () => {
    const created = await call("/api/workouts", { method: "POST", token: alice.token, body: {
      ...valid, userId: bob.user.id, distanceMiles: 5.004, durationMinutes: 60, notes: "  Beltline loop ",
    } });
    assert.equal(created.status, 201);
    const { workoutId, createdAt, ...rest } = created.data.workout;
    assert.ok(Number.isInteger(workoutId));
    assert.deepEqual(rest, { activityType: "run", distanceMiles: 5, durationMinutes: 60, workoutDate: "2026-11-01", notes: "Beltline loop" });
    assert.deepEqual(created.data.unlocked.map((b) => b.key), ["first_workout", "five_miles", "hour_active"]);

    const later = await call("/api/workouts", { method: "POST", token: alice.token, body: { ...valid, activityType: "walk", workoutDate: "2026-11-05" } });
    assert.equal(later.status, 201);
    assert.deepEqual(later.data.unlocked, []);
    const list = await call("/api/workouts", { token: alice.token });
    assert.deepEqual(list.data.map((w) => w.workoutId), [later.data.workout.workoutId, workoutId]);
    assert.deepEqual(list.data[1], created.data.workout);
    assert.deepEqual((await call("/api/workouts", { token: bob.token })).data, []);
    assert.deepEqual((await call("/api/rewards", { token: alice.token })).data.stats, { workoutCount: 2, totalDistanceMiles: 8.1, totalMinutes: 90 });

    for (const id of [workoutId, "abc", "1.5"]) {
      const denied = await call(`/api/workouts/${id}`, { method: "DELETE", token: bob.token });
      assert.equal(denied.status, 404);
      assert.equal(denied.error.code, "WORKOUT_NOT_FOUND");
    }
    const deleted = await call(`/api/workouts/${workoutId}`, { method: "DELETE", token: alice.token });
    assert.deepEqual(deleted.data, { workoutId });
    assert.deepEqual((await call("/api/workouts", { token: alice.token })).data.map((w) => w.workoutId), [later.data.workout.workoutId]);
    const rewards = (await call("/api/rewards", { token: alice.token })).data;
    assert.deepEqual(rewards.stats, { workoutCount: 1, totalDistanceMiles: 3.1, totalMinutes: 30 });
    assert.equal(rewards.achievements.filter((b) => b.unlocked).length, 3);
  });
});
