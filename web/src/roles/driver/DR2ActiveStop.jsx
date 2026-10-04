// DR2 Active stop.  Design: docs/design/DR2-ActiveStop.jpg
// One stop at a time: dock window, who receives, directions and what to hand over. One main action.
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { useDriver, RUN } from "./outbox.js";
import { Icon, icon } from "./icons.jsx";
import "./driver.css";

export default function DR2ActiveStop() {
  const { seq } = useParams();
  const { outbox } = useDriver();
  const { data, loading, error } = useApi(`/runs/${RUN}`, [
    "load.shortfall",
    "deferral.decided",
    "deferral.reversed",
    "delivery.recorded",
    "sync.resolved",
  ]);
  const s = data?.stops.find((x) => String(x.seq) === seq);
  const moved = s?.order?.status === "deferred";
  // Only ask for the deferral when dispatch moved this stop, so the driver can read why.
  const { data: deferrals } = useApi(moved ? `/deferrals?outletId=${s.outletId}` : null, [
    "deferral.decided",
  ]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!s) return <ErrorNote error={{ message: `There is no stop ${seq} on today's route.` }} />;

  const lines = s.order?.lines || [];
  const items = lines.reduce((sum, l) => sum + l.qty, 0);
  const saved = outbox.find((r) => r.orderId === s.orderId);
  const deferral = deferrals?.find((x) => x.orderId === s.orderId && !x.reversed);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${s.outlet?.lat},${s.outlet?.lng}`;

  return (
    <>
      <Link to="/driver/route" className="dr-back">
        ← Route
      </Link>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">
          Stop {s.seq} of {data.stops.length} · arriving {s.eta}
        </span>
        <h1 className="dr-title">
          {s.outletId} {s.outletName}
        </h1>
        <span className="muted">
          Dock open {s.outlet?.dockOpen}–{s.outlet?.dockClose}
        </span>
      </div>

      <div className="dr-place">
        <svg className="dr-map" viewBox="0 0 340 130" aria-hidden="true">
          <path d="M60 0L40 130M160 0l-30 130M260 0l-20 130" className="road" />
          <path d="M0 96L340 60" className="road main" />
          <path d="M28 93L200 74" className="route" />
          <circle cx="28" cy="93" r="6" className="truck" />
          <circle cx="200" cy="58" r="11" className="pin" />
          <path d="M200 69v12" className="route" />
          <text x="20" y="122" className="map-label">
            A1 KANDY ROAD
          </text>
        </svg>
        <div className="row between" style={{ padding: "12px 14px", gap: 12 }}>
          <div className="col" style={{ gap: 2 }}>
            <b>{s.outletName}</b>
            <span className="small muted">{s.outlet?.manager}, store manager</span>
          </div>
          <a className="btn secondary" href={directions} target="_blank" rel="noreferrer">
            Directions
          </a>
        </div>
      </div>

      {s.shortfalls.map((x) => (
        <div key={x.id} className="notice bad small">
          <b>
            Only {x.loaded} of {x.planned} {x.name}.
          </b>{" "}
          Short at the dock at {time(x.at)}. The store already knows, and the other {x.planned - x.loaded}{" "}
          come on the next delivery.
        </div>
      ))}
      {moved && (
        <div className="notice bad small">
          <b>Dispatch moved this stop{deferral ? ` to ${day(deferral.toDate)}` : ""}.</b>{" "}
          {deferral?.reason ? `"${deferral.reason}" ` : ""}If you deliver anyway, record it as usual. The
          office will ask you to confirm when the phone syncs.
        </div>
      )}
      {saved && (
        <div className="notice cold small">
          {saved.status === "failed" ? "Problem report" : "Delivery"} saved on this phone at{" "}
          {time(saved.recordedAt)}. It sends by itself.
        </div>
      )}
      {!saved && s.status === "delivered" && (
        <div className="notice ok small">Delivered. Nothing to do here.</div>
      )}

      <div className="dr-list">
        <div className="dr-list-head">
          <span className="label">Hand over</span>
          <span className="small muted">
            {items} items{s.order?.chilled ? " · chilled" : ""}
          </span>
        </div>
        {lines.map((l) => {
          const sf = s.shortfalls.find((x) => x.sku === l.sku);
          return (
            <div key={l.sku} className={`dr-line ${sf ? "short" : ""}`}>
              {sf && <Icon d={icon.flag} size={18} />}
              <span className="fill">{l.name}</span>
              <b className="mono">{sf ? `${sf.loaded} of ${l.qty}` : l.qty}</b>
            </div>
          );
        })}
      </div>

      {!saved && s.status !== "delivered" && (
        <div className="col" style={{ gap: 6, marginTop: "auto" }}>
          <Link className="btn big block" to={`/driver/stop/${s.seq}/deliver`}>
            I've arrived · start handover
          </Link>
          <Link className="btn ghost big block" to={`/driver/stop/${s.seq}/issue`}>
            Can't deliver here
          </Link>
        </div>
      )}
    </>
  );
}
