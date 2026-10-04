// Order cutoff rule.
// Orders placed at or after the cutoff (Sri Lanka time) for the next day move to the day after.
// Pure function: no db, no clock of its own, so it is easy to test.

const SL_OFFSET_MIN = 5 * 60 + 30; // Sri Lanka is UTC+05:30 all year (no daylight saving)

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// applyCutoff({ deliveryDate: "2026-09-30", now: new Date(), cutoff: "16:00" })
//   -> { deliveryDate: "2026-10-01", cutoffMoved: true }  (when placed after 16:00 on the 29th)
export function applyCutoff({ deliveryDate, now = new Date(), cutoff = "16:00" }) {
  const local = new Date(new Date(now).getTime() + SL_OFFSET_MIN * 60000);
  const today = local.toISOString().slice(0, 10);
  const [h, m] = cutoff.split(":").map(Number);
  const pastCutoff = local.getUTCHours() * 60 + local.getUTCMinutes() >= h * 60 + m;
  if (pastCutoff && deliveryDate === addDays(today, 1))
    return { deliveryDate: addDays(deliveryDate, 1), cutoffMoved: true };
  return { deliveryDate, cutoffMoved: false };
}
