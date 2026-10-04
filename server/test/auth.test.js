// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { canAccess, verifyJwt, requireAuth, makeTokenCheck } from "../src/auth.js";

const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const ISS = "https://demo.supabase.co/auth/v1";
const claims = (extra = {}) => ({
  sub: "u1",
  email: "kavindi@demo.lk",
  aud: "authenticated",
  iss: ISS,
  exp: Math.floor(Date.now() / 1000) + 3600,
  app_metadata: { role: "dispatcher", name: "Kavindi Perera" },
  ...extra,
});
const hs256 = (payload, secret = "s3cret") => {
  const body = `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}`;
  return `${body}.${crypto.createHmac("sha256", secret).update(body).digest("base64url")}`;
};
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1" };
const es256 = (payload, kid = "k1") => {
  const body = `${enc({ alg: "ES256", typ: "JWT", kid })}.${enc(payload)}`;
  const sig = crypto.sign("sha256", Buffer.from(body), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${body}.${sig.toString("base64url")}`;
};

test("each role reaches only its own endpoints", () => {
  assert.ok(canAccess("dispatcher", "POST", "/deferrals"));
  assert.ok(canAccess("dispatcher", "POST", "/meta/reset"));
  assert.ok(canAccess("store", "POST", "/orders"));
  assert.ok(canAccess("store", "GET", "/deferrals"));
  assert.ok(canAccess("loader", "POST", "/loads/RUN-VEH022/shortfall"));
  assert.ok(canAccess("driver", "POST", "/sync"));
  assert.ok(canAccess("driver", "GET", "/meta/events"));

  assert.ok(!canAccess("store", "POST", "/deferrals"), "store cannot defer");
  assert.ok(!canAccess("store", "POST", "/meta/reset"), "only dispatcher resets");
  assert.ok(!canAccess("driver", "POST", "/orders"));
  assert.ok(!canAccess("loader", "GET", "/plan/suggest"));
  assert.ok(!canAccess("store", "POST", "/loads/RUN-VEH022/check"));
  assert.ok(!canAccess(undefined, "GET", "/runs"), "no role, no access");
  assert.ok(!canAccess("dispatcher", "GET", "/ordersX"), "prefix must be a whole segment");
  assert.ok(!canAccess("dispatcher", "GET", "/unknown"), "unlisted paths are refused");
});

test("HS256 token: good one passes, forged, expired or wrong issuer fail", () => {
  assert.equal(verifyJwt(hs256(claims()), { secret: "s3cret", issuer: ISS }).sub, "u1");
  assert.throws(() => verifyJwt(hs256(claims(), "other"), { secret: "s3cret" }), /signature/);
  assert.throws(() => verifyJwt(hs256(claims({ exp: 1 })), { secret: "s3cret" }), /expired/);
  assert.throws(
    () => verifyJwt(hs256(claims({ iss: "https://evil" })), { secret: "s3cret", issuer: ISS }),
    /issuer/
  );
  assert.throws(() => verifyJwt(hs256(claims({ aud: "anon" })), { secret: "s3cret" }), /signed-in/);
});

test("ES256 token (Supabase signing keys) checked against the JWKS", () => {
  assert.equal(verifyJwt(es256(claims()), { jwks: [jwk], issuer: ISS }).email, "kavindi@demo.lk");
  assert.throws(() => verifyJwt(es256(claims(), "unknown"), { jwks: [jwk] }), /signature/);
});

test("tricks are refused: alg none, HS256 without a secret, garbage", () => {
  const none = `${enc({ alg: "none" })}.${enc(claims())}.x`;
  assert.throws(() => verifyJwt(none, { jwks: [jwk] }), /signature/);
  assert.throws(() => verifyJwt(hs256(claims()), { jwks: [jwk] }), /signature/);
  assert.throws(() => verifyJwt("not-a-token", { secret: "s3cret" }), /Malformed/);
});

// Tiny fake req/res for the middleware.
const call = async (mw, { method = "GET", path = "/orders", auth } = {}) => {
  const req = { method, path, headers: auth ? { authorization: auth } : {} };
  const out = { status: 200, passed: false };
  const res = {
    status: (s) => ((out.status = s), res),
    json: (b) => ((out.body = b), res),
  };
  await mw(req, res, () => (out.passed = true));
  return { ...out, user: req.user };
};

test("auth is off when SUPABASE_URL is not set: everything passes", async () => {
  assert.equal(makeTokenCheck({ url: "" }), null);
  assert.equal((await call(requireAuth({ url: "" }))).passed, true);
});

test("auth on: no token 401, wrong role 403, right role passes with req.user", async () => {
  const mw = requireAuth({ url: "https://demo.supabase.co", secret: "s3cret" });
  assert.equal((await call(mw)).status, 401);
  assert.equal((await call(mw, { auth: "Bearer junk" })).status, 401);
  const store = hs256(claims({ app_metadata: { role: "store", outletId: "OUT014" } }));
  assert.equal((await call(mw, { method: "POST", path: "/deferrals", auth: `Bearer ${store}` })).status, 403);
  const ok = await call(mw, { method: "POST", path: "/orders", auth: `Bearer ${store}` });
  assert.equal(ok.passed, true);
  assert.equal(ok.user.outletId, "OUT014");
  assert.equal((await call(mw, { path: "/health" })).passed, true, "health stays open");
});
