import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { chat, AiError } from "../src/ai/client.js";

// A fake endpoint so these tests need no network or API key.
describe("AI client", () => {
  const realFetch = globalThis.fetch;
  const saved = {};
  let requests;
  function respond(status, body) {
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return new Response(JSON.stringify(body), { status });
    };
  }
  const answer = (content) => ({ choices: [{ message: { content } }] });

  beforeEach(() => {
    requests = [];
    for (const key of ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"]) saved[key] = process.env[key];
    Object.assign(process.env, { AI_BASE_URL: "https://ai.example.test/v1/", AI_API_KEY: "test-key", AI_MODEL: "test-model" });
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries(saved))
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
  });

  test("sends the model, messages and key and returns the text", async () => {
    respond(200, answer("Hello"));
    const messages = [{ role: "user", content: "Hi" }];
    assert.equal(await chat(messages), "Hello");
    const [{ url, options, body }] = requests;
    assert.equal(url, "https://ai.example.test/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    assert.deepEqual(body, { model: "test-model", messages });
  });

  test("requests and parses JSON, including fenced JSON", async () => {
    respond(200, answer('```json\n{"summary":"Flat loop"}\n```'));
    assert.deepEqual(await chat([], { json: true }), { summary: "Flat loop" });
    assert.deepEqual(requests[0].body.response_format, { type: "json_object" });
  });

  test("reports missing configuration without calling the service", async () => {
    delete process.env.AI_API_KEY;
    respond(200, answer("unused"));
    await assert.rejects(chat([]), { code: "AI_NOT_CONFIGURED", status: 503 });
    assert.equal(requests.length, 0);
  });

  test("maps service failures to readable errors", async () => {
    respond(429, {});
    await assert.rejects(chat([]), { code: "AI_RATE_LIMITED", status: 429 });
    respond(503, {});
    await assert.rejects(chat([]), { code: "AI_UNAVAILABLE", status: 502 });
    respond(200, answer("not json"));
    await assert.rejects(chat([], { json: true }), (error) => error instanceof AiError && error.code === "AI_BAD_RESPONSE");
    globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
    await assert.rejects(chat([]), { code: "AI_UNAVAILABLE" });
  });
});
