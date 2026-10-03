import { test } from "node:test";
import assert from "node:assert/strict";
import { processBatch } from "../src/logic/syncBatch.js";

// A fake "database" that behaves like applyDelivery: duplicates by clientId, 404 for unknown orders.
function fakeApply(known = ["ORD41803", "ORD41804", "ORD41805"], conflictFor = []) {
  const saved = new Set();
  const calls = [];
  const apply = (rec) => {
    calls.push(rec.clientId);
    if (!known.includes(rec.orderId)) throw new Error("Order not found");
    if (saved.has(rec.clientId)) return { status: "duplicate" };
    if (conflictFor.includes(rec.orderId))
      return { status: "conflict", conflict: { clientId: rec.clientId } };
    saved.add(rec.clientId);
    return { status: "accepted" };
  };
  return { apply, calls };
}
const rec = (clientId, orderId, recordedAt) => ({
  clientId,
  orderId,
  runId: "RUN-VEH022",
  status: "delivered",
  recordedAt,
});

test("clean records are all accepted", () => {
  const { apply } = fakeApply();
  const out = processBatch([rec("a", "ORD41803", "08:52"), rec("b", "ORD41804", "09:50")], apply);
  assert.deepEqual(out.accepted, ["a", "b"]);
  assert.deepEqual(out.errors, []);
});

test("the same record twice in one batch is saved once", () => {
  const { apply, calls } = fakeApply();
  const out = processBatch([rec("a", "ORD41803", "08:52"), rec("a", "ORD41803", "08:52")], apply);
  assert.deepEqual(out.accepted, ["a"]);
  assert.deepEqual(out.duplicates, ["a"]);
  assert.equal(calls.length, 1, "second copy never reaches the database");
});

test("a record sent again in a later batch is a duplicate", () => {
  const { apply } = fakeApply();
  processBatch([rec("a", "ORD41803", "08:52")], apply);
  const out = processBatch([rec("a", "ORD41803", "08:52")], apply);
  assert.deepEqual(out.duplicates, ["a"]);
});

test("an unknown order gives an error for that record only, the rest still sync", () => {
  const { apply } = fakeApply();
  const out = processBatch(
    [rec("a", "ORD41803", "08:52"), rec("bad", "ORD-NOPE", "09:00"), rec("c", "ORD41805", "10:10")],
    apply
  );
  assert.deepEqual(out.accepted, ["a", "c"]);
  assert.deepEqual(out.errors, [{ clientId: "bad", error: "Order not found" }]);
});

test("records are applied oldest first, whatever order the phone sent them in", () => {
  const { apply, calls } = fakeApply();
  processBatch([rec("late", "ORD41805", "10:10"), rec("early", "ORD41803", "08:52")], apply);
  assert.deepEqual(calls, ["early", "late"]);
});

test("conflicts are returned, not dropped", () => {
  const { apply } = fakeApply(undefined, ["ORD41805"]);
  const out = processBatch([rec("a", "ORD41803", "08:52"), rec("k", "ORD41805", "10:12")], apply);
  assert.deepEqual(out.accepted, ["a"]);
  assert.equal(out.conflicts.length, 1);
});

test("an empty or missing batch is fine", () => {
  assert.deepEqual(
    processBatch(undefined, () => ({})),
    { accepted: [], duplicates: [], conflicts: [], errors: [] }
  );
});

test("garbage in the batch doesn't crash it", () => {
  const { apply } = fakeApply();
  const out = processBatch([null, rec("a", "ORD41803", "08:52")], apply);
  assert.deepEqual(out.accepted, ["a"]);
  assert.equal(out.errors.length, 1);
});
