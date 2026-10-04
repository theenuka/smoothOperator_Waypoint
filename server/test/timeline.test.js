// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { orderTimeline } from "../src/logic/timeline.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const steps = (o) => orderTimeline(o, seed).map((s) => `${s.step}:${s.done}`);

test("a delivered order on today's run shows every step done", () => {
  const dlv = seed.deliveries.find((x) => x.status === "delivered");
  const o = seed.orders.find((x) => x.id === dlv.orderId);
  assert.deepEqual(steps(o), ["placed:true", "planned:true", "loaded:true", "out:true", "delivered:true"]);
  assert.equal(orderTimeline(o, seed).at(-1).at, dlv.recordedAt);
});

test("a deferred order stops at the deferral", () => {
  const def = seed.deferrals.find((x) => !x.reversed);
  const o = { id: def.orderId, placedAt: "2026-09-17T10:00:00+05:30" };
  const t = orderTimeline(o, seed);
  assert.deepEqual(
    t.map((s) => s.step),
    ["placed", "deferred"]
  );
  assert.equal(t[1].at, def.at);
});

test("a new order is only placed, the rest is still to come", () => {
  const o = { id: "ORD-NEW", placedAt: "2026-09-29T09:00:00+05:30" };
  assert.deepEqual(steps(o), [
    "placed:true",
    "planned:false",
    "loaded:false",
    "out:false",
    "delivered:false",
  ]);
});
