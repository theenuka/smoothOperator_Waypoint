// Runs API (a run = one vehicle's route for a day). Owner: BACKEND B.  Contract: docs/API_CONTRACT.md#runs
import { Router } from "express";
import { db } from "../db.js";
import { httpError, outletName } from "./_util.js";

const r = Router();

function expand(d, run) {
  return {
    ...run,
    vehicle: d.vehicles.find((v) => v.id === run.vehicleId),
    stops: run.stops.map((s) => {
      const order = d.orders.find((o) => o.id === s.orderId);
      const outlet = d.outlets.find((o) => o.id === s.outletId);
      const shortfalls = (d.loads[run.id]?.shortfalls || []).filter((x) => x.orderId === s.orderId);
      return { ...s, outletName: outletName(d, s.outletId), outlet, order, shortfalls };
    }),
  };
}

// GET /api/runs?date=2026-09-29&vehicleId=VEH022
r.get("/", (req, res) => {
  const d = db();
  let list = d.runs;
  if (req.query.date) list = list.filter((x) => x.date === req.query.date);
  if (req.query.vehicleId) list = list.filter((x) => x.vehicleId === req.query.vehicleId);
  res.json(list.map((x) => expand(d, x)));
});

r.get("/:id", (req, res, next) => {
  const d = db();
  const run = d.runs.find((x) => x.id === req.params.id);
  if (!run) return next(httpError(404, "Run not found"));
  res.json(expand(d, run));
});

export default r;
