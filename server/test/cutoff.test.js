// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCutoff } from "../src/logic/cutoff.js";

// Sri Lanka is UTC+05:30, so 16:00 in Colombo is 10:30 UTC.
const at = (iso) => applyCutoff({ deliveryDate: "2026-09-30", now: new Date(iso), cutoff: "16:00" });

test("before 16:00 the order keeps its date", () => {
  assert.deepEqual(at("2026-09-29T10:29:00Z"), { deliveryDate: "2026-09-30", cutoffMoved: false });
});

test("at or after 16:00 a next-day order moves to the day after", () => {
  assert.deepEqual(at("2026-09-29T10:30:00Z"), { deliveryDate: "2026-10-01", cutoffMoved: true });
  assert.deepEqual(at("2026-09-29T17:00:00Z"), { deliveryDate: "2026-10-01", cutoffMoved: true });
});

test("uses Sri Lanka date, not UTC date (00:15 in Colombo is still 18:45 UTC the day before)", () => {
  // 2026-09-29 00:15 in Colombo: next day is the 30th, but it is before 16:00, so no move
  assert.equal(at("2026-09-28T18:45:00Z").cutoffMoved, false);
});

test("orders further ahead are not touched", () => {
  const r = applyCutoff({ deliveryDate: "2026-10-02", now: new Date("2026-09-29T12:00:00Z") });
  assert.deepEqual(r, { deliveryDate: "2026-10-02", cutoffMoved: false });
});

test("month end rolls over correctly", () => {
  const r = applyCutoff({ deliveryDate: "2026-10-31", now: new Date("2026-10-30T11:00:00Z") });
  assert.deepEqual(r, { deliveryDate: "2026-11-01", cutoffMoved: true });
});
