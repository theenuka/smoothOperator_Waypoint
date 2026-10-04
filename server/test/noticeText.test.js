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
