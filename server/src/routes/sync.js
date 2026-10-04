// Offline sync API.  Contract: docs/API_CONTRACT.md#sync
// The driver app keeps records in an outbox while offline and sends them here when signal returns.
import { Router } from "express";
import { db, save, nowIso, newId } from "../db.js";
import { publish } from "../events.js";
import { applyDelivery } from "./deliveries.js";
import { processBatch } from "../logic/syncBatch.js";
import { resolution } from "../logic/resolve.js";
import { applyStopResult, failureNotice } from "../logic/stops.js";
import { httpError, wrap } from "./_util.js";

const r = Router();

// POST /api/sync  { deviceId, records:[delivery records] }
//   -> { accepted:[clientId], duplicates:[clientId], conflicts:[conflict], errors:[{clientId, error}] }
// One bad record never stops the others (see logic/syncBatch.js).
r.post(
  "/",
  wrap((req, res) => {
    if (req.body?.records !== undefined && !Array.isArray(req.body.records))
      throw httpError(400, "records must be an array");
    res.json(processBatch(req.body?.records || [], applyDelivery));
  })
);

// GET /api/sync/conflicts?runId=RUN-VEH022&status=open
r.get("/conflicts", (req, res) => {
  let list = db().conflicts;
  if (req.query.runId) list = list.filter((c) => c.runId === req.query.runId);
  if (req.query.status) list = list.filter((c) => c.status === req.query.status);
  res.json(list);
});

// POST /api/sync/resolve  { conflictId, choice: "phone" | "server", by }
// "phone": the delivery happened. Save it and reverse the deferral. "server": keep dispatch's change.
r.post(
  "/resolve",
  wrap((req, res) => {
    const d = db();
    const { conflictId, choice, by = "Driver" } = req.body || {};
    const c = d.conflicts.find((x) => x.id === conflictId);
    if (!c) throw httpError(404, "Conflict not found");
    if (!["phone", "server"].includes(choice)) throw httpError(400, "choice must be phone or server");
    c.status = "resolved";
    c.choice = choice;
    c.resolvedBy = by;
    c.resolvedAt = nowIso();
    const plan = resolution(c, choice);
    if (plan.apply) {
      const order = d.orders.find((o) => o.id === c.orderId);
      order.status = plan.orderStatus;
      if (plan.stopStatus === "delivered")
        order.deliveryDate = c.phone.recordedAt?.slice(0, 10) || order.deliveryDate;
      const id = `DLV-${c.clientId}`;
      if (plan.supersedeOfficeDelivery)
        d.deliveries
          .filter((x) => x.orderId === c.orderId && x.status === "delivered" && !x.supersededBy)
          .forEach((x) => (x.supersededBy = id));
      d.deliveries.push({ id, ...c.phone, status: plan.stopStatus, syncedAt: nowIso() });
      if (plan.reverseDeferral) {
        const def = d.deferrals.find((x) => x.id === c.server.deferralId);
        if (def)
          Object.assign(def, {
            reversed: true,
            reversedAt: nowIso(),
            reversedBy: by,
            note: `Delivered at ${c.phone.recordedAt} while offline`,
          });
      }
      if (plan.notice) {
        const n = failureNotice(c.phone);
        d.notices.unshift({
          id: newId("NT"),
          outletId: c.outletId,
          type: "failed",
          ...n,
          at: nowIso(),
          read: false,
        });
      }
      const run = d.runs.find((x) => x.id === c.runId);
      if (run) {
        const { stops, runDone } = applyStopResult(run.stops, c.orderId, plan.stopStatus);
        run.stops = stops;
        if (runDone) run.status = "done";
      }
    }
    save();
    publish("sync.resolved", { conflictId: c.id, orderId: c.orderId, choice, by });
    res.json(c);
  })
);

export default r;
