// SM1 Today. Owner: STORE FRONTEND.  Design: /design/SM1-Dashboard.jpg
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Stat, StatusBadge, Loading, Badge } from "../../shared/ui.jsx";
import { day } from "../../shared/format.js";

const LIVE = ["deferral.decided", "load.shortfall", "delivery.recorded", "sync.resolved", "order.placed"];

export default function SM1Dashboard({ outletId }) {
  const orders = useApi(`/orders?outletId=${outletId}`, LIVE);
  const notices = useApi(`/notices?outletId=${outletId}`, LIVE);
  if (orders.loading || notices.loading) return <Loading />;
  const unread = notices.data.filter((n) => !n.read);
  const upcoming = orders.data.filter((o) => o.status !== "delivered");
  return (
    <>
      <PageHead
        code={`SM1 · ${outletId}`}
        title="What's coming"
        sub="Your deliveries, and anything that changed, in plain words."
      >
        <Link to="/store/order" className="btn now">
          Place an order
        </Link>
      </PageHead>
      {unread[0] && (
        <Link
          to="/store/notices"
          className={`notice ${unread[0].type === "shortfall" ? "bad" : ""}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <b>{unread[0].title}</b> <span className="small">· open notice</span>
        </Link>
      )}
      <div className="grid-4">
        <Stat label="Coming" value={upcoming.length} />
        <Stat label="Unread notices" value={unread.length} tone={unread.length ? "bad" : "ok"} />
        <Stat label="Delivered" value={orders.data.length - upcoming.length} tone="ok" />
      </div>
      <Card title="Your orders">
        {orders.data.map((o) => (
          <Link
            key={o.id}
            to={`/store/orders/${o.id}`}
            className="row between"
            style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", textDecoration: "none" }}
          >
            <span className="mono">{o.id}</span>
            <span>{day(o.deliveryDate)}</span>
            {o.chilled ? <Badge tone="cold">Chilled</Badge> : <Badge>Dry</Badge>}
            <StatusBadge status={o.status} />
          </Link>
        ))}
      </Card>
    </>
  );
}
