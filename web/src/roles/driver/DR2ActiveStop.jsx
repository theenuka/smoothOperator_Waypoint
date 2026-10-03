// DR2 Active stop. Owner: DRIVER FRONTEND.  Design: /design/DR2-ActiveStop.jpg
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, Loading } from "../../shared/ui.jsx";
import { RUN } from "./outbox.js";

export default function DR2ActiveStop() {
  const { seq } = useParams();
  const { data, loading } = useApi(`/runs/${RUN}`, ["load.shortfall", "deferral.decided"]);
  if (loading) return <Loading />;
  const s = data.stops.find((x) => String(x.seq) === seq);
  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        <span className="label">
          DR2 · Stop {s.seq} of {data.stops.length} · {s.orderId}
        </span>
        <h1 className="h-page" style={{ fontSize: 34 }}>
          {s.outletName}
        </h1>
        <span className="muted">
          Manager: {s.outlet?.manager || "—"} · ETA {s.eta}
        </span>
      </div>
      {s.shortfalls.map((x) => (
        <div key={x.id} className="notice bad">
          <b>
            Only {x.loaded} of {x.planned} {x.name}.
          </b>{" "}
          Short at the dock this morning. The store already knows, and the other {x.planned - x.loaded} come
          on the next delivery.
        </div>
      ))}
      <Card title="What to hand over">
        {(s.order?.lines || []).map((l) => {
          const sf = s.shortfalls.find((x) => x.sku === l.sku);
          return (
            <div
              key={l.sku}
              className="row between"
              style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}
            >
              <span>{l.name}</span>
              <b className="mono">{sf ? `${sf.loaded} (of ${l.qty})` : l.qty}</b>
            </div>
          );
        })}
      </Card>
      <Link className="btn now big block" to={`/driver/stop/${s.seq}/deliver`}>
        Deliver here
      </Link>
      <Link className="btn secondary block" to={`/driver/stop/${s.seq}/issue`}>
        Problem at this stop
      </Link>
    </>
  );
}
