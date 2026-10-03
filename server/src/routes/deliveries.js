// Deliveries API (proof of delivery). Owner: BACKEND B.  Contract: docs/API_CONTRACT.md#deliveries
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { detectConflict } from "../logic/conflict.js";
import { httpError, wrap, outletName } from "./_util.js";

const r = Router();

/**
 * Apply one delivery record from a phone. Idempotent: the same clientId twice is saved once.
 * Returns { status: "accepted" | "duplicate" | "conflict", delivery?, conflict? }
 */
export function applyDelivery(rec) {
  const d = db();
  if (!rec.clientId || !rec.orderId || !rec.runId)
    throw httpError(400, "clientId, runId and orderId are required");
  const existing = d.deliveries.find((x) => x.clientId === rec.clientId);
  if (existing) return { status: "duplicate", delivery: existing };

  const order = d.orders.find((o) => o.id === rec.orderId);
  if (!order) throw httpError(404, "Order not found");
  const server = { status: order.status, changedAt: order.changedAt, changedBy: order.changedBy };
  const check = detectConflict({ ...rec, status: rec.status || "delivered" }, server);
  if (check.conflict) {
    const deferral = [...d.deferrals].reverse().find((x) => x.orderId === order.id && !x.reversed);
    const conflict = {
      id: newId("CF"),
      clientId: rec.clientId,
      runId: rec.runId,
      orderId: order.id,
      outletId: order.outletId,
      outletName: outletName(d, order.outletId),
      phone: rec,
      server: { ...server, deferralId: deferral?.id, reason: deferral?.reason, toDate: deferral?.toDate },
      why: check.why,
      status: "open",
      at: nowIso(),
    };
    d.conflicts.push(conflict);
    save();
    publish("sync.conflict", { id: conflict.id, orderId: order.id, outletName: conflict.outletName });
    return { status: "conflict", conflict };
  }

  const delivery = { id: newId("DLV"), ...rec, status: rec.status || "delivered", syncedAt: nowIso() };
  d.deliveries.push(delivery);
  order.status = delivery.status === "delivered" ? "delivered" : order.status;
  const run = d.runs.find((x) => x.id === rec.runId);
  const stop = run?.stops.find((s) => s.orderId === rec.orderId);
  if (stop) stop.status = delivery.status;
  if (run) {
    const next = run.stops.find((s) => s.status === "pending");
    if (next && !run.stops.some((s) => s.status === "next")) next.status = "next";
  }
  save();
  publish("delivery.recorded", {
    orderId: order.id,
    outletName: outletName(d, order.outletId),
    runId: rec.runId,
    status: delivery.status,
    recordedAt: rec.recordedAt,
  });
  return { status: "accepted", delivery };
}

// GET /api/deliveries?runId=RUN-VEH022&outletId=OUT083
r.get("/", (req, res) => {
  let list = db().deliveries;
  if (req.query.runId) list = list.filter((x) => x.runId === req.query.runId);
  if (req.query.outletId) list = list.filter((x) => x.outletId === req.query.outletId);
  res.json(list);
});

// POST /api/deliveries  { clientId, runId, stopSeq, orderId, outletId, status, signedBy, photo, gps, items, recordedAt }
r.post(
  "/",
  wrap((req, res) => res.status(201).json(applyDelivery(req.body || {})))
);

export default r;
