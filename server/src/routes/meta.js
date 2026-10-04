// Reference data + demo controls.
import { Router } from "express";
import { db, reset } from "../db.js";
import { publish } from "../events.js";
const r = Router();

// GET /api/meta  -> company, depots, outlets, vehicles
r.get("/", (req, res) => {
  const d = db();
  res.json({ meta: d.meta, depots: d.depots, outlets: d.outlets, vehicles: d.vehicles });
});

// GET /api/meta/events?limit=50  -> newest first (audit log)
r.get("/events", (req, res) => res.json(db().events.slice(0, Number(req.query.limit || 50))));

// POST /api/meta/reset  -> put the demo data back (use before every demo run)
r.post("/reset", (req, res) => {
  reset();
  publish("demo.reset", {});
  res.json({ ok: true });
});

export default r;
