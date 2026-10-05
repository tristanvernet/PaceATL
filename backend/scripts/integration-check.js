import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { app } from "../src/app.js";
import { getDatabase, closeDatabase } from "../src/database.js";
import { tokenHash } from "../src/features/auth/service.js";

const database = getDatabase();
const userIds = [];
let server, base;
async function start() {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  base = `http://127.0.0.1:${server.address().port}`;
}
async function call(path, { body, token, method = "GET" } = {}) {
  const response = await fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, ...(await response.json()) };
}
try {
  await start();
  const tutorials = await call("/api/tutorials");
  assert.equal(tutorials.status, 200); assert.ok(tutorials.data.length >= 3);
  const id = tutorials.data[0].tutId;
  assert.equal((await call(`/api/tutorials/${id}/complete`, { method: "POST", body: { userId: 1 } })).status, 401);
  const accounts = [];
  for (let i = 0; i < 2; i++) {
    const body = { name: "Integration check", email: `check-${randomBytes(12).toString("hex")}@example.test`,
      password: randomBytes(24).toString("hex"), };
    body.confirmPassword = body.password;
    const result = await call("/api/auth/signup", { method: "POST", body });
    assert.equal(result.status, 201);
    userIds.push(result.data.user.id);
    accounts.push({ ...result.data, body });
    assert.ok(!("password_hash" in result.data.user));
  }
  const [first, second] = accounts;
  const [stored] = await database.execute("SELECT password_hash FROM users WHERE id = ?", [first.user.id]);
  assert.match(stored[0].password_hash, /^scrypt\$/);
  assert.notEqual(stored[0].password_hash, first.body.password);
  const [sessions] = await database.execute("SELECT token_hash FROM user_sessions WHERE user_id = ?", [first.user.id]);
  assert.equal(sessions[0].token_hash, tokenHash(first.token));
  assert.equal((await call("/api/auth/signup", { method: "POST", body: first.body })).status, 409);
  assert.equal((await call("/api/auth/login", { method: "POST", body: { email: first.body.email, password: "wrong password" } })).status, 401);
  const login = await call("/api/auth/login", { method: "POST", body: { email: first.body.email.toUpperCase(), password: first.body.password } });
  assert.equal(login.status, 200);
  assert.equal((await call("/api/auth/me", { token: login.data.token })).data.id, first.user.id);
  const saved = await call(`/api/tutorials/${id}/complete`, { method: "POST", token: first.token, body: { userId: second.user.id } });
  assert.equal(saved.status, 201); assert.equal(saved.data.userId, first.user.id);
  const again = await call(`/api/tutorials/${id}/complete`, { method: "POST", token: first.token });
  assert.equal(again.data.completionId, saved.data.completionId);
  assert.equal((await call(`/api/tutorials/${id}`, { token: second.token })).data.completed, false);
  assert.equal((await call("/api/rewards")).status, 401);
  assert.equal((await call("/api/rewards/activity", {method:"POST", body:{activityType:"run",distanceMiles:5,durationMinutes:60}})).status,401);
  const initial = await call("/api/rewards", {token:first.token});
  assert.equal(initial.data.stats.workoutCount,0);
  assert.equal((await call("/api/rewards/activity", {method:"POST", token:first.token, body:{activityType:"run",distanceMiles:-1,durationMinutes:20}})).status,400);
  const award = await call("/api/rewards/activity", {method:"POST", token:first.token, body:{userId:second.user.id,activityType:"run",distanceMiles:5,durationMinutes:60}});
  assert.equal(award.status,201);
  assert.deepEqual(award.data.unlocked.map(b=>b.key),["first_workout","five_miles","hour_active"]);
  const parallel = await Promise.all(Array.from({length:4},()=>call("/api/rewards/activity", {method:"POST",token:first.token,body:{activityType:"walk",distanceMiles:0,durationMinutes:1}})));
  assert.ok(parallel.every(r=>r.status===201));
  assert.equal(parallel.flatMap(r=>r.data.unlocked).filter(b=>b.key==="five_workouts").length,1);
  const totals=await call("/api/rewards", {token:first.token});
  assert.deepEqual(totals.data.stats,{workoutCount:5,totalDistanceMiles:5,totalMinutes:64});
  assert.equal(totals.data.achievements.filter(b=>b.unlocked).length,4);
  assert.equal((await call("/api/rewards",{token:second.token})).data.stats.workoutCount,0);
  await new Promise((resolve) => server.close(resolve));
  await closeDatabase();
  await start();
  assert.equal((await call("/api/rewards",{token:first.token})).data.achievements.filter(b=>b.unlocked).length,4);
  assert.equal((await call(`/api/tutorials/${id}`, { token: first.token })).data.completed, true);
  assert.equal((await call("/api/auth/logout", { method: "POST", token: first.token })).status, 200);
  assert.equal((await call("/api/auth/me", { token: first.token })).status, 401);
  await getDatabase().execute("UPDATE user_sessions SET expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE token_hash = ?", [tokenHash(second.token)]);
  assert.equal((await call("/api/auth/me", { token: second.token })).status, 401);
  console.log("Live MySQL checks passed: signup, hashed passwords/tokens, duplicate email, login, account ownership, persistent completion, reward thresholds, concurrent badge awards, account isolation, reward persistence, server restart, logout and expiry.");
} catch (error) {
  console.error(`Integration check failed (${error.code || error.name}). No credentials were logged.`);
  process.exitCode = 1;
} finally {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  // Only records created by this invocation are disposable; never clear shared tables.
  for (const id of userIds) {
    await getDatabase().execute("DELETE FROM completed_tutorials WHERE user_id = ?", [id]);
    await getDatabase().execute("DELETE FROM users WHERE id = ?", [id]);
  }
  await closeDatabase();
}
