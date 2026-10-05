import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { validateAuth } from "../../frontend/src/features/auth/validation.js";
let server, base;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
test("unimplemented feature endpoints return a clear not-found response", async () => {
  for (const route of ["/api/unimplemented"]) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, "NOT_FOUND");
  }
});
test("configured web preview can preflight a JSON API request", async () => {
  const response = await fetch(`${base}/api/health`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:8081",
      "Access-Control-Request-Method": "GET",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:8081",
  );
});
test("unconfigured web origins receive no cross-origin permission", async () => {
  const response = await fetch(`${base}/api/health`, {
    headers: { Origin: "https://unconfigured.example" },
  });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
test("frontend health contract works without database configuration", async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, "ok");
});
test("unknown API routes do not fall through to frontend HTML", async () => {
  const response = await fetch(`${base}/api/auth/unimplemented`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
test("tutorial completion requires a real authenticated session", async () => {
  const response = await fetch(`${base}/api/tutorials/tut-01/complete`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: 1 }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHORIZED");
});
test("backend rejects invalid account fields before database access", async () => {
  for (const route of ["signup", "login"]) {
    const response = await fetch(`${base}/api/auth/${route}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_INPUT");
  }
});
test("signup rejects invalid input and mismatched confirmation", () => {
  const errors = validateAuth(
    { name: "", email: "invalid", password: "short", confirmPassword: "other" },
    "signup",
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "confirmPassword",
    "email",
    "name",
    "password",
  ]);
});
test("login accepts existing passwords without imposing signup rules", () => {
  assert.deepEqual(
    validateAuth(
      { email: "member@example.com", password: "existing" },
      "login",
    ),
    {},
  );
});
