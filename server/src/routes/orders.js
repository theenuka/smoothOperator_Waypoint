// Orders API.  Contract: docs/API_CONTRACT.md#orders
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { applyCutoff } from "../logic/cutoff.js";
import { httpError, wrap, outletName } from "./_util.js";
import { orderProblem } from "../logic/orderCheck.js";

const r = Router();

// POST /api/orders check runs first: unknown store, no items or qty <= 0 get a 400 with a clear message.
r.post("/", (req, res, next) => {
  const problem = orderProblem(req.body, db().outlets);
  if (problem) return next(httpError(400, problem));
  next();
});

// GET /api/orders?date=YYYY-MM-DD&outletId=OUT014&status=placed
r.get("/", (req, res) => {
  const { date, outletId, status } = req.query;
  let list = db().orders;
  if (date) list = list.filter((o) => o.deliveryDate === date);
  if (outletId) list = list.filter((o) => o.outletId === outletId);
  if (status) list = list.filter((o) => o.status === status);
  res.json(list.map((o) => ({ ...o, outletName: outletName(db(), o.outletId) })));
});

r.get("/:id", (req, res, next) => {
  const o = db().orders.find((x) => x.id === req.params.id);
  if (!o) return next(httpError(404, "Order not found"));
  const d = db();
  res.json({
    ...o,
    outletName: outletName(d, o.outletId),
    deferrals: d.deferrals.filter((x) => x.orderId === o.id),
    deliveries: d.deliveries.filter((x) => x.orderId === o.id),
    shortfalls: Object.values(d.loads)
      .flatMap((l) => l.shortfalls)
      .filter((s) => s.orderId === o.id),
  });
});

// POST /api/orders  { outletId, deliveryDate, chilled, lines:[{sku,name,qty,unit}] }
r.post(
  "/",
  wrap((req, res) => {
    const { outletId, deliveryDate: wanted, chilled = false, lines = [] } = req.body || {};
    if (!outletId || !wanted || !lines.length)
      throw httpError(400, "outletId, deliveryDate and lines are required");
    // After the cutoff (16:00 Sri Lanka time) a next-day order moves to the day after.
    const { deliveryDate, cutoffMoved } = applyCutoff({
      deliveryDate: wanted,
      cutoff: db().meta.cutoff,
    });
    const order = {
      id: newId("ORD"),
      outletId,
      deliveryDate,
      chilled,
      lines,
      kg: lines.reduce((s, l) => s + (l.kg || 10) * l.qty, 0),
      status: "placed",
      placedAt: nowIso(),
    };
    db().orders.push(order);
    save();
    publish("order.placed", {
      orderId: order.id,
      outletId,
      outletName: outletName(db(), outletId),
      deliveryDate,
    });
    res.status(201).json(cutoffMoved ? { ...order, cutoffMoved } : order);
  })
);

export default r;
