// Checks a new order before it is saved.
// Pure function: returns a plain-English problem, or null when the order is fine.

// orderProblem({ outletId, deliveryDate, lines }, db().outlets)
export function orderProblem(body, outlets) {
  const { outletId, deliveryDate, lines } = body || {};
  if (!outletId) return "Choose the store this order is for.";
  if (!outlets.some((o) => o.id === outletId)) return `We do not know a store with the id ${outletId}.`;
  if (!deliveryDate) return "Choose a delivery date.";
  if (!Array.isArray(lines) || !lines.length) return "Add at least one item to the order.";
  for (const [i, l] of lines.entries()) {
    const name = (l && (l.name || l.sku)) || `Line ${i + 1}`;
    if (!l || !l.sku) return `${name}: the item code (sku) is missing.`;
    if (typeof l.qty !== "number" || !(l.qty > 0)) return `${name}: the quantity must be more than 0.`;
  }
  return null;
}
