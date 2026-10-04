import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeRun, silentMinutes } from "../src/logic/runSummary.js";

const run = {
  id: "RUN-1",
  vehicleId: "VEH022",
  driver: "Chamara",
  stops: [
    { seq: 1, orderId: "A", status: "delivered" },
    { seq: 2, orderId: "B", status: "failed" },
    { seq: 3, orderId: "C", status: "pending" },
  ],
};

test("counts stops by result and lists shortfalls handed over", () => {
  const s = summarizeRun({
    run,
    deliveries: [
      { runId: "RUN-1", status: "delivered", recordedAt: "2026-09-29T07:05:00+05:30" },
      { runId: "RUN-1", status: "delivered", recordedAt: "2026-09-29T06:40:00+05:30", supersededBy: "x" },
    ],
    shortfalls: [{ orderId: "A", outletId: "OUT1", name: "Rice", planned: 10, loaded: 6 }],
    orders: [{ id: "C", status: "deferred" }],
  });
  assert.equal(s.delivered, 1);
  assert.equal(s.failed, 1);
  assert.equal(s.pending, 1);
  assert.equal(s.deferred, 1);
  assert.equal(s.done, false);
  assert.equal(s.firstDeliveryAt, new Date("2026-09-29T07:05:00+05:30").toISOString());
  assert.deepEqual(s.shortfallsHandedOver, [{ orderId: "A", outletId: "OUT1", name: "Rice", missing: 4 }]);
});

test("silent minutes are measured against the freshest ping", () => {
  const out = silentMinutes({
    A: { vehicleId: "A", at: "2026-09-29T08:44:00+05:30" },
    B: { vehicleId: "B", at: "2026-09-29T08:14:00+05:30" },
  });
  assert.deepEqual(
    out.map((p) => [p.vehicleId, p.silentMinutes]),
    [
      ["A", 0],
      ["B", 30],
    ]
  );
});
