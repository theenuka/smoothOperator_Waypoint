// Live tracking API.  Contract: docs/API_CONTRACT.md#tracking
import { Router } from "express";
import { db, save, nowIso } from "../db.js";
import { publish } from "../events.js";
import { httpError, wrap } from "./_util.js";
import { silentMinutes } from "../logic/runSummary.js";

const r = Router();

// GET /api/tracking  -> last known position, signal state and silentMinutes per vehicle
r.get("/", (req, res) => res.json(silentMinutes(db().positions)));

// POST /api/tracking/ping  { vehicleId, lat, lng }
r.post(
  "/ping",
  wrap((req, res) => {
    const { vehicleId, lat, lng } = req.body || {};
    if (!vehicleId) throw httpError(400, "vehicleId is required");
    const p = (db().positions[vehicleId] = {
      ...(db().positions[vehicleId] || {}),
      vehicleId,
      lat,
      lng,
      at: nowIso(),
      online: true,
    });
    save();
    publish("vehicle.position", p);
    res.json(p);
  })
);

// POST /api/tracking/signal  { vehicleId, online, place }   (driver app reports losing / regaining signal)
r.post(
  "/signal",
  wrap((req, res) => {
    const { vehicleId, online, place = "" } = req.body || {};
    const p = (db().positions[vehicleId] = {
      ...(db().positions[vehicleId] || { vehicleId }),
      online: !!online,
      signalChangedAt: nowIso(),
      place,
    });
    save();
    publish(online ? "vehicle.online" : "vehicle.offline", p);
    res.json(p);
  })
);

export default r;
