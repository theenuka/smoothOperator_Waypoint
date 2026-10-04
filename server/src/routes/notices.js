// Store notices API. Owner: BACKEND A.  Contract: docs/API_CONTRACT.md#notices
import { Router } from "express";
import { db, save, newId, nowIso } from "../db.js";
import { publish } from "../events.js";
import { httpError, outletName } from "./_util.js";
import { issueProblem, makeIssue } from "../logic/issues.js";

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

// Store problem reports (SM7). Mounted by the Lead in index.js: app.use("/api/issues", issues)
export const issues = Router();

// POST /api/issues  { outletId, deliveryId, sku, problem, note, qty?, fix?, receivedBy? }
issues.post("/", (req, res, next) => {
  const d = db();
  const problem = issueProblem(req.body, d);
  if (problem) return next(httpError(400, problem));
  const issue = makeIssue(req.body, d, { id: newId("ISS"), at: nowIso() });
  (d.issues ||= []).push(issue);
  save();
  publish("issue.reported", {
    issueId: issue.id,
    outletId: issue.outletId,
    outletName: outletName(d, issue.outletId),
    orderId: issue.orderId,
    sku: issue.sku,
    problem: issue.problem,
  });
  res.status(201).json(issue);
});
