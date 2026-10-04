// Order timeline for SM4.
// Pure function: reads the db object it is given, never saves.
// Each step: { step, label, at, done }. `at` is an ISO time or null when we do not know it (yet).

export function orderTimeline(order, d) {
  const steps = [{ step: "placed", label: "Order placed", at: order.placedAt, done: true }];

  const deferral = d.deferrals.find((x) => x.orderId === order.id && !x.reversed);
  if (deferral) {
    steps.push({ step: "deferred", label: `Moved to ${deferral.toDate}`, at: deferral.at, done: true });
    return steps;
  }

  const run = d.runs.find((r) => r.stops.some((s) => s.orderId === order.id));
  const load = run && d.loads[run.id];
  const sealed = run && d.events.find((e) => e.type === "load.completed" && e.payload.runId === run.id);
  const delivery = d.deliveries.find((x) => x.orderId === order.id);
  const loaded = load?.status === "sealed" || !!run?.departedAt || !!delivery;

  steps.push(
    {
      step: "planned",
      label: run ? `Planned onto ${run.vehicleId}` : "Planned onto a truck",
      at: null,
      done: !!run,
    },
    { step: "loaded", label: "Loaded at the depot", at: sealed?.at || null, done: loaded },
    { step: "out", label: "Out for delivery", at: run?.departedAt || null, done: !!run?.departedAt }
  );
  if (delivery?.status === "failed")
    steps.push({ step: "failed", label: "Could not deliver", at: delivery.recordedAt, done: true });
  else
    steps.push({ step: "delivered", label: "Delivered", at: delivery?.recordedAt || null, done: !!delivery });
  return steps;
}
