// LD1 Dock home: one card per bay, the bay being loaded now is yellow.  Design: docs/design/LD1-DockHome.jpg
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi, useDates, useEventFeed, useLiveEvent } from "../../shared/live.js";
import { ErrorNote, Loading } from "../../shared/ui.jsx";
import { day, longDay, time, weekdayOf } from "../../shared/format.js";
import "./loader.css";

const MIN_BAYS = 4;

const pad = (n) => String(n).padStart(2, "0");
const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);
// "2026-09-29T06:30:00+05:30" or "06:30" -> "06:30". Anything else -> null.
const hhmm = (v) =>
  typeof v === "string" ? (v.includes("T") ? time(v) : /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null) : null;
const shortName = (name) => {
  if (!name) return "";
  const p = String(name).trim().split(/\s+/);
  return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(" ")}` : p[0];
};

/** /loads/:runId for every run, reloaded when a shortfall or a seal happens. */
function useLoads(runs) {
  const key = runs.map((r) => r.id).join(",");
  const [loads, setLoads] = useState({});
  const [tick, setTick] = useState(0);
  useLiveEvent(["load.completed", "load.shortfall"], () => setTick((t) => t + 1));
  useEffect(() => {
    let stale = false;
    Promise.all(
      runs.map((r) =>
        api
          .get(`/loads/${r.id}`)
          .then((l) => [r.id, l])
          .catch(() => [r.id, null])
      )
    ).then((pairs) => !stale && setLoads(Object.fromEntries(pairs)));
    return () => {
      stale = true;
    };
  }, [key, tick]);
  return loads;
}

export default function LD1DockHome() {
  const { today, planDate } = useDates();
  // Today's trucks, plus tomorrow's once the dispatcher has sent the plan to the dock.
  const runsApi = useApi(today ? "/runs" : null, ["load.completed", "load.shortfall", "plan.released"]);
  const runs = (runsApi.data ?? []).filter((r) => r.date === today || r.date === planDate);
  const loads = useLoads(runs);
  const { events } = useEventFeed(30);
  if (runsApi.loading) return <Loading />;
  if (runsApi.error) return <ErrorNote error={runsApi.error} />;

  const infos = runs.map((r) => {
    const l = loads[r.id];
    const lines = l?.lines ?? [];
    const sfs = l?.shortfalls ?? [];
    const done = lines.filter(
      (x) => x.checked || sfs.some((s) => s.orderId === x.orderId && s.sku === x.sku)
    ).length;
    return {
      r,
      sealed: l?.status === "sealed" || ["on_road", "done"].includes(r.status),
      sealedAt: hhmm(l?.sealedAt),
      done,
      left: lines.length - done,
      items: sum(lines, "planned"),
      short: sfs.length,
      ready: Boolean(l),
    };
  });

  // The bay being loaded now: a truck that is already part-checked, else the first one waiting.
  const toLoad = infos.filter((i) => !i.sealed).length;
  const current = infos.find((i) => !i.sealed && i.done > 0) ?? infos.find((i) => !i.sealed);

  const bayCount = Math.max(MIN_BAYS, ...runs.map((r) => Number(r.bay) || 0));
  const bays = Array.from({ length: bayCount }, (_, i) => {
    const here = infos.filter((x) => Number(x.r.bay) === i + 1);
    return {
      n: i + 1,
      info: here.find((x) => x === current) ?? here.find((x) => !x.sealed) ?? here[0] ?? null,
    };
  });

  // Plan changes that touch a truck on this dock today (deferrals).
  const orderIds = new Set(runs.flatMap((r) => r.stops.map((s) => s.orderId)));
  const outlets = new Set(runs.flatMap((r) => r.stops.map((s) => s.outletName)));
  const changes = events
    .filter(
      (ev) =>
        ev.type === "deferral.decided" &&
        (orderIds.has(ev.payload?.orderId) || outlets.has(ev.payload?.outletName))
    )
    .slice(0, 3);

  return (
    <>
      <div className="row between wrap">
        <div className="col" style={{ gap: 4 }}>
          <span className="label">LD1 · {longDay(today)} · 04:30 shift</span>
          <h1 className="h-page" style={{ fontSize: 52 }}>
            {toLoad} truck{toLoad === 1 ? "" : "s"} to load, {bayCount} bays
          </h1>
        </div>
        <Link className="btn secondary big" to="/loader/history">
          Loading history
        </Link>
      </div>

      <div className="ld-bays">
        {bays.map(({ n, info }) => {
          if (!info)
            return (
              <div key={n} className="ld-bay-card free">
                <span className="label">Bay</span>
                <span className="bay ld-bay-n">{pad(n)}</span>
                <span className="muted">Free</span>
              </div>
            );
          const { r } = info;
          const isNow = info === current;
          const vt = typeof r.vehicle === "object" ? (r.vehicle?.type ?? r.vehicle?.kind ?? "") : "";
          const cold = /reef|chill|cold/i.test(vt);
          const departs = hhmm(r.departs ?? r.departAt ?? r.departure);
          return (
            <Link
              key={n}
              to={`/loader/run/${r.id}`}
              className={`ld-bay-card${isNow ? " current" : ""}${info.sealed ? " sealed" : ""}`}
            >
              {isNow && <div className="hazard ld-bay-haz" />}
              <span className="label">Bay</span>
              <span className="bay ld-bay-n">{pad(n)}</span>
              <div className="row">
                <b className="mono ld-bay-veh">{r.vehicleId}</b>
                {vt && <span className={`badge ${cold ? "cold" : ""}`}>{vt}</span>}
              </div>
              <span className="muted small">
                {r.date === planDate ? `For ${weekdayOf(planDate)} · ` : ""}
                {r.name ? `${r.name} · ` : ""}
                {r.stops.length} stop{r.stops.length === 1 ? "" : "s"}
                {info.items ? ` · ${info.items} items` : ""}
                {r.driver ? ` · ${shortName(r.driver)}` : ""}
              </span>

              <div className="ld-bay-foot">
                {info.sealed ? (
                  <span className="ld-chip ok">Loaded{info.sealedAt ? ` ${info.sealedAt}` : ""}</span>
                ) : (
                  <>
                    {info.ready && (
                      <span className="ld-bay-left">
                        {info.left} line{info.left === 1 ? "" : "s"} left
                        {info.short > 0 && <span className="ld-bay-short"> · {info.short} short</span>}
                      </span>
                    )}
                    {isNow ? (
                      <span className="btn now ld-start">
                        {info.done > 0 ? "Continue loading" : "Start loading"} →
                      </span>
                    ) : (
                      <span className="ld-chip plain">Queued</span>
                    )}
                  </>
                )}
                {departs && <span className="muted small">Departs {departs}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {changes.length > 0 && (
        <div className="card">
          <div className="row" style={{ gap: 12, marginBottom: 6 }}>
            <b>Changed since the printout</b>
            <span className="muted small">the tablet always shows the current plan</span>
          </div>
          {changes.map((ev) => {
            const p = ev.payload || {};
            return (
              <div className="ld-change" key={ev.id}>
                <span className="mono muted">{hhmm(ev.at) ?? ""}</span>
                <span className="fill">
                  {p.outletName || "An order"} deferred{p.toDate ? ` to ${day(p.toDate)}` : ""}.
                  {p.reason ? ` ${p.reason}` : ""}
                </span>
                <span className="muted small">{p.decidedBy ? `${p.decidedBy}, dispatch` : "dispatch"}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
