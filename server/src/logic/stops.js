// Stop results and failed-delivery wording.
// Pure functions: no database, no Express. Tested in server/test/stops.test.js.

export const STOP_RESULTS = ["delivered", "failed"];

// Plain words for the DR4 reasons (shown to dispatch and the store).
export const ISSUE_TEXT = {
  store_closed: "the shutter was down and nobody was there to receive",
  refused: "the outlet refused the goods",
  damaged: "the goods were damaged on the way",
  cant_reach_dock: "the truck couldn't reach the delivery bay",
  other: "of a problem at the stop",
};

/**
 * Record the result of one stop and move the "next" marker on.
 * @returns {{ stops: Array, runDone: boolean }} a new stops array (the input is not changed)
 */
export function applyStopResult(stops, orderId, result) {
  const out = stops.map((s) => (s.orderId === orderId ? { ...s, status: result } : { ...s }));
  if (!out.some((s) => s.status === "next")) {
    const next = out.find((s) => s.status === "pending");
    if (next) next.status = "next";
  }
  const runDone = out.every((s) => STOP_RESULTS.includes(s.status));
  return { stops: out, runDone };
}

/**
 * The notice the store reads when its delivery could not be completed.
 * goods: "retry" (driver tries again on the way back) | "return" (back to the depot, dispatch re-plans)
 */
export function failureNotice({ issue, note, goods }) {
  const why = ISSUE_TEXT[issue] || ISSUE_TEXT.other;
  const next =
    goods === "return"
      ? "The goods are going back to the depot and dispatch will plan a new delivery. You will get a notice with the new date."
      : "The driver will try again on the way back today.";
  return {
    title: goods === "return" ? "Today's delivery couldn't be completed" : "The driver couldn't deliver yet",
    body: `We couldn't deliver because ${why}.${note ? ` Driver's note: "${note}".` : ""} ${next}`,
  };
}
