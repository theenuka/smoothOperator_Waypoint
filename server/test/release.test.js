import { test } from "node:test";
import assert from "node:assert/strict";
import { planRelease } from "../src/logic/release.js";

const line = { sku: "SKU-1", name: "Milk", qty: 4, unit: "crate" };
const order = (id, outletId, chilled, kg = 100, status = "placed") => ({
  id,
  outletId,
  chilled,
  kg,
  status,
  deliveryDate: "2026-10-05",
  lines: [line],
});
const vehicles = [
  { id: "VEH014", type: "reefer", slots: 2, capacityKg: 1100, status: "on_road", driver: "S. Kumara" },
  { id: "VEH031", type: "reefer", slots: 2, capacityKg: 1100, status: "workshop" },
  { id: "VEH037", type: "dry", slots: 0, capacityKg: 300, status: "at_depot", driver: "D. Pathirana" },
];

test("chilled orders fill reefer slots in fairness order; the workshop truck is skipped", () => {
  const orders = [order("A", "OUT1", true), order("B", "OUT2", true), order("C", "OUT3", true)];
  const r = planRelease({ date: "2026-10-05", orders, vehicles, runs: [], chilledOrder: ["C", "A", "B"] });
  assert.equal(r.runs.length, 1);
  assert.deepEqual(
    r.runs[0].stops.map((s) => s.orderId),
    ["C", "A"]
  );
  assert.deepEqual(r.left, ["B"]);
});

test("dry orders go on dry trucks within capacity, and each truck gets a free bay with a load list", () => {
  const orders = [order("D", "OUT4", false, 200), order("E", "OUT5", false, 200)];
  const r = planRelease({ date: "2026-10-05", orders, vehicles, runs: [], busyBays: ["01", "02"] });
  assert.equal(r.runs[0].vehicleId, "VEH037");
  assert.equal(r.runs[0].bay, "03");
  assert.deepEqual(r.left, ["E"]);
  assert.equal(r.loads[r.runs[0].id].lines[0].planned, 4);
  assert.equal(r.loads[r.runs[0].id].status, "loading");
});

test("sending twice changes nothing: orders already on a run and deferred orders are left alone", () => {
  const orders = [order("A", "OUT1", true), order("F", "OUT6", true, 100, "deferred")];
  const first = planRelease({ date: "2026-10-05", orders, vehicles, runs: [] });
  const again = planRelease({ date: "2026-10-05", orders, vehicles, runs: first.runs });
  assert.equal(first.runs.length, 1);
  assert.equal(again.runs.length, 0);
  assert.deepEqual(first.left, []);
});
