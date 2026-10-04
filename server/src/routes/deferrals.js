// Deferrals API.  Contract: docs/API_CONTRACT.md#deferrals
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { httpError, wrap, outletName } from "./_util.js";

const r = Router();
const niceDate = (ymd) =>
  new Date(ymd + "T12:00:00+05:30").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Colombo",
  });

// GET /api/deferrals?outletId=OUT014   (the deferral log, newest first)
r.get("/", (req, res) => {
  const d = db();
  let list = [...d.deferrals].sort((a, b) => new Date(b.at) - new Date(a.at));
  if (req.query.outletId) list = list.filter((x) => x.outletId === req.query.outletId);
  res.json(list.map((x) => ({ ...x, outletName: outletName(d, x.outletId) })));
});

// POST /api/deferrals  { orderIds:[...], toDate, reason, decidedBy }
// Defers the orders, writes the log, and sends each store a plain-language notice.
r.post(
  "/",
  wrap((req, res) => {
    const { orderIds = [], toDate, reason, decidedBy = "Dispatcher" } = req.body || {};
    if (!orderIds.length || !toDate || !reason)
      throw httpError(400, "orderIds, toDate and reason are required");
    const d = db();
    const created = orderIds.map((id) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) throw httpError(404, `Order ${id} not found`);
      const def = {
        id: newId("DEF"),
        orderId: o.id,
        outletId: o.outletId,
        fromDate: o.deliveryDate,
        toDate,
        reason,
        decidedBy,
        at: nowIso(),
        reversed: false,
      };
      o.status = "deferred";
      o.changedAt = def.at;
      o.changedBy = decidedBy;
      o.deliveryDate = toDate;
      d.deferrals.push(def);
      const waits = d.deferrals.filter((x) => x.outletId === o.outletId && !x.reversed).length;
      d.notices.unshift({
        id: newId("NT"),
        outletId: o.outletId,
        type: "deferral",
        title: `Your order ${o.id} now arrives ${niceDate(toDate)}`,
        body: `${reason} You are protected on the next tight day.${waits >= 2 ? " This is not your first wait, so your next order goes to the front of the queue." : ""}`,
        at: def.at,
        read: false,
      });
      return def;
    });
    save();
    created.forEach((def) =>
      publish("deferral.decided", { ...def, outletName: outletName(d, def.outletId) })
    );
    res.status(201).json(created);
  })
);

// POST /api/deferrals/:id/reverse  { by, note }   (used when a sync conflict proves the delivery happened)
r.post(
  "/:id/reverse",
  wrap((req, res) => {
    const d = db();
    const def = d.deferrals.find((x) => x.id === req.params.id);
    if (!def) throw httpError(404, "Deferral not found");
    def.reversed = true;
    def.reversedAt = nowIso();
    def.reversedBy = req.body?.by || "Dispatcher";
    def.note = req.body?.note || "";
    save();
    publish("deferral.reversed", def);
    res.json(def);
  })
);

export default r;
