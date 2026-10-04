// Planning API.  Contract: docs/API_CONTRACT.md#planning
import { Router } from "express";
import { db, save } from "../db.js";
import { publish } from "../events.js";
import { planRelease } from "../logic/release.js";
import { rankForSlots } from "../logic/fairness.js";
import { outletName, wrap, httpError } from "./_util.js";
import { liveDates } from "../logic/seedDates.js";

const r = Router();

// GET /api/plan?date=2026-09-30  -> chilled capacity and the orders competing for it
r.get("/", (req, res) => {
  const d = db();
  const date = req.query.date || liveDates().planDate;
  const reefers = d.vehicles.filter((v) => v.type === "reefer");
  const slots = reefers.filter((v) => v.status !== "workshop").reduce((s, v) => s + v.slots, 0);
  const totalSlots = reefers.reduce((s, v) => s + v.slots, 0);
  const chilled = d.orders.filter((o) => o.deliveryDate === date && o.chilled && o.status !== "deferred");
  res.json({
    date,
    chilled: { orders: chilled.length, slots, totalSlots, over: Math.max(0, chilled.length - slots) },
    reefers,
    orders: chilled.map((o) => ({ ...o, outletName: outletName(d, o.outletId) })),
    runs: d.runs.filter((x) => x.date === date),
    // Orders for the day that are not on a truck yet (sent to the dock with POST /plan/release)
    unsent: d.orders.filter(
      (o) =>
        o.deliveryDate === date &&
        ["placed", "planned"].includes(o.status) &&
        !d.runs.some((x) => x.stops.some((st) => st.orderId === o.id))
    ).length,
  });
});

// GET /api/plan/suggest?date=2026-09-30  -> fairness ranking (who should wait)
r.get("/suggest", (req, res) => {
  const d = db();
  const date = req.query.date || liveDates().planDate;
  const slots = d.vehicles
    .filter((v) => v.type === "reefer" && v.status !== "workshop")
    .reduce((s, v) => s + v.slots, 0);
  const orders = d.orders.filter((o) => o.deliveryDate === date && o.chilled && o.status !== "deferred");
  const ranked = rankForSlots({
    orders,
    slots,
    deferrals: d.deferrals,
    lastChilled: d.history.lastChilledDelivery,
    planDate: date,
  });
  res.json({
    date,
    slots,
    rule: [
      "Outlets deferred on either of the last two runs, or twice in 14 days, are protected.",
      "Next, the longest gap since the last chilled delivery is served first.",
      "On a tie, the smaller order waits.",
    ],
    rows: ranked.map((x) => ({
      ...x,
      outletName: outletName(d, x.outletId),
      lastChilled: d.history.lastChilledDelivery[x.outletId],
    })),
  });
});

// POST /api/plan/release { date }  -> puts the day's orders on trucks and sends them to the dock
r.post(
  "/release",
  wrap((req, res) => {
    const d = db();
    const date = req.body?.date || liveDates().planDate;
    const chilled = d.orders.filter((o) => o.deliveryDate === date && o.chilled && o.status !== "deferred");
    const slots = d.vehicles
      .filter((v) => v.type === "reefer" && v.status !== "workshop")
      .reduce((s, v) => s + v.slots, 0);
    if (chilled.length > slots)
      throw httpError(
        409,
        `${chilled.length - slots} chilled orders have no reefer slot. Decide who waits first.`
      );
    const ranked = rankForSlots({
      orders: chilled,
      slots,
      deferrals: d.deferrals,
      lastChilled: d.history.lastChilledDelivery,
      planDate: date,
    });
    const busyBays = d.runs.filter((x) => d.loads[x.id]?.status !== "sealed").map((x) => x.bay);
    const out = planRelease({
      date,
      orders: d.orders,
      vehicles: d.vehicles,
      runs: d.runs,
      chilledOrder: ranked.map((x) => x.orderId),
      busyBays,
    });
    d.runs.push(...out.runs);
    Object.assign(d.loads, out.loads);
    for (const o of d.orders) if (out.orderIds.includes(o.id)) o.status = "planned";
    save();
    if (out.runs.length)
      publish("plan.released", {
        date,
        trucks: out.runs.length,
        orders: out.orderIds.length,
        left: out.left.length,
      });
    res.status(201).json(out);
  })
);

export default r;
