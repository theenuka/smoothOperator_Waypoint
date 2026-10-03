// Store notices API. Owner: BACKEND A.  Contract: docs/API_CONTRACT.md#notices
import { Router } from "express";
import { db, save } from "../db.js";
import { httpError } from "./_util.js";

const r = Router();

// GET /api/notices?outletId=OUT014
r.get("/", (req, res) => {
  let list = db().notices;
  if (req.query.outletId) list = list.filter((n) => n.outletId === req.query.outletId);
  res.json(list);
});

// POST /api/notices/:id/read
r.post("/:id/read", (req, res, next) => {
  const n = db().notices.find((x) => x.id === req.params.id);
  if (!n) return next(httpError(404, "Notice not found"));
  n.read = true;
  save();
  res.json(n);
});

export default r;
