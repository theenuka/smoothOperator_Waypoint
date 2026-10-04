// LD6 Loading history: sealed trucks with loaded vs planned, shortfalls, and who flagged them.  Design: docs/design/LD6-LoadingHistory.jpg
import { useEffect, useState } from "react";
import { api } from "../../shared/api.js";
import { useDates, useLiveEvent } from "../../shared/live.js";
import { Empty, ErrorNote, Loading } from "../../shared/ui.jsx";
import "./loader.css";

const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// Monday of this week up to and including `date`.
const weekDates = (date) => {
  const dow = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return Array.from({ length: dow + 1 }, (_, i) => addDays(date, i - dow));
};
const weekday = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

// The date ranges for the tabs, counted from today (Sri Lanka date from the server).
const rangesFor = (today) => ({
  today: { label: "Today", noun: "today", dates: [today] },
  yesterday: { label: "Yesterday", noun: "yesterday", dates: [addDays(today, -1)] },
  week: { label: "This week", noun: "this week", dates: weekDates(today) },
});

const REASON = {
  short_on_dock: "short",
  damaged: "damaged",
  wrong_item: "wrong item",
  never_arrived: "never arrived",
};

// "Ruwan Jayasinghe" -> "R. Jayasinghe". Anything without a space is shown as is.
const shortName = (name) => {
  if (!name) return "unknown";
  const parts = String(name).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : parts[0];
};

const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);

function buildRow(run, date, load) {
  const lines = load.lines || [];
  const shortfalls = (load.shortfalls || []).map((sf) => {
    const line = lines.find((l) => l.orderId === sf.orderId && l.sku === sf.sku);
    const planned = sf.planned ?? line?.planned ?? 0;
    return { ...sf, missing: Math.max(planned - (Number(sf.loaded) || 0), 0) };
  });
  return {
    key: `${date}-${run.id}`,
    date,
    run,
    planned: sum(lines, "planned"),
    loaded: sum(lines, "loaded"),
    sealedAt: load.sealedAt ?? load.completedAt ?? null, // ISO string, if the backend sends it
    sealedBy: load.sealedBy ?? null,
    shortfalls,
  };
}

async function fetchRows(dates) {
  const perDay = await Promise.all(dates.map((d) => api.get(`/runs?date=${d}`)));
  const runs = perDay.flatMap((list, i) => list.map((r) => ({ run: r, date: dates[i] })));
  const loads = await Promise.all(runs.map(({ run }) => api.get(`/loads/${run.id}`).catch(() => null)));
  return runs
    .map(({ run, date }, i) => ({ run, date, load: loads[i] }))
    .filter(({ run, load }) => load && (load.status === "sealed" || ["on_road", "done"].includes(run.status)))
    .map(({ run, date, load }) => buildRow(run, date, load))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.sealedAt || "").localeCompare(a.sealedAt || ""));
}

function Row({ row, showDay }) {
  const time = row.sealedAt ? row.sealedAt.slice(11, 16) : "--:--";
  const { run } = row;
  return (
    <div className="ld-row">
      <span className="mono ld-time">{showDay ? `${weekday(row.date)} ${time}` : time}</span>
      <b className="mono ld-veh">{run.vehicleId}</b>
      <div className="col" style={{ gap: 2 }}>
        <span className="ld-run">{run.name || run.driver}</span>
        <span className="muted small">{run.stops.length} stops</span>
      </div>
      <span className="mono ld-count">
        {row.loaded} / {row.planned}
      </span>
      <div className="ld-status">
        {row.shortfalls.length === 0 ? (
          <span className="ld-chip ok">Complete</span>
        ) : (
          row.shortfalls.map((sf) => (
            <div className="ld-sf" key={`${sf.orderId}-${sf.sku}`}>
              <span className="ld-chip bad">
                {sf.missing} {REASON[sf.reason] || sf.reason} · {sf.sku}
              </span>
              <span className="muted small">
                flagged by {shortName(sf.by)}
                {sf.backorder?.deliveryDate ? ` · backorder ${sf.backorder.deliveryDate}` : ""}
              </span>
            </div>
          ))
        )}
      </div>
      <span className="ld-who">{row.sealedBy ? shortName(row.sealedBy) : "—"}</span>
    </div>
  );
}

export default function LD6LoadingHistory() {
  const { today } = useDates();
  const RANGES = rangesFor(today || "1970-01-01");
  const [range, setRange] = useState("today");
  const [tick, setTick] = useState(0);
  const [state, setState] = useState(null); // { range, rows, error }
  useLiveEvent(["load.completed", "load.shortfall"], () => setTick((t) => t + 1));

  useEffect(() => {
    if (!today) return;
    let stale = false;
    fetchRows(rangesFor(today)[range].dates)
      .then((rows) => !stale && setState({ range, rows, error: null }))
      .catch((error) => !stale && setState({ range, rows: [], error }));
    return () => {
      stale = true;
    };
  }, [range, tick, today]);

  const ready = state && state.range === range;
  const rows = ready ? state.rows : [];
  const shortCount = rows.reduce((n, r) => n + r.shortfalls.length, 0);

  return (
    <>
      <div className="ld-head">
        <div className="col" style={{ gap: 4 }}>
          <span className="label">LD6 · Peliyagoda dock</span>
          <h1 className="h-page">Loading history</h1>
        </div>
        <div className="ld-seg" role="group" aria-label="Period">
          {Object.entries(RANGES).map(([id, r]) => (
            <button key={id} type="button" aria-pressed={range === id} onClick={() => setRange(id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!ready && <Loading />}
      {ready && <ErrorNote error={state.error} />}
      {ready && !state.error && rows.length === 0 && (
        <Empty>
          No sealed trucks {RANGES[range].noun}. Seal a truck from its load plan and it shows up here.
        </Empty>
      )}

      {ready && rows.length > 0 && (
        <div className="ld-list">
          {rows.map((row) => (
            <Row key={row.key} row={row} showDay={range !== "today"} />
          ))}
        </div>
      )}

      {ready && !state.error && rows.length > 0 && (
        <div className="card ld-sum">
          <div className="col" style={{ gap: 4 }}>
            <span className={`stencil ld-sum-n${shortCount ? "" : " zero"}`}>{shortCount}</span>
            <span className="muted">
              {shortCount === 1 ? "shortfall" : "shortfalls"} {RANGES[range].noun}
            </span>
          </div>
          <p className="ld-sum-text">
            {shortCount > 0
              ? "Each one was caught at the dock and reached the outlet as a known number, not a surprise."
              : "Every truck left the dock exactly as planned."}
          </p>
        </div>
      )}
    </>
  );
}
