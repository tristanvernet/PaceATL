import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, tokenHash } from "../src/features/auth/service.js";

test("password hashing is salted and rejects wrong or unsupported passwords", async () => {
  const password = "Synthetic test password 123!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(first.length <= 255);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(await verifyPassword(password, password), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(tokenHash("synthetic-token").length, 64);
});
