// Sends the plan to the dock: puts tomorrow's orders on trucks and gives each truck a bay and a load list.
// Pure function: no database, no Express. Tested in server/test/release.test.js.
//
//   Chilled orders go on working reefers, one order per slot, in the fairness order from the plan.
//   Other orders go on working dry trucks, as long as the truck's capacity in kg allows.
//   Each truck gets the next free bay; stops run in the order they were packed.
// An order that is already on a run, or deferred, is left alone, so sending twice changes nothing.

const OPEN = ["placed", "planned"];

/**
 * @param {object} input
 * @param {string} input.date                     delivery date being sent (YYYY-MM-DD)
 * @param {Array} input.orders                    all orders
 * @param {Array} input.vehicles                  all vehicles
 * @param {Array} input.runs                      all runs
 * @param {string[]} [input.chilledOrder]         order ids of chilled orders, fairness order first
 * @param {string[]} [input.busyBays]             bays already taken by trucks still being loaded
 * @returns {{ runs: Array, loads: Record<string, object>, orderIds: string[], left: string[] }}
 *   left: orders that did not fit on any truck
 */
export function planRelease({ date, orders, vehicles, runs, chilledOrder = [], busyBays = [] }) {
  const onRun = new Set(runs.flatMap((r) => r.stops.map((s) => s.orderId)));
  const todo = orders.filter((o) => o.deliveryDate === date && OPEN.includes(o.status) && !onRun.has(o.id));
  const rank = (o) => {
    const i = chilledOrder.indexOf(o.id);
    return i < 0 ? Infinity : i;
  };
  const chilled = todo.filter((o) => o.chilled).sort((a, b) => rank(a) - rank(b));
  const dry = todo.filter((o) => !o.chilled).sort((a, b) => b.kg - a.kg);
  const working = vehicles.filter(
    (v) => v.status !== "workshop" && !runs.some((r) => r.date === date && r.vehicleId === v.id)
  );

  const trucks = [];
  const left = [];
  for (const v of working.filter((x) => x.type === "reefer")) {
    const take = chilled.splice(0, v.slots || 0);
    if (take.length) trucks.push({ v, orders: take });
  }
  left.push(...chilled.map((o) => o.id));
  const dryTrucks = working.filter((x) => x.type === "dry").map((v) => ({ v, orders: [], kg: 0 }));
  for (const o of dry) {
    const t = dryTrucks.find((x) => x.kg + (o.kg || 0) <= (x.v.capacityKg || Infinity));
    if (!t) left.push(o.id);
    else {
      t.orders.push(o);
      t.kg += o.kg || 0;
    }
  }
  trucks.push(...dryTrucks.filter((t) => t.orders.length));

  const taken = new Set(busyBays.map((b) => String(b).padStart(2, "0")));
  const nextBay = () => {
    let n = 1;
    while (taken.has(String(n).padStart(2, "0"))) n++;
    const bay = String(n).padStart(2, "0");
    taken.add(bay);
    return bay;
  };

  const newRuns = [];
  const loads = {};
  for (const { v, orders: list } of trucks) {
    const id = `RUN-${v.id}-${date.slice(5).replace("-", "")}`;
    newRuns.push({
      id,
      vehicleId: v.id,
      date,
      driver: v.driver,
      bay: nextBay(),
      status: "loading",
      name: v.type === "reefer" ? "Chilled run" : "Dry run",
      stops: list.map((o, i) => ({
        seq: i + 1,
        outletId: o.outletId,
        orderId: o.id,
        eta: null,
        status: "pending",
      })),
    });
    loads[id] = {
      runId: id,
      status: "loading",
      shortfalls: [],
      lines: list.flatMap((o, i) =>
        o.lines.map((l) => ({
          orderId: o.id,
          stopSeq: i + 1,
          sku: l.sku,
          name: l.name,
          planned: l.qty,
          loaded: 0,
          checked: false,
        }))
      ),
    };
  }
  return { runs: newRuns, loads, orderIds: newRuns.flatMap((r) => r.stops.map((s) => s.orderId)), left };
}
