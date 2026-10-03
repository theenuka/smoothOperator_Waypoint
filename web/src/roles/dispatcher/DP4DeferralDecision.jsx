// DP4 Deferral decision: write the reason the store will read. Owner: DISPATCHER FRONTEND. Design: /design/DP4-DeferralDecision.jpg
// Matches design: Interactive decision table, live preview of the store notice (styled like SM5), and confirmation panel.
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, useToast } from "../../shared/ui.jsx";
import { kg, day } from "../../shared/format.js";
import "./dispatcher.css";

const DEFAULT_REASON =
  "One of our refrigerated trucks is in for a brake service on Wednesday. Your last chilled delivery was recent, so your order moves to Thursday 1 October in the same window, and it won't be moved again.";

export default function DP4DeferralDecision() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [toast, show] = useToast();

  const orders = useApi("/orders?date=2026-09-30");
  const suggest = useApi("/plan/suggest?date=2026-09-30");

  const [selectedIds, setSelectedIds] = useState(state?.orderIds || []);
  const [reason, setReason] = useState(state?.reason || DEFAULT_REASON);
  const [toDate, setToDate] = useState(state?.toDate || "2026-10-01");
  const [busy, setBusy] = useState(false);

  // If no IDs passed from state, default to suggested waiting orders
  useEffect(() => {
    if (!selectedIds.length && suggest.data) {
      const suggestedWaitIds = suggest.data.rows.filter((r) => r.suggestion === "wait").map((r) => r.orderId);
      if (suggestedWaitIds.length) {
        setSelectedIds(suggestedWaitIds);
      }
    }
  }, [suggest.data, selectedIds.length]);

  if (orders.loading || suggest.loading) return <Loading />;

  const allOrders = orders.data || [];
  const rows = suggest.data?.rows || [];

  // Toggle order between serve and wait
  const setDecision = (orderId, shouldWait) => {
    if (shouldWait) {
      if (!selectedIds.includes(orderId)) {
        setSelectedIds([...selectedIds, orderId]);
      }
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== orderId));
    }
  };

  const selectedRows = rows.filter((r) => selectedIds.includes(r.orderId));
  const previewOrder = selectedRows[0] || rows.find((r) => r.suggestion === "wait") || rows[0];

  const send = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await api.post("/deferrals", {
        orderIds: selectedIds,
        toDate,
        reason,
        decidedBy: "Kavindi Perera",
      });
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
        code="WEDNESDAY 30 SEPTEMBER · COLOMBO CHILLED"
        title={`${selectedIds.length} chilled order${selectedIds.length === 1 ? "" : "s"} have to wait a day`}
        sub="16 reefer slots for 19 chilled orders while VEH031 is in the workshop. Waypoint suggests who waits by fairness, not by who ordered last. You make the call."
      >
        <Link to="/dispatcher/plan" className="btn secondary">
          Back to the plan
        </Link>
      </PageHead>

      <div className="dp-grid">
        {/* Left Column: Decision table & Reason Form */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Fairness Suggestions and Decisions */}
          <Card
            title="How the suggestion works"
            action={<span className="small muted">Same rule every day, written down</span>}
          >
            <ol className="small" style={{ margin: "0 0 16px 0", paddingLeft: 20, lineHeight: 1.6 }}>
              {suggest.data?.rule.map((r, idx) => (
                <li key={idx}>
                  <b>{idx + 1}.</b> {r}
                </li>
              ))}
            </ol>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Outlet</th>
                    <th>Last Chilled</th>
                    <th>Deferred (14d)</th>
                    <th>Kg</th>
                    <th>Suggestion</th>
                    <th>Your Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isWaiting = selectedIds.includes(r.orderId);
                    return (
                      <tr
                        key={r.orderId}
                        style={{
                          background: isWaiting ? "var(--yellow-soft)" : undefined,
                        }}
                      >
                        <td>
                          <b>{r.outletName}</b>
                          <div className="small muted mono">{r.orderId}</div>
                        </td>
                        <td className="small">
                          {day(r.lastChilled)}
                          <div className="muted">{r.gapHours} h gap</div>
                        </td>
                        <td className="mono">{r.deferrals14d}</td>
                        <td className="mono">{kg(r.kg)}</td>
                        <td>
                          {r.protected ? (
                            <Badge tone="ink">🔒 Protected</Badge>
                          ) : (
                            <Badge tone={r.suggestion === "wait" ? "now" : "ok"}>
                              {r.suggestion === "wait" ? "Wait, served today" : "Serve, longest gap"}
                            </Badge>
                          )}
                        </td>
                        <td>
                          {r.protected ? (
                            <span className="small muted">🔒 Serve</span>
                          ) : (
                            <div className="row" style={{ gap: 4 }}>
                              <button
                                type="button"
                                className={`btn small ${!isWaiting ? "now" : "secondary"}`}
                                style={{ minHeight: 28, padding: "0 10px", fontSize: 12 }}
                                onClick={() => setDecision(r.orderId, false)}
                              >
                                Serve
                              </button>
                              <button
                                type="button"
                                className={`btn small ${isWaiting ? "now" : "secondary"}`}
                                style={{
                                  minHeight: 28,
                                  padding: "0 10px",
                                  fontSize: 12,
                                  background: isWaiting ? "var(--yellow)" : undefined,
                                }}
                                onClick={() => setDecision(r.orderId, true)}
                              >
                                Wait
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Form to compose message */}
          <Card title="Compose notice to store managers">
            <div className="stack" style={{ gap: 12 }}>
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
                <span className="label">Reason (store managers read this)</span>
                <textarea
                  className="textarea"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this order moves to tomorrow in calm, clear words..."
                />
                <span className="small muted">
                  Plain language, no internal codes. Stored permanently in the deferral log.
                </span>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: If you confirm & LIVE STORE NOTICE PREVIEW (Styled like SM5) */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Confirmation Implications */}
          <Card title="If you confirm">
            <div className="dp4-confirm-points">
              <div className="dp4-confirm-point">
                <span>🔔</span>
                <span>
                  <b>{selectedIds.length} store managers</b> are told at once with the reason below, before
                  tomorrow's shift is rostered.
                </span>
              </div>
              <div className="dp4-confirm-point">
                <span>🔒</span>
                <span>
                  Their Thursday orders are <b>protected</b>, so none of them can wait twice in a row.
                </span>
              </div>
              <div className="dp4-confirm-point">
                <span>❄</span>
                <span>
                  <b>Reefers on Wednesday: 16 of 16 slots used</b>. Nothing is overloaded.
                </span>
              </div>
            </div>
          </Card>

          {/* Live Store Notice Preview (SM5 Style) */}
          <Card title="Live store notice preview" action={<Badge tone="now">SM5 Preview</Badge>}>
            <div className="dp4-preview-box">
              <div className="row between">
                <span className="label">DELIVERY NOTICE · {previewOrder?.orderId || "ORD41901"}</span>
                <Badge tone="now">Deferral</Badge>
              </div>

              <div>
                <span className="label" style={{ display: "block", marginBottom: 6 }}>
                  Store: {previewOrder?.outletName || "Store Manager"}
                </span>
                <p className="dp4-preview-quote">“{reason}”</p>
                <div className="small muted" style={{ marginTop: 6 }}>
                  — Kavindi Perera, dispatch lead, Peliyagoda
                </div>
              </div>

              <div className="dp4-preview-tiles">
                <div className="dp4-preview-tile">
                  <span className="label">Your Order</span>
                  <span className="val">Carried forward, not cancelled</span>
                </div>
                <div className="dp4-preview-tile">
                  <span className="label">New Delivery</span>
                  <span className="val">{day(toDate)}, 05:30–08:00</span>
                </div>
                <div className="dp4-preview-tile">
                  <span className="label">After This</span>
                  <span className="val" style={{ color: "var(--green-text)" }}>
                    Protected on next tight day
                  </span>
                </div>
              </div>

              <div className="small muted" style={{ borderTop: "1px dashed var(--line-2)", paddingTop: 8 }}>
                🔒 This is your wait in 14 days. Your next order goes to the front of the queue on any tight
                day.
              </div>
            </div>

            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              <button
                className="btn now big block"
                disabled={busy || !selectedIds.length || reason.trim().length < 15}
                onClick={send}
              >
                {busy
                  ? "Recording deferrals…"
                  : `Confirm ${selectedIds.length} deferral${selectedIds.length === 1 ? "" : "s"}`}
              </button>
              <Link to="/dispatcher/plan" className="btn secondary block" style={{ textAlign: "center" }}>
                Back to the plan
              </Link>
            </div>
          </Card>
        </div>
      </div>
      {toast}
    </>
  );
}
