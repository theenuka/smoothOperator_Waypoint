// DP3 Plan and allocate. Owner: DISPATCHER FRONTEND.  Design: /design/DP3-PlanAllocate.jpg
// WORKING BASELINE: capacity + fairness suggestion from the server. Pick who waits, then go to DP4.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, ErrorNote } from "../../shared/ui.jsx";
import { kg, day } from "../../shared/format.js";

export default function DP3PlanAllocate() {
  const plan = useApi("/plan?date=2026-09-30", ["deferral.decided", "deferral.reversed", "order.placed"]);
  const sug = useApi("/plan/suggest?date=2026-09-30", [
    "deferral.decided",
    "deferral.reversed",
    "order.placed",
  ]);
  const [waiting, setWaiting] = useState([]);
  const nav = useNavigate();

  // start with the server's suggestion selected
  useEffect(() => {
    if (sug.data) setWaiting(sug.data.rows.filter((r) => r.suggestion === "wait").map((r) => r.orderId));
  }, [sug.data]);

  if (plan.loading || sug.loading) return <Loading />;
  if (plan.error || sug.error) return <ErrorNote error={plan.error || sug.error} />;
  const c = plan.data.chilled;
  const toggle = (id) => setWaiting((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  return (
    <>
      <PageHead
        code="DP3 · Planning Wednesday 30 September"
        title="Plan and allocate"
        sub="Chilled trucks are the bottleneck. Waypoint suggests who waits using a fair rule. You make the final call."
      >
        <button
          className="btn now"
          disabled={!waiting.length}
          onClick={() => nav("/dispatcher/decide", { state: { orderIds: waiting } })}
        >
          Review {waiting.length} deferral{waiting.length === 1 ? "" : "s"}
        </button>
      </PageHead>

      <div className={`notice ${c.over ? "bad" : "ok"}`}>
        <b>
          {c.orders} chilled orders, {c.slots} reefer slots.
        </b>{" "}
        {c.over ? `${c.over} must wait until Thursday. ` : "Everyone fits. "}
        {c.totalSlots > c.slots && `${c.totalSlots - c.slots} slots lost: VEH031 is in the workshop.`}
      </div>

      <Card title="The fairness rule">
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          {sug.data.rule.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </Card>

      <Card className="pad-0">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Outlet</th>
                <th>Order</th>
                <th>Last chilled</th>
                <th>Waited (14 days)</th>
                <th>Suggestion</th>
                <th>Waits?</th>
              </tr>
            </thead>
            <tbody>
              {sug.data.rows.map((r) => (
                <tr key={r.orderId}>
                  <td className="mono">{r.rank}</td>
                  <td>
                    <b>{r.outletName}</b>
                    <div className="small muted">{r.reason}</div>
                  </td>
                  <td className="mono">
                    {r.orderId}
                    <div className="small muted">{kg(r.kg)}</div>
                  </td>
                  <td className="mono">
                    {day(r.lastChilled)} <span className="muted">({r.gapHours} h)</span>
                  </td>
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
                      checked={waiting.includes(r.orderId)}
                      disabled={r.protected}
                      onChange={() => toggle(r.orderId)}
                      style={{ width: 20, height: 20 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
