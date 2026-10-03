// SM3 Orders. Owner: STORE FRONTEND.  Design: /design/SM3-OrderQueue.jpg
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { PageHead, Loading, ErrorNote, Badge, Empty } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import "./store.css";

const LIVE = ["order.placed", "deferral.decided", "delivery.recorded", "load.shortfall", "sync.resolved"];

export default function SM3OrderQueue({ outletId }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const meta = useApi("/meta");
  const orders = useApi(`/orders?outletId=${outletId}`, LIVE);
  const deliveries = useApi(`/deliveries?outletId=${outletId}`, LIVE);
  const deferrals = useApi(`/deferrals?outletId=${outletId}`, LIVE);
  const notices = useApi(`/notices?outletId=${outletId}`, LIVE);

  if (orders.error) return <ErrorNote error={orders.error} />;
  if (meta.loading || orders.loading || deliveries.loading || deferrals.loading || notices.loading)
    return <Loading />;

  const demoDate = meta.data.meta.demoDate;
  const since = new Date(Date.parse(demoDate) - 14 * 86400000).toISOString().slice(0, 10);

  const arrivedAt = Object.fromEntries(
    (deliveries.data || []).filter((d) => d.status === "delivered").map((d) => [d.orderId, d.recordedAt])
  );
  const deferralOf = Object.fromEntries(
    (deferrals.data || []).filter((d) => !d.reversed).map((d) => [d.orderId, d])
  );
  // A shortfall notice sent on the delivery day that names one of the order's items
  const shortNoticeOf = (o) =>
    (notices.data || []).find(
      (n) =>
        n.type === "shortfall" &&
        n.at.slice(0, 10) === o.deliveryDate &&
        o.lines.some((l) => n.body.includes(l.name))
    );

  const rows = (orders.data || [])
    .filter((o) => o.deliveryDate >= since)
    .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate) || b.id.localeCompare(a.id))
    .map((o) => {
      const def = deferralOf[o.id];
      const short = shortNoticeOf(o);
      const deferred = o.status === "deferred";
      const check = o.status === "delivered" && o.deliveryDate === demoDate;
      let note = "";
      if (deferred) note = def ? `Moved to ${day(def.toDate)}` : "Moved to a later day";
      else if (short) note = short.title;
      else if (def) note = `Carried from ${day(def.fromDate)}`;
      else if (o.status === "placed" && o.chilled) note = "Chilled slot held";
      return {
        o,
        deferred,
        check,
        note,
        problem: deferred || !!short,
        open: !deferred && (o.status !== "delivered" || check),
      };
    });

  const openCount = rows.filter((r) => r.open).length;
  const problemCount = rows.filter((r) => r.problem).length;
  const shown = rows.filter((r) => (tab === "open" ? r.open : tab === "problem" ? r.problem : true));
  const outletName = orders.data?.[0]?.outletName;

  const status = (r) => {
    const { o } = r;
    if (r.check)
      return (
        <Link
          to="/store/receive"
          onClick={(e) => e.stopPropagation()}
          className="row"
          style={{ textDecoration: "none", fontWeight: 600, gap: 8 }}
        >
          <span className="sm-sq" /> Check what arrived
        </Link>
      );
    if (r.deferred)
      return (
        <Badge tone="bad">
          <span className="sm-sq bad" /> Deferred
        </Badge>
      );
    if (o.status === "delivered")
      return (
        <Badge tone="ok">
          <span className="dot" /> Delivered
        </Badge>
      );
    if (o.status === "placed") return <Badge>Placed {time(o.placedAt)}</Badge>;
    return <Badge tone="ok">{o.status.replace("_", " ")}</Badge>;
  };

  return (
    <>
      <PageHead
        code={`${outletId}${outletName ? " " + outletName.toUpperCase() : ""} · LAST 14 DAYS`}
        title="Orders"
      >
        <div className="sm-seg" role="tablist">
          <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
            All
          </button>
          <button className={tab === "open" ? "on" : ""} onClick={() => setTab("open")}>
            Open {openCount}
          </button>
          <button className={tab === "problem" ? "on" : ""} onClick={() => setTab("problem")}>
            Had a problem {problemCount}
          </button>
        </div>
      </PageHead>

      {shown.length === 0 ? (
        <Empty>No orders here.</Empty>
      ) : (
        <div className="card pad-0">
          <table className="table sm-orders">
            <thead>
              <tr>
                <th className="label">Order</th>
                <th className="label">Delivery day</th>
                <th className="label" style={{ textAlign: "right" }}>
                  Lines
                </th>
                <th className="label">Status</th>
                <th className="label">Arrived</th>
                <th className="label">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.o.id}
                  className={r.check ? "sm-row-now" : ""}
                  onClick={() => navigate(`/store/orders/${r.o.id}`)}
                >
                  <td>
                    <Link className="mono" style={{ fontWeight: 700 }} to={`/store/orders/${r.o.id}`}>
                      {r.o.id}
                    </Link>
                  </td>
                  <td>{day(r.o.deliveryDate)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {r.o.lines.length}
                  </td>
                  <td>{status(r)}</td>
                  <td className="mono">{arrivedAt[r.o.id] ? time(arrivedAt[r.o.id]) : "–"}</td>
                  <td className="muted">{r.note}</td>
                  <td className="muted" style={{ textAlign: "right" }}>
                    ›
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        Waypoint won't defer the same outlet twice in a row. When you wait once, your next order is protected.
      </p>
    </>
  );
}
