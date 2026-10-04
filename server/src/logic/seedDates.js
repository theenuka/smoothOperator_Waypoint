// Real dates for the app. Owner: BACKEND A. Pure functions.
// "Today" is the real date in Sri Lanka; the planning day is tomorrow.
// The seed (demo scenario) is written for one day (seed.meta.demoDate). shiftSeed moves the WHOLE
// scenario to a new day: every date and time moves by the same number of days, so gaps, cutoffs and
// "waited twice in 14 days" stay true, and weekday words in the text move with them.

const SL_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // Asia/Colombo is UTC+05:30 all year
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-04" for the given moment, in Sri Lanka.
export const todayInColombo = (now = new Date()) =>
  new Date(new Date(now).getTime() + SL_OFFSET_MS).toISOString().slice(0, 10);

export const addDays = (ymd, n) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (a, b) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
const weekday = (ymd) => new Date(`${ymd}T00:00:00Z`).getUTCDay();

// The dates the app works with right now.
export const liveDates = (now = new Date()) => {
  const today = todayInColombo(now);
  return { today, planDate: addDays(today, 1) };
};

// Returns a copy of `seed` with the scenario moved from seed.meta.demoDate to `toDay`.
export function shiftSeed(seed, toDay) {
  const from = seed.meta.demoDate;
  const days = daysBetween(from, toDay);
  if (days === 0) return structuredClone(seed);
  const year = from.slice(0, 4);
  let text = JSON.stringify(seed);
  // "Mon 28 Sep" -> the moved date, with its own weekday
  text = text.replace(
    /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
    (m, d, mon) => {
      const ymd = `${year}-${String(MONTHS.indexOf(mon) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
      const moved = addDays(ymd, days);
      return `${WEEK[weekday(moved)].slice(0, 3)} ${Number(moved.slice(8))} ${MONTHS[Number(moved.slice(5, 7)) - 1]}`;
    }
  );
  // Every ISO date, alone ("2026-09-29") or inside a time ("2026-09-29T07:02:00+05:30")
  text = text.replace(/\b(\d{4}-\d{2}-\d{2})(?=T\d|")/g, (m, ymd) => addDays(ymd, days));
  // "Friday", "Wednesday's": each weekday word moves by the same number of days
  const turn = ((days % 7) + 7) % 7;
  text = text.replace(
    /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/g,
    (w) => WEEK[(WEEK.indexOf(w) + turn) % 7]
  );
  return JSON.parse(text);
}
