// Run with: npm test   (pure logic only, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { withPositions, diff, markSaved } from "../src/supabaseStore.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const empty = () => ({ tables: {}, docs: new Map() });
const clone = (x) => JSON.parse(JSON.stringify(x));
const count = (c) => Object.values(c.upserts).flat().length;

test("first write of the seed: every row and every other value is sent", () => {
  const c = diff(seed, empty());
  assert.equal(c.upserts.orders.length, seed.orders.length);
  assert.ok(!c.upserts.events, "empty lists write nothing");
  assert.deepEqual(c.docs.map((d) => d.name).sort(), ["history", "loads", "meta", "positions"]);
});

test("after saving, nothing changed means nothing to write", () => {
  const saved = empty();
  markSaved(saved, diff(seed, saved));
  const c = diff(seed, saved);
  assert.equal(count(c), 0);
  assert.deepEqual(c.docs, []);
});

test("one changed order writes one row; a removed order is deleted", () => {
  const saved = empty();
  markSaved(saved, diff(seed, saved));
  const s = clone(seed);
  s.orders[3].status = "planned";
  const gone = s.orders.pop().id;
  const c = diff(s, saved);
  assert.deepEqual(
    c.upserts.orders.map((r) => r.id),
    [s.orders[3].id]
  );
  assert.deepEqual(c.deletes.orders, [gone]);
});

test("a newest-first unshift writes only the new row, and the order survives", () => {
  const list = [{ id: "B" }, { id: "C" }];
  const saved = { tables: {}, docs: new Map() };
  markSaved(saved, diff({ events: list }, saved));
  const next = [{ id: "A" }, ...list];
  const c = diff({ events: next }, saved);
  assert.deepEqual(
    c.upserts.events.map((r) => r.id),
    ["A"]
  );
  markSaved(saved, c);
  const order = [...saved.tables.events].sort((a, b) => a[1].pos - b[1].pos).map(([id]) => id);
  assert.deepEqual(order, ["A", "B", "C"]);
});

test("positions: new rows in the middle and at the end keep the list order", () => {
  const old = new Map([
    ["A", 0],
    ["C", 1],
  ]);
  const rows = withPositions([{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }], old);
  const pos = rows.map((r) => r.pos);
  assert.deepEqual(
    pos,
    [...pos].sort((a, b) => a - b)
  );
  assert.equal(rows[0].pos, 0);
  assert.equal(rows[2].pos, 1);
});

test("a shuffled list is renumbered from 0", () => {
  const old = new Map([
    ["A", 0],
    ["B", 1],
  ]);
  assert.deepEqual(
    withPositions([{ id: "B" }, { id: "A" }], old).map((r) => r.pos),
    [0, 1]
  );
});

test("lists whose items have no id are kept as one value, not a table", () => {
  const c = diff({ orders: [{ sku: "x" }] }, empty());
  assert.deepEqual(c.docs, [{ name: "orders", data: [{ sku: "x" }] }]);
});
