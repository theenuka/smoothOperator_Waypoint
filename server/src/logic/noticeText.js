// Text helpers for store notices. Pure functions.

// "2026-09-25" -> "Friday 25 September"
export const niceDate = (ymd) =>
  new Date(ymd + "T12:00:00+05:30").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Colombo",
  });

// " You also waited on Friday 25 September." when this outlet waited before `def`, else "".
// Uses the latest earlier wait that was not reversed.
export function alsoWaited(deferrals, def) {
  const before = deferrals
    .filter((x) => x.outletId === def.outletId && !x.reversed && x.fromDate < def.fromDate)
    .map((x) => x.fromDate)
    .sort();
  return before.length ? ` You also waited on ${niceDate(before.at(-1))}.` : "";
}

// "2026-10-01" -> "Thu 1 Oct"
export const shortDate = (ymd) =>
  new Date(ymd + "T12:00:00+05:30").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Colombo",
  });

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const ORDINAL = ["first", "second", "third", "fourth", "fifth"];
const DAY_MS = 24 * 60 * 60 * 1000;

// Everything a deferral notice says, built from the data. Used for the DP4 preview AND the notice the
// store receives, so the two can never disagree.
//   order    the order being moved (before it moves)    outlet  its outlet (dock window)
//   toDate   the new delivery date                       reason  the dispatcher's words ("" for a preview)
//   deferrals  the deferral log, without this one       signedBy  "Kavindi Perera, dispatcher, Peliyagoda depot"
export function deferralNotice({
  order,
  outlet,
  toDate,
  reason = "",
  deferrals,
  signedBy,
  now = new Date(),
}) {
  // Fairness rule 1: an outlet deferred on either of the last two runs is protected, so this order
  // cannot wait again on the two runs after its original date.
  const safe = [addDays(order.deliveryDate, 1), addDays(order.deliveryDate, 2)].map(shortDate);
  const recent = deferrals.filter(
    (x) => x.outletId === order.outletId && !x.reversed && now - new Date(x.at) <= 14 * DAY_MS
  ).length;
  const nth = recent + 1; // counting this one
  const window = outlet.dockOpen && outlet.dockClose ? `, ${outlet.dockOpen}–${outlet.dockClose}` : "";
  const lines = `${order.lines.length} line${order.lines.length === 1 ? "" : "s"}`;
  const footnote =
    nth >= 2
      ? `This is your ${ORDINAL[nth - 1] || `${nth}th`} wait in 14 days, so your next order goes to the front of the queue on any tight day.`
      : "This is your first wait in 14 days.";
  const also = alsoWaited(deferrals, { outletId: order.outletId, fromDate: order.deliveryDate });
  return {
    title: `Your order ${order.id} now arrives ${niceDate(toDate)}`,
    body: `${reason.trim()}${also} It cannot be moved again on ${safe[0]} or ${safe[1]}. ${footnote}`.trim(),
    signedBy,
    tiles: [
      { label: "Your order", value: `Moved, not cancelled · ${lines}, ${order.kg} kg` },
      { label: "New delivery", value: `${shortDate(toDate)}${window}` },
      { label: "After this", value: `Cannot wait again on ${safe[0]} or ${safe[1]}`, tone: "ok" },
    ],
    footnote,
    suggestedReason: `Our refrigerated trucks are full on ${niceDate(order.deliveryDate)}. Your last chilled delivery was recent, so a store that waited longer goes first. Your order moves to ${niceDate(toDate)} in your usual dock window.`,
  };
}
