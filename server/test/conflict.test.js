import { test } from "node:test";
import assert from "node:assert/strict";
import { detectConflict } from "../src/logic/conflict.js";

const phone = {
  clientId: "c1",
  orderId: "ORD41803",
  status: "delivered",
  recordedAt: "2026-09-29T08:52:00+05:30",
};

test("no server change: no conflict", () => {
  assert.equal(detectConflict(phone, { status: "loaded" }).conflict, false);
});

test("dispatch deferred the order while the phone delivered it: conflict", () => {
  const r = detectConflict(phone, {
    status: "deferred",
    changedAt: "2026-09-29T08:47:00+05:30",
    changedBy: "Kavindi Perera",
  });
  assert.equal(r.conflict, true);
  assert.equal(r.why, "moved_before_delivery");
});

test("server already says delivered but phone says failed: conflict", () => {
  assert.equal(detectConflict({ ...phone, status: "failed" }, { status: "delivered" }).conflict, true);
});

test("both say delivered: no conflict", () => {
  assert.equal(detectConflict(phone, { status: "delivered" }).conflict, false);
});
