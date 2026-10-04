// Planning API.  Contract: docs/API_CONTRACT.md#planning
import { Router } from "express";
import { db } from "../db.js";
import { rankForSlots } from "../logic/fairness.js";
import { outletName } from "./_util.js";

const r = Router();

// GET /api/plan?date=2026-09-30  -> chilled capacity and the orders competing for it
r.get("/", (req, res) => {
  const d = db();
  const date = req.query.date || d.meta.planDate;
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
  });
});

// GET /api/plan/suggest?date=2026-09-30  -> fairness ranking (who should wait)
r.get("/suggest", (req, res) => {
  const d = db();
  const date = req.query.date || d.meta.planDate;
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

export default r;
