// LD1 Dock home. Owner: LOADER FRONTEND.  Design: /design/LD1-DockHome.jpg
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, StatusBadge } from "../../shared/ui.jsx";

export default function LD1DockHome() {
  const { data, loading } = useApi("/runs?date=2026-09-29", ["load.completed", "load.shortfall"]);
  if (loading) return <Loading />;
  return (
    <>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">LD1 · Tuesday 29 September · 04:30 shift</span>
        <h1 className="h-page">Trucks at the dock</h1>
      </div>
      <div className="grid-2">
        {data.map((r) => (
          <Link
            key={r.id}
            to={`/loader/run/${r.id}`}
            className="card row"
            style={{ textDecoration: "none", gap: 18 }}
          >
            <div className="col" style={{ gap: 2, alignItems: "center" }}>
              <span className="label">Bay</span>
              <span className="bay">{r.bay}</span>
            </div>
            <div className="col fill">
              <b style={{ fontSize: 20 }} className="mono">
                {r.vehicleId}
              </b>
              <span className="muted">
                {r.driver} · {r.stops.length} stops
              </span>
            </div>
            <StatusBadge status={r.status === "on_road" || r.status === "done" ? "sealed" : r.status} />
          </Link>
        ))}
      </div>
    </>
  );
}
