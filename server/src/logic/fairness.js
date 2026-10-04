// Fairness rule for deferrals.
// Pure function: no database, no Express. Easy to test (see server/test/fairness.test.js).
//
// When there are more chilled orders than reefer slots, suggest who waits:
//   1. PROTECTED: an outlet deferred on either of the last two runs, or deferred 2+ times in 14 days, cannot wait again.
//   2. Then serve the outlet with the LONGEST GAP since its last chilled delivery.
//   3. On a tie, the SMALLER order waits (fewer goods sit in the cold room).
// The dispatcher always makes the final call. This only suggests.

const DAY = 24 * 60 * 60 * 1000;

/**
 * @param {object} input
 * @param {Array<{id,outletId,kg}>} input.orders        chilled orders competing for slots
 * @param {number} input.slots                           reefer slots available
 * @param {Array<{outletId,fromDate,at,reversed}>} input.deferrals   deferral history
 * @param {Record<string,string>} input.lastChilled      outletId -> ISO time of last chilled delivery
 * @param {string} input.planDate                        YYYY-MM-DD being planned
 * @returns {Array<{orderId,outletId,kg,protected,gapHours,deferrals14d,suggestion,reason,rank}>}
 */
export function rankForSlots({ orders, slots, deferrals, lastChilled, planDate }) {
  const plan = new Date(planDate + "T00:00:00+05:30").getTime();
  // The two previous run dates as YYYY-MM-DD (calendar math in UTC so the time zone can't shift the day).
  const day0 = new Date(planDate + "T00:00:00Z").getTime();
  const lastTwoRuns = [day0 - DAY, day0 - 2 * DAY].map((t) => new Date(t).toISOString().slice(0, 10));

  const rows = orders.map((o) => {
    const mine = deferrals.filter((d) => d.outletId === o.outletId && !d.reversed);
    const deferrals14d = mine.filter((d) => plan - new Date(d.at).getTime() <= 14 * DAY).length;
    const recent = mine.some((d) => lastTwoRuns.includes(d.fromDate));
    const isProtected = recent || deferrals14d >= 2;
    const last = lastChilled[o.outletId] ? new Date(lastChilled[o.outletId]).getTime() : plan - 30 * DAY;
    const gapHours = Math.round((plan - last) / 3600000);
    return {
      orderId: o.id,
      outletId: o.outletId,
      kg: o.kg,
      protected: isProtected,
      gapHours,
      deferrals14d,
      recent,
    };
  });

  // Protected first, then longest gap, then bigger order first (so the smaller one waits).
  rows.sort((a, b) => Number(b.protected) - Number(a.protected) || b.gapHours - a.gapHours || b.kg - a.kg);

  return rows.map((r, i) => {
    const serve = i < slots || r.protected;
    let reason;
    if (r.protected)
      reason = r.recent
        ? "Protected: waited on one of the last two runs"
        : `Protected: waited ${r.deferrals14d} times in 14 days`;
    else if (serve)
      reason =
        i === rows.findIndex((x) => !x.protected)
          ? "Serve: longest gap since last chilled delivery"
          : "Serve";
    else
      reason =
        r.gapHours < 24 ? "Wait: served in the last 24 hours" : "Wait: shorter gap than outlets served";
    return { ...r, rank: i + 1, suggestion: serve ? "serve" : "wait", reason };
  });
}
