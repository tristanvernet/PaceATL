import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { app } from "../src/app.js";
import { databaseOptions, getDatabase, closeDatabase } from "../src/database.js";

let skip = false;
try { databaseOptions(); } catch (error) { skip = `needs MySQL: ${error.message}`; }

describe("saved routes API", { skip }, () => {
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
      name: "Routes test", email: `routes-${randomBytes(12).toString("hex")}@example.test`, password, confirmPassword: password,
    } });
    assert.equal(result.status, 201);
    userIds.push(result.data.user.id);
    return result.data;
  }
  const atlanta = [{ latitude: 33.749, longitude: -84.388 }, { latitude: 33.759, longitude: -84.388 }];

  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    base = `http://127.0.0.1:${server.address().port}`;
    alice = await signup();
    bob = await signup();
  });
  after(async () => {
    for (const id of userIds) await getDatabase().execute("DELETE FROM users WHERE id = ?", [id]);
    await closeDatabase();
    await new Promise((resolve) => server.close(resolve));
  });

  test("every endpoint requires a session", async () => {
    for (const request of [{}, { method: "POST", body: { name: "Loop", points: atlanta } }, { method: "DELETE" }]) {
      const path = request.method === "DELETE" ? "/api/routes/1" : "/api/routes";
      const result = await call(path, request);
      assert.equal(result.status, 401);
      assert.equal(result.error.code, "UNAUTHORIZED");
    }
  });

  test("invalid name or points are rejected with the first validation message", async () => {
    const cases = [
      [{ name: "  ", points: atlanta }, "Name your route (up to 80 characters)."],
      [{ name: "x".repeat(81), points: atlanta }, "Name your route (up to 80 characters)."],
      [{ name: "Loop", points: [atlanta[0]] }, "Draw a route with 2 to 500 points."],
      [{ name: "Loop", points: [atlanta[0], { latitude: "33.7", longitude: -84.3 }] }, "Every route point needs a valid latitude and longitude."],
    ];
    for (const [body, message] of cases) {
      const result = await call("/api/routes", { method: "POST", token: alice.token, body });
      assert.equal(result.status, 400);
      assert.deepEqual(result.error, { code: "INVALID_ROUTE", message });
    }
  });

  test("routes are owned by the session user with server-computed distance", async () => {
    const created = await call("/api/routes", { method: "POST", token: alice.token, body: {
      name: "  Peachtree loop ", userId: bob.user.id, distanceMeters: 5,
      points: [{ ...atlanta[0], accuracy: 4 }, atlanta[1]],
    } });
    assert.equal(created.status, 201);
    const { routeId, createdAt, ...rest } = created.data;
    assert.ok(Number.isInteger(routeId));
    assert.match(createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.deepEqual(rest, { name: "Peachtree loop", points: atlanta, distanceMeters: 1112 });

    const second = await call("/api/routes", { method: "POST", token: alice.token, body: { name: "Back", points: [...atlanta].reverse() } });
    assert.equal(second.status, 201);
    const aliceList = await call("/api/routes", { token: alice.token });
    assert.deepEqual(aliceList.data.map((route) => route.routeId), [second.data.routeId, routeId]);
    assert.deepEqual(aliceList.data[1], created.data);
    assert.deepEqual((await call("/api/routes", { token: bob.token })).data, []);

    for (const id of [routeId, "abc", "1.5"]) {
      const denied = await call(`/api/routes/${id}`, { method: "DELETE", token: bob.token });
      assert.equal(denied.status, 404);
      assert.equal(denied.error.code, "ROUTE_NOT_FOUND");
    }
    assert.deepEqual((await call("/api/routes", { token: alice.token })).data.map((route) => route.routeId), [second.data.routeId, routeId]);

    const deleted = await call(`/api/routes/${routeId}`, { method: "DELETE", token: alice.token });
    assert.equal(deleted.status, 200);
    assert.deepEqual(deleted.data, { routeId });
    assert.deepEqual((await call("/api/routes", { token: alice.token })).data.map((route) => route.routeId), [second.data.routeId]);
  });
});
