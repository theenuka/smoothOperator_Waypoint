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
