// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { orderProblem } from "../src/logic/orderCheck.js";

const outlets = [{ id: "OUT014", name: "Dehiwala" }];
const milk = { sku: "SKU-7001", name: "Fresh milk 1 L, crate of 12", qty: 2, unit: "crate" };
const order = (extra) => ({ outletId: "OUT014", deliveryDate: "2026-09-30", lines: [milk], ...extra });

test("a good order has no problem", () => {
  assert.equal(orderProblem(order(), outlets), null);
});

test("unknown store is rejected", () => {
  assert.match(orderProblem(order({ outletId: "OUT999" }), outlets), /OUT999/);
});

test("missing store, date or body is rejected", () => {
  assert.ok(orderProblem(order({ outletId: undefined }), outlets));
  assert.ok(orderProblem(order({ deliveryDate: "" }), outlets));
  assert.ok(orderProblem(undefined, outlets));
});

test("empty or missing lines are rejected", () => {
  assert.match(orderProblem(order({ lines: [] }), outlets), /at least one item/);
  assert.match(orderProblem(order({ lines: "milk" }), outlets), /at least one item/);
});

test("quantity of 0, below 0 or not a number is rejected, naming the item", () => {
  for (const qty of [0, -3, "2", undefined, NaN]) {
    assert.match(
      orderProblem(order({ lines: [{ ...milk, qty }] }), outlets),
      /Fresh milk.*more than 0/,
      String(qty)
    );
  }
});

test("a line without a sku is rejected", () => {
  assert.match(orderProblem(order({ lines: [{ qty: 1 }] }), outlets), /Line 1.*sku/);
});
