// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { issueProblem, makeIssue } from "../src/logic/issues.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const dlv = seed.deliveries.find((x) => x.status === "delivered");
const good = { outletId: dlv.outletId, deliveryId: dlv.id, sku: "SKU-7001", problem: "damaged", qty: 2 };

test("a good report has no problem", () => {
  assert.equal(issueProblem(good, seed), null);
});

test("unknown store, unknown problem type and missing sku are rejected", () => {
  assert.match(issueProblem({ ...good, outletId: "OUT999" }, seed), /OUT999/);
  assert.match(issueProblem({ ...good, problem: "broken" }, seed), /Choose what is wrong/);
  assert.match(issueProblem({ ...good, sku: "" }, seed), /item/);
  assert.ok(issueProblem(undefined, seed));
});

test("delivery must exist and belong to the same store", () => {
  assert.match(issueProblem({ ...good, deliveryId: "DLV-NOPE" }, seed), /cannot find/);
  const other = seed.outlets.find((o) => o.id !== dlv.outletId).id;
  assert.match(issueProblem({ ...good, outletId: other }, seed), /different store/);
});

test("qty is optional but must be more than 0 when given", () => {
  assert.equal(issueProblem({ ...good, qty: undefined }, seed), null);
  assert.ok(issueProblem({ ...good, qty: 0 }, seed));
  assert.ok(issueProblem({ ...good, qty: "2" }, seed));
});

test("makeIssue links the order from the delivery and fills defaults", () => {
  const i = makeIssue({ ...good, qty: undefined }, seed, { id: "ISS-1", at: "2026-09-29T09:00:00Z" });
  assert.equal(i.orderId, dlv.orderId);
  assert.equal(i.qty, 1);
  assert.equal(i.fix, "fix");
  assert.equal(i.status, "open");
});
