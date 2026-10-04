import { test } from "node:test";
import assert from "node:assert/strict";
import { resolution } from "../src/logic/resolve.js";

test("keeping the office version changes nothing", () => {
  assert.deepEqual(resolution({ phone: { status: "delivered" } }, "server"), { apply: false });
});

test("phone delivered while the office moved it: delivered, deferral reversed", () => {
  const r = resolution({ phone: { status: "delivered" } }, "phone");
  assert.equal(r.stopStatus, "delivered");
  assert.equal(r.orderStatus, "delivered");
  assert.equal(r.reverseDeferral, true);
});

test("phone failed while the office has a delivery: stop failed, office delivery superseded", () => {
  const r = resolution({ phone: { status: "failed", goods: "retry" } }, "phone");
  assert.equal(r.stopStatus, "failed");
  assert.equal(r.orderStatus, "loaded");
  assert.equal(r.supersedeOfficeDelivery, true);
  assert.equal(r.reverseDeferral, false);
  assert.equal(r.notice, true);
});

test("failed with goods returned to the depot: order goes back for re-planning", () => {
  assert.equal(resolution({ phone: { status: "failed", goods: "return" } }, "phone").orderStatus, "failed");
});

test("an old record without a status counts as delivered", () => {
  assert.equal(resolution({ phone: {} }, "phone").stopStatus, "delivered");
});
