// SM5 Notices: deferrals and shortfalls, with the reason. Owner: STORE FRONTEND.  Design: /design/SM5-DeferralNotice.jpg
import { useState } from "react";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, Empty, useToast } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import "./store.css";

const LIVE = ["deferral.decided", "load.shortfall", "sync.resolved"];

// A notice has no deferral id, so match on outlet + time sent
const findDeferral = (n, all) =>
  n.type === "deferral"
    ? all.find((d) => d.outletId === n.outletId && Math.abs(new Date(d.at) - new Date(n.at)) < 120000)
    : null;

function NoticeDetail({ notice, deferral, orders, onGotIt, onCall }) {
  // Which order is this notice about? Only use orders this outlet really has.
  const orderId = deferral
    ? orders.find((o) => o.id === deferral.orderId)?.id
    : orders.find((o) => o.status !== "delivered" && o.lines.some((l) => notice.body.includes(l.name)))?.id;
  const order = useApi(orderId ? `/orders/${orderId}` : null);

  const isShort = notice.type === "shortfall";
  const shortBy = Object.fromEntries(
    (order.data?.shortfalls || []).map((s) => [s.sku, s.planned - s.loaded])
  );
  const why = deferral ? deferral.reason : notice.body;
  const who = deferral
    ? `${deferral.decidedBy}, dispatch`
    : order.data?.shortfalls?.[0]?.by
      ? `${order.data.shortfalls[0].by}, dock`
      : "";
  const refId = deferral?.orderId || orderId;

  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="sm-paper">
        <div className="row between">
          <span className="label">
            {isShort ? "Shortfall notice" : "Delivery notice"}
            {refId ? ` · ${refId}` : ""}
          </span>
          <Badge tone={isShort ? "bad" : "now"}>{notice.type}</Badge>
        </div>
        <span className="label">Why</span>
        <p className="sm-quote">“{why}”</p>
        {who && <span className="small muted">{who}</span>}
      </div>

      <Card title="Order details">
        {order.data?.lines?.length > 0 ? (
          order.data.lines.map((l) => (
            <div key={l.sku} className="sm-linerow">
              <span>
                {l.name}, {l.unit}
              </span>
              <span className="row">
                {shortBy[l.sku] > 0 && <Badge tone="bad">{shortBy[l.sku]} short</Badge>}
                <b className="mono">{l.qty}</b>
              </span>
            </div>
          ))
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            The order lines are not available for this notice.
          </p>
        )}
        <div className="row" style={{ marginTop: 16 }}>
          {!notice.read ? (
            <button className="btn" onClick={onGotIt}>
              Got it
            </button>
          ) : (
            <Badge tone="ok">Read</Badge>
          )}
          <button className="btn secondary" onClick={onCall}>
            Call dispatch
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function SM5DeferralNotice({ outletId }) {
  const notices = useApi(`/notices?outletId=${outletId}`, LIVE);
  const deferrals = useApi(`/deferrals?outletId=${outletId}`, LIVE);
  const orders = useApi(`/orders?outletId=${outletId}`, LIVE);
  const [pickedId, setPickedId] = useState(null);
  const [toast, show] = useToast();

  if (notices.loading || deferrals.loading || orders.loading) return <Loading />;
  const list = notices.data || [];
  if (list.length === 0)
    return (
      <>
        <PageHead code={`SM5 · ${outletId}`} title="Notices" />
        <Empty>No notices. Everything is on time.</Empty>
      </>
    );

  // Show the picked notice, else the newest unread one, else the newest
  const notice = list.find((n) => n.id === pickedId) || list.find((n) => !n.read) || list[0];
  const deferral = findDeferral(notice, deferrals.data || []);

  const markRead = async () => {
    await api.post(`/notices/${notice.id}/read`);
    notices.reload();
    show("Marked as read");
  };

  return (
    <>
      <PageHead code={`SENT ${day(notice.at)} · ${time(notice.at)}`} title={notice.title} />

      {list.length > 1 && (
        <div className="sm-tabs">
          {list.map((n) => (
            <button
              key={n.id}
              className={`btn ${n.id === notice.id ? "" : "secondary"}`}
              onClick={() => setPickedId(n.id)}
            >
              {day(n.at)} · {n.type}
              {!n.read && " ●"}
            </button>
          ))}
        </div>
      )}

      <NoticeDetail
        key={notice.id}
        notice={notice}
        deferral={deferral}
        orders={orders.data || []}
        onGotIt={markRead}
        onCall={() => show("Phone line is not connected in this demo")}
      />
      {toast}
    </>
  );
}
