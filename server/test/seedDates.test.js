// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shiftSeed, todayInColombo, liveDates, addDays } from "../src/logic/seedDates.js";

const seed = JSON.parse(fs.readFileSync(new URL("../src/seed.json", import.meta.url)));
const moved = shiftSeed(seed, "2026-10-04"); // Tuesday 29 Sep -> Sunday 4 Oct: 5 days later

test("today is the Sri Lanka date, not the UTC date", () => {
  assert.equal(todayInColombo(new Date("2026-10-03T19:00:00Z")), "2026-10-04"); // 00:30 in Colombo
  assert.equal(todayInColombo(new Date("2026-10-04T18:00:00Z")), "2026-10-04"); // 23:30 in Colombo
  assert.deepEqual(liveDates(new Date("2026-10-31T10:00:00Z")), {
    today: "2026-10-31",
    planDate: "2026-11-01",
  });
});

test("the scenario moves to the new day: meta, orders, runs and times", () => {
  assert.equal(moved.meta.demoDate, "2026-10-04");
  assert.equal(moved.meta.planDate, "2026-10-05");
  const run = moved.runs.find((r) => r.id === "RUN-VEH022");
  assert.equal(run.date, "2026-10-04");
  assert.equal(run.departedAt, "2026-10-04T06:30:00+05:30", "time of day and zone kept");
  assert.equal(
    moved.orders.filter((o) => o.deliveryDate === "2026-10-05" && o.chilled).length,
    seed.orders.filter((o) => o.deliveryDate === "2026-09-30" && o.chilled).length
  );
});

test("every gap stays the same, so the fairness rule gives the same answer", () => {
  for (const [i, d] of seed.deferrals.entries()) {
    assert.equal(moved.deferrals[i].fromDate, addDays(d.fromDate, 5));
    assert.equal(Date.parse(moved.deferrals[i].at) - Date.parse(d.at), 5 * 86400000);
  }
});

test("weekday words in notices move with the dates", () => {
  const before = seed.notices.map((n) => n.body).join(" ");
  const after = moved.notices.map((n) => n.body).join(" ");
  assert.match(before, /New delivery: Mon 28 Sep/);
  assert.match(after, /New delivery: Sat 3 Oct/); // 28 Sep + 5 days
  assert.match(before, /Wednesday's order/);
  assert.match(after, /Monday's order/); // Wednesday + 5 days
  assert.ok(!moved.runs.some((r) => r.date === "2026-09-29"), "no run left on the old day");
});

test("names that start like a weekday are left alone", () => {
  const s = { ...seed, meta: { ...seed.meta }, extra: "Sunil Perera, Monday" };
  const out = shiftSeed(s, "2026-10-04");
  assert.equal(out.extra, "Sunil Perera, Saturday");
});

test("same day: an unchanged copy", () => {
  assert.deepEqual(shiftSeed(seed, seed.meta.demoDate), seed);
});
