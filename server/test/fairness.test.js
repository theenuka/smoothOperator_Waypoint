// Run with: npm test   (uses Node's built-in test runner, nothing to install)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rankForSlots } from "../src/logic/fairness.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const planDate = seed.meta.planDate;
const orders = seed.orders.filter((o) => o.deliveryDate === planDate && o.chilled);
const slots = seed.vehicles
  .filter((v) => v.type === "reefer" && v.status !== "workshop")
  .reduce((s, v) => s + v.slots, 0);
const run = () =>
  rankForSlots({
    orders,
    slots,
    deferrals: seed.deferrals,
    lastChilled: seed.history.lastChilledDelivery,
    planDate,
  });

test("seed has 8 chilled orders and 5 working reefer slots", () => {
  assert.equal(orders.length, 8);
  assert.equal(slots, 5);
});

test("outlets deferred on the last run are protected (OUT045, OUT058)", () => {
  const rows = run();
  for (const id of ["OUT045", "OUT058"]) {
    const r = rows.find((x) => x.outletId === id);
    assert.equal(r.protected, true, id);
    assert.equal(r.suggestion, "serve", id);
  }
});

test("Dehiwala (OUT014) waited twice in 14 days, so it is protected", () => {
  const r = run().find((x) => x.outletId === "OUT014");
  assert.equal(r.protected, true);
  assert.equal(r.deferrals14d, 2);
});

test("longest gap is served next, and exactly 3 outlets wait", () => {
  const rows = run();
  assert.equal(rows.find((x) => x.outletId === "OUT031").suggestion, "serve");
  const waiting = rows
    .filter((x) => x.suggestion === "wait")
    .map((x) => x.outletId)
    .sort();
  assert.deepEqual(waiting, ["OUT022", "OUT036", "OUT067"]);
});

test("a reversed deferral does not count", () => {
  const deferrals = seed.deferrals.map((d) => (d.outletId === "OUT045" ? { ...d, reversed: true } : d));
  const r = rankForSlots({
    orders,
    slots,
    deferrals,
    lastChilled: seed.history.lastChilledDelivery,
    planDate,
  }).find((x) => x.outletId === "OUT045");
  assert.equal(r.protected, false);
});

test("wait rows say when the order goes instead (the next day); serve rows do not", () => {
  for (const r of run()) {
    if (r.suggestion === "wait") assert.equal(r.waitsUntil, "2026-10-01", r.outletId);
    else assert.equal(r.waitsUntil, undefined, r.outletId);
  }
});
