// DP3 Plan and allocate. Design: docs/design/DP3-PlanAllocate.jpg
// Matches design: Capacity bar, 2-column workspace (Unassigned orders vs Peliyagoda Fleet), workshop vehicle visualization, and fairness table with visible reasons.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, ErrorNote } from "../../shared/ui.jsx";
import { kg, day } from "../../shared/format.js";
import "./dispatcher.css";

export default function DP3PlanAllocate() {
  const plan = useApi("/plan?date=2026-09-30", ["deferral.decided", "deferral.reversed", "order.placed"]);
  const sug = useApi("/plan/suggest?date=2026-09-30", [
    "deferral.decided",
    "deferral.reversed",
    "order.placed",
  ]);
  const [waiting, setWaiting] = useState([]);
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

  return (
    <>
      <PageHead
        code="PLANNING WEDNESDAY 30 SEPTEMBER"
        title="Plan and allocate"
        sub="Protected orders are placed first. What's left is packed by route and window."
      >
        <button type="button" className="btn secondary" onClick={() => {}}>
          Undo last move
        </button>
        <button type="button" className="btn secondary" onClick={() => {}}>
          Auto-fill ambient
        </button>
      </PageHead>

      {/* Top Colombo Chilled Capacity Bar Banner matching design */}
      <div className="dp3-capacity-banner">
        <div className="dp3-capacity-top">
          <div className="dp3-capacity-title" style={{ color: "var(--blue)" }}>
            <span>❄ Colombo chilled</span>
          </div>

          {/* Segmented capacity track */}
          <div style={{ flex: 1, minWidth: 260, margin: "0 16px" }}>
            <div className="dp3-cap-bar">
              {/* 16 active slots */}
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={`blue-${i}`} className="dp3-cap-segment active" title={`Slot ${i + 1}: Active`} />
              ))}
              {/* 3 over capacity */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`red-${i}`}
                  className="dp3-cap-segment over"
                  title={`Over capacity slot ${i + 1}`}
                />
              ))}
            </div>
            <div className="row between small" style={{ marginTop: 4 }}>
              <span className="muted">16 reefer slots (VEH031 in the workshop)</span>
              <span style={{ color: "var(--red-text)", fontWeight: 600 }}>19 chilled orders · 3 over</span>
            </div>
          </div>

          <button
            type="button"
            className="btn now"
            disabled={!waiting.length}
            onClick={() => nav("/dispatcher/decide", { state: { orderIds: waiting } })}
          >
            Decide which {waiting.length} wait →
          </button>
        </div>
      </div>

      {/* Two-Column Planning Workspace matching design image */}
      <div className="dp3-two-col">
        {/* Left Column: Not on a vehicle yet */}
        <div className="dp3-unassigned-card">
          <div className="dp3-unassigned-head">
            <div className="dp3-unassigned-title">
              <span>Not on a vehicle yet</span>
              <span className="badge ink">18</span>
            </div>
            <span className="small muted">drag onto a vehicle</span>
          </div>

          <div className="dp3-unassigned-list">
            {/* Chilled orders needing reefer slot */}
            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT067 Wattala</span>
                <span className="dp3-item-sub">
                  Fresh · <b style={{ color: "var(--blue)" }}>❄ 198 kg</b>
                </span>
              </div>
              <span className="badge bad">■ No reefer slot</span>
            </div>

            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT022 Borella</span>
                <span className="dp3-item-sub">
                  Fresh · <b style={{ color: "var(--blue)" }}>❄ 224 kg</b>
                </span>
              </div>
              <span className="badge bad">■ No reefer slot</span>
            </div>

            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT036 Kirulapone</span>
                <span className="dp3-item-sub">
                  Fresh · <b style={{ color: "var(--blue)" }}>❄ 186 kg</b>
                </span>
              </div>
              <span className="badge bad">■ No reefer slot</span>
            </div>

            {/* Ambient orders */}
            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT133 Gampaha</span>
                <span className="dp3-item-sub">Style · 260 kg</span>
              </div>
              <button type="button" className="btn secondary small" style={{ minHeight: 26, fontSize: 11.5 }}>
                Fits VEH037
              </button>
            </div>

            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT140 Ja-Ela</span>
                <span className="dp3-item-sub">Tech · 90 kg</span>
              </div>
              <button type="button" className="btn secondary small" style={{ minHeight: 26, fontSize: 11.5 }}>
                Fits VEH009
              </button>
            </div>

            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT126 Kiribathgoda</span>
                <span className="dp3-item-sub">Fresh · 330 kg</span>
              </div>
              <button type="button" className="btn secondary small" style={{ minHeight: 26, fontSize: 11.5 }}>
                Fits VEH041
              </button>
            </div>

            <div className="dp3-unassigned-item">
              <span className="dp3-drag-handle">⠿</span>
              <div className="dp3-item-info">
                <span className="dp3-item-outlet">OUT118 Moratuwa</span>
                <span className="dp3-item-sub">Fresh · -</span>
              </div>
              <span className="badge now">Not ordered</span>
            </div>
          </div>

          <div className="small muted" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            + 11 more ambient orders, all fit current routes
          </div>
        </div>

        {/* Right Column: Peliyagoda Fleet */}
        <div className="dp3-fleet-section">
          <div className="dp3-fleet-head">
            <div className="row">
              <h3 className="h-sec" style={{ margin: 0 }}>
                Peliyagoda fleet
              </h3>
              <span className="small muted">42 vehicles · 6 shown</span>
            </div>

            <div className="row small" style={{ gap: 16 }}>
              <div className="row" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "var(--blue)", borderRadius: 2 }} />
                <span>Chilled stop</span>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "var(--ink)", borderRadius: 2 }} />
                <span>Ambient stop</span>
              </div>
              <span className="muted">kg loaded / capacity</span>
            </div>
          </div>

          <div className="dp3-fleet-list">
            {/* 1. VEH014 Reefer */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH014
                  </span>
                  <Badge tone="cold">❄ Reefer</Badge>
                  <span>Colombo South</span>
                  <span className="muted">S. Kumara</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">05:10–08:40</span>
                  <span>
                    <b>966</b> / 1,100
                  </span>
                  <span style={{ fontWeight: 700 }}>88%</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block chilled" style={{ width: "44%" }}>
                  OUT014 · 486
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "25%" }}>
                  OUT058 · 270
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "19%" }}>
                  OUT024 · 210
                </div>
                <div className="dp3-empty-track" />
              </div>
            </div>

            {/* 2. VEH019 Reefer */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH019
                  </span>
                  <Badge tone="cold">❄ Reefer</Badge>
                  <span>Colombo Central</span>
                  <span className="muted">R. Silva</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">05:20–09:10</span>
                  <span>
                    <b>970</b> / 1,100
                  </span>
                  <span style={{ fontWeight: 700 }}>88%</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block chilled" style={{ width: "20%" }}>
                  OUT011 · 220
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "18%" }}>
                  OUT029 · 190
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "24%" }}>
                  OUT040 · 260
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "26%" }}>
                  OUT017 · 300
                </div>
                <div className="dp3-empty-track" />
              </div>
            </div>

            {/* 3. VEH026 Reefer */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH026
                  </span>
                  <Badge tone="cold">❄ Reefer</Badge>
                  <span>Gampaha</span>
                  <span className="muted">K. Dias</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">05:30–09:30</span>
                  <span>
                    <b>1,022</b> / 1,100
                  </span>
                  <span style={{ fontWeight: 700 }}>93%</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block chilled" style={{ width: "28%" }}>
                  OUT045 · 312
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "22%" }}>
                  OUT031 · 240
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "16%" }}>
                  OUT052 · 180
                </div>
                <div className="dp3-stop-block chilled" style={{ width: "27%" }}>
                  OUT049 · 290
                </div>
                <div className="dp3-empty-track" />
              </div>
            </div>

            {/* 4. VEH031 Reefer - WORKSHOP TRUCK */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH031
                  </span>
                  <Badge tone="cold">❄ Reefer</Badge>
                  <span style={{ color: "var(--red-text)", fontWeight: 600 }}>Workshop until Thu</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">brake service, back Thu 1 Oct</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block workshop" />
              </div>
            </div>

            {/* 5. VEH022 Dry */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH022
                  </span>
                  <Badge>Dry</Badge>
                  <span>Kandy run</span>
                  <span className="muted">C. Wickramasinghe</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">06:30–13:30</span>
                  <span>
                    <b>980</b> / 1,400
                  </span>
                  <span style={{ fontWeight: 700 }}>70%</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block ambient" style={{ width: "10%" }}>
                  061
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "12%" }}>
                  077
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "29%" }}>
                  OUT083 · 410
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "10%" }}>
                  075
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "9%" }}>
                  072
                </div>
                <div className="dp3-empty-track" />
              </div>
            </div>

            {/* 6. VEH037 Dry */}
            <div className="dp3-vehicle-row">
              <div className="dp3-vehicle-meta">
                <div className="dp3-vehicle-left">
                  <span className="mono" style={{ fontWeight: 700 }}>
                    VEH037
                  </span>
                  <Badge>Dry</Badge>
                  <span>Kurunegala</span>
                  <span className="muted">D. Pathirana</span>
                </div>
                <div className="dp3-vehicle-right">
                  <span className="muted">07:00–14:30</span>
                  <span>
                    <b>880</b> / 1,400
                  </span>
                  <span style={{ fontWeight: 700 }}>63%</span>
                </div>
              </div>
              <div className="dp3-truck-track">
                <div className="dp3-stop-block ambient" style={{ width: "24%" }}>
                  OUT090 · 340
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "20%" }}>
                  OUT095 · 280
                </div>
                <div className="dp3-stop-block ambient" style={{ width: "19%", opacity: 0.8 }}>
                  + OUT133 · 260
                </div>
                <div className="dp3-empty-track" />
              </div>
            </div>
          </div>
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
