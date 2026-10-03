// DR1 Today's route. Owner: DRIVER FRONTEND.  Design: /design/DR1-TodaysRoute.jpg
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, Badge } from "../../shared/ui.jsx";
import { useDriver, RUN } from "./outbox.js";

export default function DR1TodaysRoute() {
  const { data, loading } = useApi(`/runs/${RUN}`, [
    "delivery.recorded",
    "sync.resolved",
    "deferral.decided",
    "load.shortfall",
  ]);
  const { outbox } = useDriver();
  if (loading) return <Loading />;
  const savedOnPhone = (orderId) => outbox.some((r) => r.orderId === orderId);
  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        <span className="label">DR1 · Tuesday 29 September</span>
        <h1 className="h-page" style={{ fontSize: 30 }}>
          Today's route
        </h1>
      </div>
      {data.stops.map((s) => {
        const status = savedOnPhone(s.orderId)
          ? "saved"
          : s.order?.status === "deferred"
            ? "deferred"
            : s.status;
        return (
          <Link key={s.seq} to={`/driver/stop/${s.seq}`} className={`stop ${s.status}`}>
            <span className="seq">{s.seq}</span>
            <div className="col fill" style={{ gap: 2 }}>
              <b>{s.outletName}</b>
              <span className="small muted">
                ETA {s.eta} · dock {s.outlet?.dockOpen}–{s.outlet?.dockClose}
              </span>
              {s.shortfalls.length > 0 && (
                <span className="small err">
                  Short: {s.shortfalls.map((x) => `${x.loaded}/${x.planned} ${x.name}`).join(", ")}
                </span>
              )}
            </div>
            <Badge
              tone={
                status === "delivered"
                  ? "ok"
                  : status === "next"
                    ? "now"
                    : status === "saved"
                      ? "cold"
                      : status === "deferred"
                        ? "bad"
                        : ""
              }
            >
              {status === "saved" ? "saved on phone" : status}
            </Badge>
          </Link>
        );
      })}
    </>
  );
}
