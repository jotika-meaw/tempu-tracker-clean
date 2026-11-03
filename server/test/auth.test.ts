import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "../app.ts";
import { issueToken, resolveAuthSecret, verifyToken } from "../auth.ts";
import { DEMO_ACCOUNTS } from "../../shared/accounts.ts";
import {
  createFakeMetaClient,
  createMemoryStore,
  createTestAi,
  createTestConfig,
  validStartBody,
} from "./helpers.ts";

const driver = DEMO_ACCOUNTS.find((account) => account.role === "driver")!;
const passenger = DEMO_ACCOUNTS.find((account) => account.role === "passenger")!;

function setup() {
  const fake = createFakeMetaClient(async () => ({ output_text: "রুট ০১ চকবাজার যায়।" }));
  const config = createTestConfig({ authRequired: true });
  const app = createApp({
    config,
    store: createMemoryStore(),
    ai: createTestAi(fake.client),
    rateLimitEnabled: false,
  });
  return { app, fake };
}

async function signIn(app: ReturnType<typeof setup>["app"], account: { username: string; password: string }) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username: account.username, password: account.password });
  assert.equal(response.status, 200);
  return response.body as { token: string; user: { role: string; username: string }; expiresAt: string };
}

test("demo accounts sign in with their role and wrong passwords are rejected", async () => {
  const { app } = setup();

  const driverSession = await signIn(app, driver);
  assert.equal(driverSession.user.role, "driver");
  assert.equal(driverSession.user.username, "driver.demo");
  assert.ok(Date.parse(driverSession.expiresAt) > Date.now());

  const passengerSession = await signIn(app, passenger);
  assert.equal(passengerSession.user.role, "passenger");

  const wrong = await request(app)
    .post("/api/auth/login")
    .send({ username: driver.username, password: "not-the-password" });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error.code, "INVALID_CREDENTIALS");

  const unknown = await request(app).post("/api/auth/login").send({ username: "admin", password: "admin" });
  assert.equal(unknown.status, 401);

  const me = await request(app).get("/api/auth/me").set("X-Tempu-Auth", passengerSession.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.role, "passenger");
  assert.equal(JSON.stringify(me.body).includes(passenger.password), false);
});

test("only drivers can start GPS sharing", async () => {
  const { app } = setup();
  const driverSession = await signIn(app, driver);
  const passengerSession = await signIn(app, passenger);

  const anonymous = await request(app).post("/api/tracking/start").send(validStartBody());
  assert.equal(anonymous.status, 401);
  assert.equal(anonymous.body.error.code, "AUTH_REQUIRED");

  const asPassenger = await request(app)
    .post("/api/tracking/start")
    .set("X-Tempu-Auth", passengerSession.token)
    .send(validStartBody());
  assert.equal(asPassenger.status, 403);
  assert.equal(asPassenger.body.error.code, "ROLE_NOT_ALLOWED");

  const asDriver = await request(app)
    .post("/api/tracking/start")
    .set("X-Tempu-Auth", driverSession.token)
    .send(validStartBody());
  assert.equal(asDriver.status, 201);

  // The public live map stays readable without signing in.
  const active = await request(app).get("/api/tracking/active");
  assert.equal(active.status, 200);
  assert.equal(active.body.vehicles.length, 1);
});

test("only passengers can use the AI assistant and voice input", async () => {
  const { app, fake } = setup();
  const driverSession = await signIn(app, driver);
  const passengerSession = await signIn(app, passenger);
  const question = { message: "চকবাজার?", language: "bn" };

  const anonymous = await request(app).post("/api/ai-test").send(question);
  assert.equal(anonymous.status, 401);

  const asDriver = await request(app)
    .post("/api/ai-test")
    .set("X-Tempu-Auth", driverSession.token)
    .send(question);
  assert.equal(asDriver.status, 403);

  const voiceAsDriver = await request(app)
    .post("/api/transcribe")
    .set("X-Tempu-Auth", driverSession.token)
    .set("Content-Type", "application/octet-stream")
    .send(Buffer.alloc(16_000));
  assert.equal(voiceAsDriver.status, 403);
  assert.equal(fake.calls.length, 0);

  const asPassenger = await request(app)
    .post("/api/ai-test")
    .set("X-Tempu-Auth", passengerSession.token)
    .send(question);
  assert.equal(asPassenger.status, 200);
  assert.equal(fake.calls.length, 1);
});

test("tokens are rejected when tampered with, expired, or signed with another secret", () => {
  const secret = "secret-one";
  const now = new Date("2026-11-03T00:00:00.000Z");
  const user = { username: "driver.demo", role: "driver" as const, displayName: "Demo driver" };
  const { token } = issueToken(user, secret, now);

  assert.deepEqual(verifyToken(token, secret, now), user);
  assert.equal(verifyToken(token, "secret-two", now), null);
  assert.equal(verifyToken(token, secret, new Date(now.getTime() + 13 * 60 * 60 * 1000)), null);

  const [payload, signature] = token.split(".");
  const promoted = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), role: "passenger" })
  ).toString("base64url");
  assert.equal(verifyToken(`${promoted}.${signature}`, secret, now), null);
  assert.equal(verifyToken("garbage", secret, now), null);
});

test("auth secret prefers AUTH_SECRET, then a stable key-derived value", () => {
  assert.equal(resolveAuthSecret("explicit", "key"), "explicit");
  assert.equal(resolveAuthSecret(null, "key"), resolveAuthSecret(null, "key"));
  assert.notEqual(resolveAuthSecret(null, "key"), "key");
  assert.notEqual(resolveAuthSecret(null, null), resolveAuthSecret(null, null));
});

test("CORS allows the auth header", async () => {
  const { app } = setup();
  const preflight = await request(app)
    .options("/api/tracking/start")
    .set("Origin", "http://localhost:5173")
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type,x-tempu-auth");
  assert.equal(preflight.status, 204);
  assert.match(String(preflight.headers["access-control-allow-headers"]), /X-Tempu-Auth/i);
});
