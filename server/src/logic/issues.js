// Store "report a problem" (SM7). Owner: BACKEND A.
// Pure functions: they read the db object they are given, they never save.

export const PROBLEMS = ["short", "damaged", "wrong_item", "past_date"];

// Returns a plain-English problem with the report, or null when it is fine.
export function issueProblem(body, d) {
  const { outletId, deliveryId, sku, problem, qty } = body || {};
  if (!d.outlets.some((o) => o.id === outletId)) return `We do not know a store with the id ${outletId}.`;
  if (!PROBLEMS.includes(problem)) return `Choose what is wrong: ${PROBLEMS.join(", ")}.`;
  if (!sku) return "Choose the item that has the problem.";
  const delivery = d.deliveries.find((x) => x.id === deliveryId);
  if (!delivery) return `We cannot find delivery ${deliveryId}.`;
  if (delivery.outletId !== outletId) return `Delivery ${deliveryId} went to a different store.`;
  if (qty !== undefined && !(typeof qty === "number" && qty > 0))
    return "The number of items must be more than 0.";
  return null;
}

// Builds the record that is stored in db().issues. id and at come from the route (newId, nowIso).
export function makeIssue(body, d, { id, at }) {
  const delivery = d.deliveries.find((x) => x.id === body.deliveryId);
  return {
    id,
    outletId: body.outletId,
    deliveryId: body.deliveryId,
    orderId: delivery.orderId,
    sku: body.sku,
    problem: body.problem,
    qty: body.qty ?? 1,
    fix: body.fix || "fix",
    note: body.note || "",
    receivedBy: body.receivedBy || null,
    status: "open",
    at,
  };
}
