// Dock and load API. Owner: BACKEND B.  Contract: docs/API_CONTRACT.md#loads
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { httpError, wrap, outletName } from "./_util.js";
import { planBackorder } from "../logic/backorder.js";

const r = Router();

function getLoad(runId) {
  const l = db().loads[runId];
  if (!l) throw httpError(404, "No load for this run");
  return l;
}

// GET /api/loads/:runId   -> lines (planned vs loaded) and shortfalls
r.get(
  "/:runId",
  wrap((req, res) => res.json(getLoad(req.params.runId)))
);

// POST /api/loads/:runId/check  { orderId, sku, loaded }
r.post(
  "/:runId/check",
  wrap((req, res) => {
    const l = getLoad(req.params.runId);
    const line = l.lines.find((x) => x.orderId === req.body.orderId && x.sku === req.body.sku);
    if (!line) throw httpError(404, "Line not found");
    line.loaded = Number(req.body.loaded);
    line.checked = true;
    save();
    res.json(line);
  })
);

// POST /api/loads/:runId/shortfall  { orderId, sku, loaded, reason, by }
// reason: short_on_dock | damaged | wrong_item | never_arrived
// The truck is NOT blocked. Everyone downstream is told, and the gap goes onto the next order.
r.post(
  "/:runId/shortfall",
  wrap((req, res) => {
    const d = db();
    const l = getLoad(req.params.runId);
    const { orderId, sku, loaded, reason = "short_on_dock", by = "Loader" } = req.body || {};
    const line = l.lines.find((x) => x.orderId === orderId && x.sku === sku);
    if (!line) throw httpError(404, "Line not found");
    line.loaded = Number(loaded);
    const order = d.orders.find((o) => o.id === orderId);
    const sf = {
      id: newId("SF"),
      orderId,
      outletId: order.outletId,
      sku,
      name: line.name,
      planned: line.planned,
      loaded: line.loaded,
      reason,
      by,
      at: nowIso(),
    };
    l.shortfalls.push(sf);
    const missing = sf.planned - sf.loaded;
    d.notices.unshift({
      id: newId("NT"),
      outletId: order.outletId,
      type: "shortfall",
      title: `${missing} ${line.name} arrive on the next delivery`,
      body: `${sf.loaded} of ${sf.planned} are on today's truck. The other ${missing} were short at the dock and are added to your next order.`,
      at: sf.at,
      read: false,
    });
    // Back-order: the missing quantity goes onto the outlet's next order (or a new one for tomorrow).
    const orderLine = order.lines.find((x) => x.sku === sku);
    const bo = planBackorder({
      orders: d.orders,
      shortfall: sf,
      fromDate: order.deliveryDate,
      unit: orderLine?.unit,
      newOrderId: () => newId("ORD"),
      now: sf.at,
    });
    if (bo.action === "added") {
      bo.order.lines.push(bo.line);
      bo.order.kg = (bo.order.kg || 0) + bo.line.qty * 10;
    }
    if (bo.action === "created") d.orders.push(bo.order);
    if (bo.order)
      sf.backorder = { orderId: bo.order.id, deliveryDate: bo.order.deliveryDate, qty: bo.line?.qty };
    save();
    publish("load.shortfall", { ...sf, outletName: outletName(d, order.outletId), runId: req.params.runId });
    res.status(201).json(sf);
  })
);

// POST /api/loads/:runId/complete  -> seal the truck
r.post(
  "/:runId/complete",
  wrap((req, res) => {
    const l = getLoad(req.params.runId);
    l.status = "sealed";
    l.sealedAt = nowIso();
    save();
    publish("load.completed", { runId: req.params.runId, shortfalls: l.shortfalls.length });
    res.json(l);
  })
);

export default r;
