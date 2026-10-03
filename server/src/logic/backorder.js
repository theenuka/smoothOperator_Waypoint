// Back-orders for dock shortfalls. Owner: BACKEND B.
// Pure function: no database, no Express. Tested in server/test/backorder.test.js.
//
// When the dock is short (6 of 10 loaded), the missing 4 must not be forgotten:
//   1. If the outlet already has an open order after today, the missing quantity is added to it.
//   2. If not, a new order is created for the next day.
// The line is marked { backorder: true, fromShortfall } so screens can say where it came from.
// Running it twice for the same shortfall changes nothing (safe to retry).

const OPEN = ["placed", "planned", "deferred"];

/** "2026-09-29" -> "2026-09-30" */
export function nextDay(ymd) {
  const t = new Date(ymd + "T00:00:00Z").getTime() + 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * @param {object} input
 * @param {Array} input.orders           all orders (not changed; the result says what to do)
 * @param {{id,orderId,outletId,sku,name,planned,loaded}} input.shortfall
 * @param {string} input.fromDate        delivery date of the short order (YYYY-MM-DD)
 * @param {string} [input.unit]          unit of the line, e.g. "carton"
 * @param {() => string} input.newOrderId
 * @param {string} input.now             ISO time
 * @returns {{ action: "none" | "added" | "created", order?: object, line?: object }}
 */
export function planBackorder({ orders, shortfall, fromDate, unit = "unit", newOrderId, now }) {
  const qty = Number(shortfall.planned) - Number(shortfall.loaded);
  if (!(qty > 0)) return { action: "none" };

  const already = orders.find((o) => o.lines.some((l) => l.fromShortfall === shortfall.id));
  if (already) return { action: "none", order: already };

  const line = {
    sku: shortfall.sku,
    name: shortfall.name,
    qty,
    unit,
    backorder: true,
    fromShortfall: shortfall.id,
  };

  const next = orders
    .filter(
      (o) =>
        o.outletId === shortfall.outletId &&
        o.id !== shortfall.orderId &&
        o.deliveryDate > fromDate &&
        OPEN.includes(o.status)
    )
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))[0];
  if (next) return { action: "added", order: next, line };

  const order = {
    id: newOrderId(),
    outletId: shortfall.outletId,
    deliveryDate: nextDay(fromDate),
    chilled: false,
    lines: [line],
    kg: qty * 10,
    status: "placed",
    placedAt: now,
    backorder: true,
  };
  return { action: "created", order, line };
}
