// Deliveries API (proof of delivery). Owner: BACKEND B.  Contract: docs/API_CONTRACT.md#deliveries
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { detectConflict } from "../logic/conflict.js";
import { applyStopResult, failureNotice, STOP_RESULTS } from "../logic/stops.js";
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
  if (rec.status && !STOP_RESULTS.includes(rec.status))
    throw httpError(400, `status must be one of: ${STOP_RESULTS.join(", ")}`);
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
  if (delivery.status === "delivered") order.status = "delivered";
  // Failed: "retry" keeps the order on the truck (driver comes back later), "return" sends it back for re-planning.
  if (delivery.status === "failed" && rec.goods === "return") order.status = "failed";

  const run = d.runs.find((x) => x.id === rec.runId);
  if (run) {
    const { stops, runDone } = applyStopResult(run.stops, rec.orderId, delivery.status);
    run.stops = stops;
    if (runDone) run.status = "done";
  }

  if (delivery.status === "failed") {
    const n = failureNotice(rec);
    d.notices.unshift({
      id: newId("NT"),
      outletId: order.outletId,
      type: "failed",
      ...n,
      at: nowIso(),
      read: false,
    });
  }
  save();
  publish("delivery.recorded", {
    orderId: order.id,
    outletName: outletName(d, order.outletId),
    runId: rec.runId,
    status: delivery.status,
    issue: rec.issue,
    goods: rec.goods,
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
