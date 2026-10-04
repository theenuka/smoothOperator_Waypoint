// Trip summary for one run (DR7). Pure function, tested in server/test/runSummary.test.js.
const time = (iso) => (iso ? new Date(iso).getTime() : null);

export function summarizeRun({ run, deliveries = [], shortfalls = [], orders = [] }) {
  const count = (status) => run.stops.filter((s) => s.status === status).length;
  const deferred = run.stops.filter(
    (s) => orders.find((o) => o.id === s.orderId)?.status === "deferred"
  ).length;
  const delivered = deliveries.filter(
    (x) => x.runId === run.id && x.status === "delivered" && !x.supersededBy
  );
  const times = delivered
    .map((x) => time(x.recordedAt))
    .filter(Boolean)
    .sort((a, b) => a - b);
  return {
    runId: run.id,
    vehicleId: run.vehicleId,
    driver: run.driver,
    stops: run.stops.length,
    delivered: count("delivered"),
    failed: count("failed"),
    deferred,
    pending: run.stops.filter((s) => !["delivered", "failed"].includes(s.status)).length,
    firstDeliveryAt: times.length ? new Date(times[0]).toISOString() : null,
    lastDeliveryAt: times.length ? new Date(times[times.length - 1]).toISOString() : null,
    shortfallsHandedOver: shortfalls.map((s) => ({
      orderId: s.orderId,
      outletId: s.outletId,
      name: s.name,
      missing: s.planned - s.loaded,
    })),
    done: run.stops.every((s) => ["delivered", "failed"].includes(s.status)),
  };
}

/** Minutes since each vehicle's last ping, measured against the freshest ping in the fleet. */
export function silentMinutes(positions) {
  const list = Object.values(positions || {});
  const latest = Math.max(...list.map((p) => time(p.at) || 0));
  return list.map((p) => ({ ...p, silentMinutes: p.at ? Math.round((latest - time(p.at)) / 60000) : null }));
}
