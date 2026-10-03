// DP4 Deferral decision: write the reason the store will read. Owner: DISPATCHER FRONTEND.  Design: /design/DP4-DeferralDecision.jpg
// WORKING BASELINE: sends the deferral. Opened from DP3 (Wednesday plan) or DP1 (move a stop of a run on the road). TODO: preview of the store notice (SM5) next to the form.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, useToast } from "../../shared/ui.jsx";
import { kg } from "../../shared/format.js";

const TEMPLATE =
  "Our refrigerated trucks are fully booked on Wednesday. Your last chilled delivery was recent, so a store that has waited longer goes first this time. Your order arrives first thing Thursday.";

export default function DP4DeferralDecision() {
  const { state } = useLocation();
  const nav = useNavigate();
  const orderIds = state?.orderIds || [];
  const orders = useApi("/orders");
  const [reason, setReason] = useState(state?.reason || TEMPLATE);
  const [toDate, setToDate] = useState(state?.toDate || "2026-10-01");
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();

  if (!orderIds.length)
    return (
      <>
        <PageHead code="DP4" title="Deferral decision" />
        <Card>
          Pick who waits on the <Link to="/dispatcher/plan">Plan</Link> screen first.
        </Card>
      </>
    );
  if (orders.loading) return <Loading />;
  const rows = orders.data.filter((o) => orderIds.includes(o.id)).map((o) => ({ ...o, orderId: o.id }));

  const send = async () => {
    setBusy(true);
    try {
      await api.post("/deferrals", { orderIds, toDate, reason, decidedBy: "Kavindi Perera" });
      show("Sent. The stores were told the reason.");
      setTimeout(() => nav("/dispatcher/deferrals"), 900);
    } catch (e) {
      show(e.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        code="DP4"
        title="Deferral decision"
        sub="Every store that waits gets the reason in plain words, not just a new date."
      />
      <div className="grid-2">
        <Card title={`${rows.length} order(s) will wait`}>
          <div className="stack" style={{ gap: 10 }}>
            {rows.map((r) => (
              <div key={r.orderId} className="row between">
                <b>{r.outletName}</b>
                <span className="mono small">
                  {r.orderId} · {kg(r.kg)}
                </span>
                <Badge tone="now">waits</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Message to the stores">
          <div className="stack">
            <label className="field">
              <span className="label">New delivery date</span>
              <input
                className="input"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="label">Reason (the store manager reads this)</span>
              <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <button className="btn now big" disabled={busy || reason.trim().length < 20} onClick={send}>
              Confirm and tell {rows.length} store{rows.length === 1 ? "" : "s"}
            </button>
          </div>
        </Card>
      </div>
      {toast}
    </>
  );
}
