// Deferrals API.  Contract: docs/API_CONTRACT.md#deferrals
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { httpError, wrap, outletName } from "./_util.js";
import { deferralNotice } from "../logic/noticeText.js";

const r = Router();

// Who signs a notice: the signed-in dispatcher (never a name sent by the browser), and the outlet's depot.
const signer = (req, d, outlet) => {
  const depot = d.depots.find((x) => x.id === outlet.depot)?.name;
  const who = req.user?.name ? [req.user.name, "dispatcher"] : ["Dispatch team"];
  return [...who, depot].filter(Boolean).join(", ");
};

const noticeFor = (req, d, order, toDate, reason) => {
  const outlet = d.outlets.find((x) => x.id === order.outletId) || {};
  return deferralNotice({
    order,
    outlet,
    toDate,
    reason,
    deferrals: d.deferrals,
    signedBy: signer(req, d, outlet),
  });
};

// GET /api/deferrals/preview?orderId=ORD41907&toDate=2026-10-01
// Exactly what the store will be told if this order moves (DP4 shows it before you confirm). Saves nothing.
r.get("/preview", (req, res, next) => {
  const { orderId, toDate } = req.query;
  const d = db();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return next(httpError(404, "Order not found"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate || "")) return next(httpError(400, "toDate must be YYYY-MM-DD"));
  res.json({
    orderId: o.id,
    outletId: o.outletId,
    outletName: outletName(d, o.outletId),
    toDate,
    ...noticeFor(req, d, o, toDate),
  });
});

// GET /api/deferrals?outletId=OUT014   (the deferral log, newest first)
r.get("/", (req, res) => {
  const d = db();
  let list = [...d.deferrals].sort((a, b) => new Date(b.at) - new Date(a.at));
  if (req.query.outletId) list = list.filter((x) => x.outletId === req.query.outletId);
  res.json(list.map((x) => ({ ...x, outletName: outletName(d, x.outletId) })));
});

// POST /api/deferrals  { orderIds:[...], toDate, reason }
// Defers the orders, writes the log, and sends each store a plain-language notice.
// decidedBy is the signed-in user; a decidedBy in the body is only used when there is none.
r.post(
  "/",
  wrap((req, res) => {
    const { orderIds = [], toDate, reason } = req.body || {};
    if (!orderIds.length || !toDate || !reason)
      throw httpError(400, "orderIds, toDate and reason are required");
    const decidedBy = req.user?.name || req.body.decidedBy || "Dispatcher";
    const d = db();
    // Check every order first, so a bad id changes nothing.
    const orders = orderIds.map((id) => d.orders.find((x) => x.id === id) || id);
    const missing = orders.find((o) => typeof o === "string");
    if (missing) throw httpError(404, `Order ${missing} not found`);
    const created = orders.map((o) => {
      const { suggestedReason, ...notice } = noticeFor(req, d, o, toDate, reason); // before the order moves
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
      d.notices.unshift({
        id: newId("NT"),
        outletId: o.outletId,
        type: "deferral",
        ...notice,
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
    def.reversedBy = req.user?.name || req.body?.by || "Dispatcher";
    def.note = req.body?.note || "";
    save();
    publish("deferral.reversed", def);
    res.json(def);
  })
);

export default r;
