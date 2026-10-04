// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { alsoWaited, niceDate } from "../src/logic/noticeText.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const newWait = (outletId, fromDate) => ({ id: "DEF-NEW", outletId, fromDate });

test("niceDate reads like a person would say it", () => {
  assert.equal(niceDate("2026-09-24"), "Thursday 24 September");
});

test("Dehiwala waited before: the notice names the latest earlier wait", () => {
  // seed: OUT014 waited on 18 Sep and 25 Sep
  assert.equal(
    alsoWaited(seed.deferrals, newWait("OUT014", "2026-09-30")),
    " You also waited on Friday 25 September."
  );
});

test("a store that never waited gets no extra sentence", () => {
  assert.equal(alsoWaited(seed.deferrals, newWait("OUT031", "2026-09-30")), "");
});

test("reversed waits and the wait itself do not count", () => {
  const deferrals = [
    { outletId: "OUT014", fromDate: "2026-09-25", reversed: true },
    { outletId: "OUT014", fromDate: "2026-09-30", reversed: false },
  ];
  assert.equal(alsoWaited(deferrals, newWait("OUT014", "2026-09-30")), "");
});

// deferralNotice: everything the store reads comes from the data, nothing fixed.
import { deferralNotice } from "../src/logic/noticeText.js";
const borella = { id: "OUT022", dockOpen: "06:00", dockClose: "09:30" };
const order = {
  id: "ORD-T1",
  outletId: "OUT022",
  deliveryDate: "2026-09-30",
  kg: 120,
  lines: [{ sku: "a" }, { sku: "b" }, { sku: "c" }],
};
const make = (extra = {}) =>
  deferralNotice({
    order,
    outlet: borella,
    toDate: "2026-10-01",
    reason: "Trucks are full.",
    deferrals: [],
    signedBy: "Kavindi Perera, dispatcher, Peliyagoda depot",
    now: new Date("2026-09-29T15:00:00+05:30"),
    ...extra,
  });

test("tiles use the outlet's dock window, the order size and the protected days", () => {
  const n = make();
  assert.deepEqual(
    n.tiles.map((t) => t.value),
    [
      "Moved, not cancelled · 3 lines, 120 kg",
      "Thu 1 Oct, 06:00–09:30",
      "Cannot wait again on Thu 1 Oct or Fri 2 Oct",
    ]
  );
  assert.equal(n.signedBy, "Kavindi Perera, dispatcher, Peliyagoda depot");
  assert.equal(n.title, "Your order ORD-T1 now arrives Thursday 1 October");
  assert.match(n.body, /^Trucks are full\. It cannot be moved again on Thu 1 Oct or Fri 2 Oct\./);
});

test("the footnote counts real waits in the last 14 days, ignoring reversed and old ones", () => {
  assert.equal(make().footnote, "This is your first wait in 14 days.");
  const deferrals = [
    { outletId: "OUT022", fromDate: "2026-09-25", at: "2026-09-24T16:00:00+05:30" },
    { outletId: "OUT022", fromDate: "2026-09-20", at: "2026-09-19T16:00:00+05:30", reversed: true },
    { outletId: "OUT022", fromDate: "2026-09-01", at: "2026-08-31T16:00:00+05:30" },
    { outletId: "OUT099", fromDate: "2026-09-26", at: "2026-09-25T16:00:00+05:30" },
  ];
  const n = make({ deferrals });
  assert.match(n.footnote, /^This is your second wait in 14 days, so your next order goes to the front/);
  assert.match(n.body, /You also waited on Friday 25 September\./);
});

test("no dock window on file: the date alone, no made-up times", () => {
  assert.equal(make({ outlet: { id: "OUT022" } }).tiles[1].value, "Thu 1 Oct");
});
