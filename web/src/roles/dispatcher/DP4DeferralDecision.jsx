// DP4 Deferral decision: write the reason the store will read. Design: docs/design/DP4-DeferralDecision.jpg
// Matches design: Interactive decision table, live preview of the store notice (styled like SM5), and confirmation panel.
// Everything shown comes from the API: the plan date and capacity (/plan), the ranking (/plan/suggest) and the exact
// notice the store will get (/deferrals/preview, built by the same server code that sends it).
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, useToast } from "../../shared/ui.jsx";
import { kg, day } from "../../shared/format.js";
import "./dispatcher.css";

export default function DP4DeferralDecision() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [toast, show] = useToast();

  const suggest = useApi("/plan/suggest"); // the server's plan date when none is given
  const date = suggest.data?.date;
  const plan = useApi(date ? `/plan?date=${date}` : null);

  const [selectedIds, setSelectedIds] = useState(state?.orderIds || []);
  const [reason, setReason] = useState(state?.reason ?? null); // null = use the suggested wording
  const [chosenDate, setToDate] = useState(state?.toDate || null);
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

  const rows = suggest.data?.rows || [];
  // Default new date: the day the fairness rule says waiting orders go (the next day).
  const toDate = chosenDate || rows.find((r) => r.waitsUntil)?.waitsUntil || "";

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
  const preview = useApi(
    previewOrder && toDate ? `/deferrals/preview?orderId=${previewOrder.orderId}&toDate=${toDate}` : null
  );
  const text = reason ?? preview.data?.suggestedReason ?? "";
  const chilled = plan.data?.chilled;
  const used = chilled ? chilled.orders - selectedIds.length : 0;
  const workshop = (plan.data?.reefers || []).filter((v) => v.status === "workshop").map((v) => v.id);

  const send = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      // The server records the signed-in dispatcher as the one who decided.
      await api.post("/deferrals", { orderIds: selectedIds, toDate, reason: text });
      show("Sent. The stores were told the reason.");
      setTimeout(() => nav("/dispatcher/deferrals"), 900);
    } catch (e) {
      show(e.message);
      setBusy(false);
    }
  };

  if (suggest.loading || plan.loading) return <Loading />;

  return (
    <>
      <PageHead
        code={`${day(date).toUpperCase()} · CHILLED`}
        title={`${selectedIds.length} chilled order${selectedIds.length === 1 ? "" : "s"} have to wait a day`}
        sub={`${chilled?.slots} reefer slots for ${chilled?.orders} chilled orders${
          workshop.length
            ? ` while ${workshop.join(", ")} ${workshop.length === 1 ? "is" : "are"} in the workshop`
            : ""
        }. Waypoint suggests who waits by fairness, not by who ordered last. You make the call.`}
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
                              {r.suggestion === "wait" ? "Wait" : "Serve"}
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
                  min={date}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="label">Reason (store managers read this)</span>
                <textarea
                  className="textarea"
                  rows={4}
                  value={text}
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
                  Their orders are <b>protected</b> on the next two runs, so none of them can wait twice in a
                  row.
                </span>
              </div>
              <div className="dp4-confirm-point">
                <span>❄</span>
                <span>
                  <b>
                    Reefers on {day(date)}: {used} of {chilled?.slots} slots used
                  </b>
                  {used > chilled?.slots
                    ? `. Still ${used - chilled.slots} over: choose more orders to wait.`
                    : ". Nothing is overloaded."}
                </span>
              </div>
            </div>
          </Card>

          {/* Live Store Notice Preview (SM5 Style) */}
          <Card title="Live store notice preview" action={<Badge tone="now">SM5 Preview</Badge>}>
            {preview.data ? (
              <div className="dp4-preview-box">
                <div className="row between">
                  <span className="label">DELIVERY NOTICE · {preview.data.orderId}</span>
                  <Badge tone="now">Deferral</Badge>
                </div>

                <div>
                  <span className="label" style={{ display: "block", marginBottom: 6 }}>
                    Store: {preview.data.outletName}
                  </span>
                  <p className="dp4-preview-quote">“{text}”</p>
                  <div className="small muted" style={{ marginTop: 6 }}>
                    — {preview.data.signedBy}
                  </div>
                </div>

                <div className="dp4-preview-tiles">
                  {preview.data.tiles.map((t) => (
                    <div key={t.label} className="dp4-preview-tile">
                      <span className="label">{t.label}</span>
                      <span
                        className="val"
                        style={t.tone === "ok" ? { color: "var(--green-text)" } : undefined}
                      >
                        {t.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="small muted" style={{ borderTop: "1px dashed var(--line-2)", paddingTop: 8 }}>
                  {preview.data.footnote}
                </div>
              </div>
            ) : (
              <div className="small muted">
                Choose an order and a new date to see what the store will read.
              </div>
            )}

            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              <button
                className="btn now big block"
                disabled={busy || !selectedIds.length || !toDate || text.trim().length < 15}
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
