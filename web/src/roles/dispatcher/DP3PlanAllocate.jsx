// DP3 Plan and allocate. Design: docs/design/DP3-PlanAllocate.jpg
// Capacity bar, orders without a reefer slot, the reefer fleet filled in fairness order, and the fairness table.
// All of it is derived from /plan and /plan/suggest and follows the dispatcher's ticks.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useDates } from "../../shared/live.js";
import { api } from "../../shared/api.js";
import { Card, PageHead, Badge, Loading, ErrorNote } from "../../shared/ui.jsx";
import { kg, day, longDay } from "../../shared/format.js";
import "./dispatcher.css";

export default function DP3PlanAllocate() {
  const { planDate } = useDates();
  const plan = useApi(planDate ? `/plan?date=${planDate}` : null, [
    "deferral.decided",
    "deferral.reversed",
    "order.placed",
    "plan.released",
  ]);
  const sug = useApi(planDate ? `/plan/suggest?date=${planDate}` : null, [
    "deferral.decided",
    "deferral.reversed",
    "order.placed",
  ]);
  const [waiting, setWaiting] = useState([]);
  const [sending, setSending] = useState(false);
  const nav = useNavigate();

  // Initialize with server's suggested deferrals
  useEffect(() => {
    if (sug.data) {
      setWaiting(sug.data.rows.filter((r) => r.suggestion === "wait").map((r) => r.orderId));
    }
  }, [sug.data]);

  if (plan.loading || sug.loading) return <Loading />;
  if (plan.error || sug.error) return <ErrorNote error={plan.error || sug.error} />;

  const c = plan.data.chilled;
  const toggle = (id) => setWaiting((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  // Everything below is derived from the API: reefers, their slots, and the current "waits" selection.
  const reefers = plan.data.reefers;
  const workshop = reefers.filter((v) => v.status === "workshop");
  const lostSlots = c.totalSlots - c.slots;
  const rows = sug.data.rows;
  const waitingRows = rows.filter((r) => waiting.includes(r.orderId));
  const going = rows.filter((r) => !waiting.includes(r.orderId)); // already in fairness order
  const served = going.slice(0, c.slots);
  const overflow = going.slice(c.slots);
  let next = 0;
  const fleet = reefers.map((v) => {
    if (v.status === "workshop") return { v, orders: [] };
    const orders = served.slice(next, next + v.slots);
    next += v.slots;
    return { v, orders };
  });

  return (
    <>
      <PageHead
        code={`PLANNING ${longDay(planDate).toUpperCase()}`}
        title="Plan and allocate"
        sub="Protected orders are placed first. What's left is packed by the fairness rule. You make the final call."
      />

      {/* Chilled capacity: working reefer slots, slots lost to the workshop, orders over capacity */}
      <div className="dp3-capacity-banner">
        <div className="dp3-capacity-top">
          <div className="dp3-capacity-title" style={{ color: "var(--blue)" }}>
            <span>❄ Colombo chilled</span>
          </div>

          <div style={{ flex: 1, minWidth: 260, margin: "0 16px" }}>
            <div className="dp3-cap-bar">
              {Array.from({ length: c.slots }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className={`dp3-cap-segment${i < served.length ? " active" : ""}`}
                  title={i < served.length ? `Slot ${i + 1}: ${served[i].outletName}` : `Slot ${i + 1}: free`}
                />
              ))}
              {Array.from({ length: lostSlots }).map((_, i) => (
                <div
                  key={`lost-${i}`}
                  className="dp3-cap-segment lost"
                  title="Slot lost: vehicle in the workshop"
                />
              ))}
              {Array.from({ length: c.over }).map((_, i) => (
                <div key={`over-${i}`} className="dp3-cap-segment over" title={`Over capacity ${i + 1}`} />
              ))}
            </div>
            <div className="row between small" style={{ marginTop: 4 }}>
              <span className="muted">
                {c.slots} reefer slots
                {lostSlots > 0 &&
                  ` (${lostSlots} lost: ${workshop.map((v) => v.id).join(", ")} in the workshop)`}
              </span>
              <span style={{ color: c.over ? "var(--red-text)" : "var(--green-text)", fontWeight: 600 }}>
                {c.orders} chilled orders · {c.over ? `${c.over} over` : "all fit"}
              </span>
            </div>
          </div>

          {c.over > 0 ? (
            <button
              type="button"
              className="btn now"
              disabled={!waiting.length}
              onClick={() => nav("/dispatcher/decide", { state: { orderIds: waiting } })}
            >
              Decide which {waiting.length} wait →
            </button>
          ) : !plan.data.unsent && plan.data.runs.length ? (
            <span className="badge ok">
              On the dock: {plan.data.runs.length} truck{plan.data.runs.length === 1 ? "" : "s"} loading
            </span>
          ) : (
            <button
              type="button"
              className="btn now"
              disabled={sending || !plan.data.unsent}
              onClick={async () => {
                setSending(true);
                try {
                  await api.post("/plan/release", { date: planDate });
                  plan.reload();
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending
                ? "Sending…"
                : `Send ${plan.data.unsent} order${plan.data.unsent === 1 ? "" : "s"} to the dock →`}
            </button>
          )}
        </div>
      </div>

      <div className="dp3-two-col">
        {/* Left: chilled orders without a reefer slot (the current "waits" selection) */}
        <div className="dp3-unassigned-card">
          <div className="dp3-unassigned-head">
            <div className="dp3-unassigned-title">
              <span>Not on a vehicle yet</span>
              <span className="badge ink">{waitingRows.length}</span>
            </div>
            <span className="small muted">tick or untick in the table below</span>
          </div>

          <div className="dp3-unassigned-list">
            {waitingRows.length === 0 && (
              <div className="small muted" style={{ padding: "10px 4px" }}>
                Every chilled order has a reefer slot.
              </div>
            )}
            {waitingRows.map((r) => (
              <div key={r.orderId} className="dp3-unassigned-item">
                <span className="dp3-drag-handle">⠿</span>
                <div className="dp3-item-info">
                  <span className="dp3-item-outlet">
                    {r.outletId} {r.outletName}
                  </span>
                  <span className="dp3-item-sub">
                    {r.orderId} · <b style={{ color: "var(--blue)" }}>❄ {kg(r.kg)}</b>
                  </span>
                </div>
                <span className="badge bad">■ No reefer slot</span>
              </div>
            ))}
          </div>
          {overflow.length > 0 && (
            <div
              className="small"
              style={{ borderTop: "1px solid var(--line)", paddingTop: 10, color: "var(--red-text)" }}
            >
              {overflow.length} more order(s) are marked to go but there is no slot left. Tick them as
              waiting.
            </div>
          )}
        </div>

        {/* Right: the reefer fleet, filled in fairness order */}
        <div className="dp3-fleet-section">
          <div className="dp3-fleet-head">
            <div className="row">
              <h3 className="h-sec" style={{ margin: 0 }}>
                Peliyagoda reefers
              </h3>
              <span className="small muted">
                {reefers.length} vehicles · {c.slots} working slots
              </span>
            </div>
            <div className="row small" style={{ gap: 16 }}>
              <div className="row" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "var(--blue)", borderRadius: 2 }} />
                <span className="muted">Chilled stop</span>
              </div>
            </div>
          </div>

          {fleet.map(({ v, orders: load }) => {
            const used = load.reduce((sum, o) => sum + o.kg, 0);
            const pct = v.capacityKg ? Math.round((used / v.capacityKg) * 100) : 0;
            const inWorkshop = v.status === "workshop";
            return (
              <div key={v.id} className="dp3-vehicle-row">
                <div className="dp3-vehicle-meta">
                  <div className="dp3-vehicle-left">
                    <span className="mono" style={{ fontWeight: 700 }}>
                      {v.id}
                    </span>
                    <Badge tone="cold">❄ Reefer</Badge>
                    {inWorkshop ? (
                      <span style={{ color: "var(--red-text)", fontWeight: 600 }}>In the workshop</span>
                    ) : (
                      <span className="muted">{v.driver}</span>
                    )}
                  </div>
                  <div className="dp3-vehicle-right">
                    {inWorkshop ? (
                      <span className="muted">{v.slots} slots unavailable</span>
                    ) : (
                      <>
                        <span className="muted">
                          {load.length} / {v.slots} slots
                        </span>
                        <span>
                          <b>{used.toLocaleString("en-GB")}</b> / {v.capacityKg.toLocaleString("en-GB")} kg
                        </span>
                        <span style={{ fontWeight: 700 }}>{pct}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="dp3-truck-track">
                  {inWorkshop ? (
                    <div className="dp3-stop-block workshop" />
                  ) : (
                    <>
                      {load.map((o) => (
                        <div
                          key={o.orderId}
                          className="dp3-stop-block chilled"
                          style={{ width: `${Math.max(12, Math.round((o.kg / v.capacityKg) * 100))}%` }}
                          title={`${o.outletName} · ${o.orderId} · ${o.kg} kg`}
                        >
                          {o.outletId} · {o.kg}
                        </div>
                      ))}
                      <div className="dp3-empty-track" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fairness Rule and Decision Table */}
      <Card title="Fairness rule and priority allocation">
        <ol className="small" style={{ margin: "0 0 16px 0", paddingLeft: 20, lineHeight: 1.6 }}>
          {sug.data.rule.map((r) => (
            <li key={r}>
              <b>{r.split(".")[0]}.</b> {r.slice(r.indexOf(".") + 1)}
            </li>
          ))}
        </ol>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Outlet</th>
                <th>Priority Reason</th>
                <th>Order</th>
                <th>Weight</th>
                <th>Last Chilled</th>
                <th>Gap</th>
                <th>14d Deferrals</th>
                <th>Suggestion</th>
                <th>Waits?</th>
              </tr>
            </thead>
            <tbody>
              {sug.data.rows.map((r) => {
                const isSelected = waiting.includes(r.orderId);
                return (
                  <tr
                    key={r.orderId}
                    style={{
                      background: isSelected ? "var(--yellow-soft)" : undefined,
                    }}
                  >
                    <td className="mono">{r.rank}</td>
                    <td>
                      <b>{r.outletName}</b>
                      <div className="small muted mono">{r.outletId}</div>
                    </td>
                    <td>
                      <span
                        className="dp3-reason-pill"
                        style={{
                          background: r.protected
                            ? "var(--ink)"
                            : r.suggestion === "wait"
                              ? "var(--yellow-soft)"
                              : "var(--green-soft)",
                          color: r.protected
                            ? "#fff"
                            : r.suggestion === "wait"
                              ? "var(--yellow-deep)"
                              : "var(--green-text)",
                          borderColor: r.protected
                            ? "var(--ink)"
                            : r.suggestion === "wait"
                              ? "#efd97a"
                              : "#bcd8c2",
                          fontWeight: 600,
                        }}
                      >
                        {r.protected ? "🔒 " : ""}
                        {r.reason}
                      </span>
                    </td>
                    <td className="mono">{r.orderId}</td>
                    <td className="mono">{kg(r.kg)}</td>
                    <td className="mono">{day(r.lastChilled)}</td>
                    <td className="mono">{r.gapHours} h</td>
                    <td className="mono">{r.deferrals14d}</td>
                    <td>
                      {r.protected ? (
                        <Badge tone="ink">Protected</Badge>
                      ) : (
                        <Badge tone={r.suggestion === "wait" ? "now" : "ok"}>{r.suggestion}</Badge>
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${r.outletName} waits`}
                        checked={isSelected}
                        disabled={r.protected}
                        onChange={() => toggle(r.orderId)}
                        style={{ width: 20, height: 20, cursor: r.protected ? "not-allowed" : "pointer" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
