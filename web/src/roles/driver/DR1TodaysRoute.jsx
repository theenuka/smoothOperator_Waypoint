// DR1 Today's route.  Design: docs/design/DR1-TodaysRoute.jpg
// The whole run on one screen: stops in order on a route line (solid = done, dotted = still to drive).
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { useDriver, RUN } from "./outbox.js";
import { Icon, icon } from "./icons.jsx";
import "./driver.css";

const itemCount = (order) => (order?.lines || []).reduce((sum, l) => sum + l.qty, 0);
const short = (x) => x.name.split(",")[0].toLowerCase(); // "Detergent powder, 1 kg" -> "detergent powder"

export default function DR1TodaysRoute() {
  const { data, loading, error } = useApi(`/runs/${RUN}`, [
    "delivery.recorded",
    "sync.resolved",
    "deferral.decided",
    "deferral.reversed",
    "load.shortfall",
  ]);
  const { outbox } = useDriver();
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  // What the phone knows wins over the server until it is sent: a saved record is "done" for the driver.
  const onPhone = (s) => outbox.find((r) => r.orderId === s.orderId);
  const state = (s) => {
    const rec = onPhone(s);
    if (rec) return rec.status === "failed" ? "failed" : "saved";
    if (s.order?.status === "deferred") return "moved";
    return s.status; // delivered | next | pending | failed
  };
  const done = (st) => ["delivered", "saved", "failed", "moved"].includes(st);
  const next = data.stops.find((s) => !done(state(s)));
  const shortfalls = data.stops.flatMap((s) => s.shortfalls.map((x) => ({ ...x, outletName: s.outletName })));
  const last = data.stops[data.stops.length - 1];

  return (
    <>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">
          {day(data.date)} · {data.vehicleId} · {time(new Date().toISOString())}
        </span>
        <h1 className="dr-title">Kandy run</h1>
        <span className="muted">
          {data.stops.length} stops · last stop about {last.eta} · keys back at bay {data.bay}
        </span>
      </div>

      {shortfalls.map((x) => (
        <div key={x.id} className="notice small row dr-notice">
          <Icon d={icon.flag} size={18} />
          <span>
            <b>
              {x.outletName} gets {x.loaded} of {x.planned} {short(x)}.
            </b>{" "}
            Flagged at the dock at {time(x.at)}. The outlet already knows, so nothing to explain at the door.
          </span>
        </div>
      ))}

      <ol className="dr-route">
        {data.stops.map((s) => {
          const st = state(s);
          const isNext = next && s.seq === next.seq;
          const sf = s.shortfalls[0];
          return (
            <li key={s.seq} className={`dr-stop ${done(st) ? "done" : ""} ${isNext ? "next" : ""}`}>
              <span className="dr-stop-eta mono">{s.eta}</span>
              <span className="dr-stop-dot">
                {st === "delivered" || st === "saved" ? <Icon d={icon.check} size={16} /> : s.seq}
              </span>
              <Link to={`/driver/stop/${s.seq}`} className="dr-stop-body">
                <b>
                  {s.outletId} {s.outletName}
                </b>
                <span className="small muted">
                  {s.order?.chilled ? "Chilled · " : ""}
                  {s.outlet?.dockOpen}–{s.outlet?.dockClose} · {itemCount(s.order)} items
                </span>
                {isNext && <span className="badge now">Next stop</span>}
                {st === "delivered" && <span className="badge ok">Delivered</span>}
                {st === "saved" && <span className="badge cold">Saved on phone, sends by itself</span>}
                {st === "failed" && <span className="badge bad">Not delivered</span>}
                {st === "moved" && <span className="badge bad">Moved by dispatch</span>}
                {sf && !done(st) && (
                  <span className="badge bad">
                    {sf.planned - sf.loaded} {short(sf)} short, known
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>

      {next ? (
        <Link to={`/driver/stop/${next.seq}`} className="btn big block" style={{ marginTop: "auto" }}>
          {next.seq === 1 ? "Start the run" : `Next stop: ${next.outletName}`} →
        </Link>
      ) : (
        <Link to="/driver/summary" className="btn big block" style={{ marginTop: "auto" }}>
          All stops done · see the summary →
        </Link>
      )}
    </>
  );
}
