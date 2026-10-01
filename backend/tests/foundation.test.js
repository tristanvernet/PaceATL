import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { validateAuth } from "../../frontend/src/features/auth/validation.js";
let server, base;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
test("frontend health contract works without database configuration", async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, "ok");
});
test("unknown API routes do not fall through to frontend HTML", async () => {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
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
