import { test } from "node:test";
import assert from "node:assert/strict";
import { applyStopResult, failureNotice } from "../src/logic/stops.js";

const stops = [
  { seq: 1, orderId: "A", status: "delivered" },
  { seq: 2, orderId: "B", status: "next" },
  { seq: 3, orderId: "C", status: "pending" },
];

test("a failed stop moves the next marker to the following stop", () => {
  const { stops: out, runDone } = applyStopResult(stops, "B", "failed");
  assert.deepEqual(
    out.map((s) => s.status),
    ["delivered", "failed", "next"]
  );
  assert.equal(runDone, false);
  assert.equal(stops[1].status, "next", "input is not changed");
});

test("the run is done when every stop is delivered or failed", () => {
  const two = applyStopResult(stops, "B", "delivered").stops;
  const { runDone } = applyStopResult(two, "C", "failed");
  assert.equal(runDone, true);
});

test("a failed stop can be delivered later (driver came back)", () => {
  const failed = applyStopResult(stops, "B", "failed").stops;
  const { stops: out } = applyStopResult(failed, "B", "delivered");
  assert.equal(out[1].status, "delivered");
});

test("store notice explains the reason and what happens next", () => {
  const retry = failureNotice({ issue: "store_closed", goods: "retry" });
  assert.match(retry.body, /shutter was down/);
  assert.match(retry.body, /try again on the way back/);
  const back = failureNotice({ issue: "refused", note: "Manager not in", goods: "return" });
  assert.match(back.body, /refused/);
  assert.match(back.body, /Manager not in/);
  assert.match(back.body, /back to the depot/);
});

test("unknown reason still gives a readable notice", () => {
  assert.match(failureNotice({ issue: "xyz" }).body, /problem at the stop/);
});
