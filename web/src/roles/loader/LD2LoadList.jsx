// LD2 Load plan: the truck seen from above, last stop goes in first. Owner: LOADER FRONTEND.  Design: /design/LD2-LoadList.jpg
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { ErrorNote, Loading } from "../../shared/ui.jsx";
import "./loader.css";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);

const Tick = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export default function LD2LoadList() {
  const { runId } = useParams();
  const load = useApi(`/loads/${runId}`, ["load.shortfall", "load.completed"]);
  const run = useApi(`/runs/${runId}`);
  if (load.loading || run.loading) return <Loading />;
  if (load.error || run.error) return <ErrorNote error={load.error || run.error} />;

  const lines = load.data.lines;
  const shortfalls = load.data.shortfalls;
  const isDone = (l) => l.checked || shortfalls.some((s) => s.orderId === l.orderId && s.sku === l.sku);

  // Load order = last stop first. Left to right on the diagram: cab -> rear doors.
  const stops = [...run.data.stops]
    .sort((a, b) => b.seq - a.seq)
    .map((s) => {
      const sl = lines.filter((l) => l.orderId === s.orderId);
      return {
        ...s,
        planned: sum(sl, "planned"),
        loaded: sum(sl, "loaded"),
        done: sl.every(isDone),
        short: shortfalls.filter((f) => f.orderId === s.orderId).length,
        target: (sl.find((l) => !isDone(l)) || sl[0])?.sku, // first line still to check
      };
    });

  const curIdx = stops.findIndex((s) => !s.done);
  const current = curIdx >= 0 ? stops[curIdx] : null;
  const label = (s, i) =>
    s.done
      ? "On the truck"
      : s === current
        ? "Loading now"
        : i === stops.length - 1
          ? "Last on"
          : i === curIdx + 1
            ? "Next"
            : "Later";
  const tone = (s) => (s.done ? "ok" : s === current ? "now" : "plain");

  const linesDone = lines.filter(isDone).length;
  const pct = lines.length ? Math.round((linesDone / lines.length) * 100) : 0;
  const stopsOn = stops.filter((s) => s.done).length;
  const goTo = (s) => `/loader/run/${runId}/check/${s.orderId}/${s.target}`;

  return (
    <>
      <div className="col" style={{ gap: 6 }}>
        <span className="label">
          {run.data.vehicleId}
          {run.data.name ? ` · ${run.data.name}` : ""} · Bay {run.data.bay}
        </span>
        <h1 className="h-page" style={{ fontSize: 56 }}>
          Load the last stop first
        </h1>
        <span className="muted">
          Stop {stops[0]?.seq} goes in against the cab. Stop {stops[stops.length - 1]?.seq} goes in last, at
          the doors, so the driver never unloads around it. Short? Flag it and keep loading.
        </span>
      </div>

      <div className="card ld-truck-card">
        <div className="ld-truck">
          <div className="ld-cab label">Cab</div>
          <div className="ld-bay">
            {stops.map((s) => (
              <div key={s.seq} className={`ld-tile${s.done ? " done" : ""}${s === current ? " now" : ""}`}>
                {s === current && <span className="ld-tile-tag">Loading</span>}
                {s.done && (
                  <span className="ld-tile-tick">
                    <Tick />
                  </span>
                )}
                <span className="ld-tile-n">{s.seq}</span>
                <b className="ld-tile-name">{s.outletName}</b>
                <span className="mono small">{s.planned} items</span>
                {s.short > 0 && <span className="ld-tile-short">{s.short} short</span>}
              </div>
            ))}
          </div>
          <div className="ld-rear label">
            Rear
            <br />
            doors
          </div>
        </div>
        <div className="ld-truck-notes muted small">
          <span>Unloaded last</span>
          <span>Load direction → unloaded first</span>
        </div>
      </div>

      <div className="ld-list">
        {stops.map((s, i) => {
          const body = (
            <>
              <span className="mono muted">Load {ordinal(i + 1)}</span>
              <span className="stencil ld-order-n">{s.seq}</span>
              <b className="ld-order-name">
                {s.outletId} {s.outletName}
              </b>
              <span className="mono muted">{s.planned} items</span>
              <span className="ld-order-status">
                {s.short > 0 && <span className="ld-chip bad">{s.short} short</span>}
                <span className={`ld-chip ${tone(s)}`}>{label(s, i)}</span>
              </span>
            </>
          );
          return s.target ? (
            <Link key={s.seq} to={goTo(s)} className={`ld-order${s === current ? " current" : ""}`}>
              {body}
            </Link>
          ) : (
            <div key={s.seq} className="ld-order">
              {body}
            </div>
          );
        })}
      </div>

      <div className="ld-plan-foot">
        <div className="col" style={{ gap: 8, flex: 1, maxWidth: 420 }}>
          <div
            className="ld-progress-bar"
            role="progressbar"
            aria-valuenow={linesDone}
            aria-valuemin={0}
            aria-valuemax={lines.length}
          >
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="muted small">
            {linesDone} of {lines.length} lines checked · {stopsOn} of {stops.length} stops on the truck ·{" "}
            {sum(lines, "loaded")} of {sum(lines, "planned")} items
          </span>
        </div>
        <div className="row" style={{ gap: 12 }}>
          {current && (
            <Link className="btn secondary big" to={`/loader/run/${runId}/complete`}>
              Finish loading
            </Link>
          )}
          {current ? (
            <Link className="btn now ld-confirm" style={{ padding: "0 36px" }} to={goTo(current)}>
              Scan stop {current.seq} · {current.outletName} →
            </Link>
          ) : (
            <Link
              className="btn now ld-confirm"
              style={{ padding: "0 36px" }}
              to={`/loader/run/${runId}/complete`}
            >
              All on the truck. Finish loading →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
