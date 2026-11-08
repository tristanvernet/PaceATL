import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { app } from "../src/app.js";
import { databaseOptions, getDatabase, closeDatabase } from "../src/database.js";
import { sampleAlong, summarizeTerrain } from "../src/features/briefings/facts.js";
import { routeDistanceMeters } from "../../frontend/src/features/routes/geometry.js";

const north = [{ latitude: 33.749, longitude: -84.388 }, { latitude: 33.759, longitude: -84.388 }];

describe("briefing facts", () => {
  test("samples evenly along the whole path", () => {
    const { samples, spacingMeters } = sampleAlong(north);
    assert.equal(samples.length, 12);
    assert.deepEqual(samples[0], north[0]);
    assert.ok(Math.abs(samples.at(-1).latitude - north[1].latitude) < 1e-9);
    for (let i = 1; i < samples.length; i++)
      assert.ok(Math.abs(routeDistanceMeters([samples[i - 1], samples[i]]) - spacingMeters) < 1);
  });

  test("summarizes climb, descent and the steepest 200 m in feet and percent", () => {
    assert.deepEqual(summarizeTerrain([300, 310, 330, 320, 300], 100), {
      climbFeet: 98, descentFeet: 98, lowestFeet: 984, highestFeet: 1083, steepestGradePercent: 15,
    });
  });
});

let skip = false;
try { databaseOptions(); } catch (error) { skip = `needs MySQL: ${error.message}`; }

describe("route briefing API", { skip }, () => {
  const realFetch = globalThis.fetch;
  const savedEnv = {};
  let server, base, alice, bob, route, aiCalls, aiStatus, aiAnswer;
  const userIds = [];
  async function call(path, { body, token, method = "GET" } = {}) {
    const response = await realFetch(base + path, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  }
  async function signup() {
    const password = randomBytes(24).toString("hex");
    const result = await call("/api/auth/signup", { method: "POST", body: {
      name: "Briefing test", email: `briefing-${randomBytes(12).toString("hex")}@example.test`, password, confirmPassword: password,
    } });
    userIds.push(result.data.user.id);
    return result.data;
  }
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

  before(async () => {
    for (const key of ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"]) savedEnv[key] = process.env[key];
    Object.assign(process.env, { AI_BASE_URL: "https://ai.example.test/v1", AI_API_KEY: "test-key", AI_MODEL: "test-model" });
    // Outside services are faked; requests to the test server pass through.
    globalThis.fetch = async (url, options) => {
      const { hostname, pathname } = new URL(url);
      if (hostname === "127.0.0.1") return realFetch(url, options);
      if (hostname === "ai.example.test") {
        aiCalls++;
        return json({ choices: [{ message: { content: JSON.stringify(aiAnswer) } }] }, aiStatus);
      }
      if (pathname === "/v1/elevation") return json({ elevation: Array(12).fill(0).map((_, i) => 300 + i) });
      if (hostname === "overpass-api.de") return json({ elements: [{ lat: 33.75, lon: -84.388, tags: { name: "Test Park", leisure: "park" } }] });
      if (pathname === "/v1/forecast") return json({ current: { temperature_2m: 70.4, relative_humidity_2m: 50, wind_speed_10m: 4.6 } });
      if (pathname === "/v1/air-quality") return json({ current: { us_aqi: 40 } });
      throw new Error(`Unexpected request to ${url}`);
    };
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    base = `http://127.0.0.1:${server.address().port}`;
    alice = await signup();
    bob = await signup();
    route = (await call("/api/routes", { method: "POST", token: alice.token, body: { name: "North", points: north } })).data;
  });
  after(async () => {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries(savedEnv))
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    for (const id of userIds) await getDatabase().execute("DELETE FROM users WHERE id = ?", [id]);
    await closeDatabase();
    await new Promise((resolve) => server.close(resolve));
  });

  test("requires a session and the route's owner", async () => {
    assert.equal((await call(`/api/routes/${route.routeId}/briefing`, { method: "POST" })).status, 401);
    for (const id of [route.routeId, "abc"]) {
      const denied = await call(`/api/routes/${id}/briefing`, { method: "POST", token: bob.token });
      assert.equal(denied.status, 404);
      assert.equal(denied.error.code, "ROUTE_NOT_FOUND");
    }
  });

  test("briefs from gathered facts and drops hazards nobody reported", async () => {
    aiCalls = 0; aiStatus = 200;
    aiAnswer = { summary: "A gentle 0.69 mile climb.", terrain: "Climbs 36 ft.", highlights: ["Test Park"],
      hazards: ["Invented pothole"], tips: ["Bring water."] };
    const result = await call(`/api/routes/${route.routeId}/briefing`, { method: "POST", token: alice.token });
    assert.equal(result.status, 200);
    const { generatedAt, facts, ...briefing } = result.data;
    assert.deepEqual(briefing, { routeId: route.routeId, summary: "A gentle 0.69 mile climb.", terrain: "Climbs 36 ft.",
      highlights: ["Test Park"], hazards: [], tips: ["Bring water."], model: "test-model" });
    assert.match(generatedAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.deepEqual(facts.highlights, [{ name: "Test Park", kind: "park" }]);
    assert.deepEqual(facts.weather, { temperature: 70, humidity: 50, wind: 5, aqi: 40 });
    assert.equal(facts.terrain.climbFeet, 36);
    assert.deepEqual(facts.hazards, []);
    assert.equal(aiCalls, 1);
  });

  test("a rate-limited AI service returns a readable 429", async () => {
    await getDatabase().execute("DELETE FROM route_briefings WHERE route_id = ?", [route.routeId]).catch(() => {});
    aiStatus = 429;
    const result = await call(`/api/routes/${route.routeId}/briefing`, { method: "POST", token: alice.token });
    assert.equal(result.status, 429);
    assert.equal(result.error.code, "AI_RATE_LIMITED");
  });
});
