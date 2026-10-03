import { test } from "node:test";
import assert from "node:assert/strict";
import { planBackorder, nextDay } from "../src/logic/backorder.js";

const sf = {
  id: "SF-1",
  orderId: "ORD41803",
  outletId: "OUT083",
  sku: "SKU-3305",
  name: "Detergent powder, 1 kg",
  planned: 10,
  loaded: 6,
};
const today = { id: "ORD41803", outletId: "OUT083", deliveryDate: "2026-09-29", status: "loaded", lines: [] };
const base = {
  shortfall: sf,
  fromDate: "2026-09-29",
  unit: "carton",
  newOrderId: () => "ORD-NEW",
  now: "2026-09-29T05:38:00+05:30",
};

test("nextDay crosses month ends", () => {
  assert.equal(nextDay("2026-09-30"), "2026-10-01");
});

test("no open order after today: a new order for the next day is created", () => {
  const r = planBackorder({ ...base, orders: [today] });
  assert.equal(r.action, "created");
  assert.equal(r.order.deliveryDate, "2026-09-30");
  assert.deepEqual(r.order.lines, [
    {
      sku: "SKU-3305",
      name: "Detergent powder, 1 kg",
      qty: 4,
      unit: "carton",
      backorder: true,
      fromShortfall: "SF-1",
    },
  ]);
});

test("an open order already exists: the missing quantity is added to the earliest one", () => {
  const later = { id: "ORD-B", outletId: "OUT083", deliveryDate: "2026-10-02", status: "placed", lines: [] };
  const sooner = { id: "ORD-A", outletId: "OUT083", deliveryDate: "2026-10-01", status: "placed", lines: [] };
  const r = planBackorder({ ...base, orders: [today, later, sooner] });
  assert.equal(r.action, "added");
  assert.equal(r.order.id, "ORD-A");
  assert.equal(r.line.qty, 4);
});

test("another outlet's order or a delivered order is never used", () => {
  const other = { id: "ORD-X", outletId: "OUT075", deliveryDate: "2026-09-30", status: "placed", lines: [] };
  const done = {
    id: "ORD-Y",
    outletId: "OUT083",
    deliveryDate: "2026-09-30",
    status: "delivered",
    lines: [],
  };
  assert.equal(planBackorder({ ...base, orders: [today, other, done] }).action, "created");
});

test("running twice for the same shortfall does nothing the second time", () => {
  const withLine = {
    id: "ORD-A",
    outletId: "OUT083",
    deliveryDate: "2026-09-30",
    status: "placed",
    lines: [{ sku: "SKU-3305", fromShortfall: "SF-1" }],
  };
  assert.equal(planBackorder({ ...base, orders: [today, withLine] }).action, "none");
});

test("nothing missing: nothing to back-order", () => {
  assert.equal(planBackorder({ ...base, shortfall: { ...sf, loaded: 10 }, orders: [today] }).action, "none");
});
