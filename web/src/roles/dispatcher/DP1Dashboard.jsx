// DP1 Today's run (dashboard). Owner: DISPATCHER FRONTEND.  Design: /design/DP1-Dashboard.jpg
// Matches design: run cards with segmented stop progress, alerts column (offline, chilled over-capacity, shortfalls, conflicts), and live feed.
import { Link, useNavigate } from "react-router-dom";
import { useApi, useEventFeed } from "../../shared/live.js";
import { Card, PageHead, Stat, StatusBadge, Badge, Loading } from "../../shared/ui.jsx";
import { describe, tone, time } from "../../shared/format.js";
import "./dispatcher.css";

const LIVE = [
  "delivery.recorded",
  "load.shortfall",
  "sync.conflict",
  "sync.resolved",
  "deferral.decided",
  "deferral.reversed",
  "load.completed",
  "vehicle.offline",
  "vehicle.online",
  "vehicle.position",
  "demo.reset",
];

export default function DP1Dashboard() {
  const runs = useApi("/runs?date=2026-09-29", LIVE);
  const plan = useApi("/plan?date=2026-09-30", ["deferral.decided", "deferral.reversed", "order.placed"]);
  const conflicts = useApi("/sync/conflicts?status=open", ["sync.conflict", "sync.resolved"]);
  const tracking = useApi("/tracking", ["vehicle.position", "vehicle.offline", "vehicle.online"]);
  const { events, fresh } = useEventFeed(25);
  const nav = useNavigate();

  const moveStop = (s) =>
    nav("/dispatcher/decide", {
      state: {
        orderIds: [s.orderId],
        toDate: "2026-09-30",
        reason: `${s.outletName}'s dock closes before the truck can get there today, so this delivery moves to tomorrow morning.`,
      },
    });

  const shortfalls = (runs.data || []).flatMap((r) =>
    r.stops.flatMap((s) =>
      (s.shortfalls || []).map((sf) => ({ ...sf, outletName: s.outletName, runId: r.id }))
    )
  );

  const offlineVehicles = (tracking.data || []).filter((v) => v.online === false);
  const openConflicts = conflicts.data || [];
  const over = plan.data?.chilled.over ?? 0;

  const totalAlerts = offlineVehicles.length + (over > 0 ? 1 : 0) + shortfalls.length + openConflicts.length;

  return (
    <>
      <PageHead
        code="DP1 · Tuesday 29 September · LIVE"
        title="Today's run"
        sub="Everything that changed today, as it happens."
      >
        <Link className="btn now" to="/dispatcher/plan">
          Plan Wednesday
        </Link>
      </PageHead>

      <div className="grid-4">
        <Stat
          label="Runs on the road"
          value={(runs.data || []).filter((r) => r.status === "on_road").length}
          hint={`${runs.data?.length || 0} active runs today`}
        />
        <Stat
          label="Chilled over capacity (Wed)"
          value={over}
          tone={over ? "bad" : "ok"}
          hint={
            plan.data ? `${plan.data.chilled.orders} orders · ${plan.data.chilled.slots} reefer slots` : ""
          }
        />
        <Stat
          label="Dock shortfalls"
          value={shortfalls.length}
          tone={shortfalls.length ? "bad" : "ok"}
          hint={shortfalls.length ? "Missing items re-routed" : "All lines loaded"}
        />
        <Stat
          label="Need a decision"
          value={openConflicts.length + offlineVehicles.length}
          tone={openConflicts.length + offlineVehicles.length ? "bad" : "ok"}
          hint={
            openConflicts.length
              ? "Phone and office disagree"
              : offlineVehicles.length
                ? "Trucks offline"
                : "None pending"
          }
        />
      </div>

      <div className="dp-grid">
        {/* Left Column: Run Cards with Stop Progress */}
        <Card
          title="Vehicles through the day"
          action={<span className="small muted">{(runs.data || []).length} vehicles scheduled</span>}
        >
          {runs.loading ? (
            <Loading />
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {(runs.data || []).map((r) => {
                const isOffline = offlineVehicles.some((v) => v.vehicleId === r.vehicleId);
                const deliveredCount = r.stops.filter((s) => s.status === "delivered").length;
                const pendingStops = r.stops.filter(
                  (s) => (s.status === "pending" || s.status === "next") && s.order?.status !== "deferred"
                );
                const remainingNames = pendingStops.map((s) => s.outletName).join(", ");
                const routeName = r.vehicle?.type === "reefer" ? "Colombo S. Reefer" : "Kandy Route (A1)";

                return (
                  <div key={r.id} className={`dp-run-card ${isOffline ? "is-offline" : ""}`}>
                    <div className="dp-run-header">
                      <div className="dp-vehicle-tag">
                        <span className="dp-vehicle-id mono">{r.vehicleId}</span>
                        {r.vehicle?.type === "reefer" ? (
                          <Badge tone="cold">❄ Reefer</Badge>
                        ) : (
                          <Badge>Dry</Badge>
                        )}
                        <span className="dp-route-desc">{routeName}</span>
                        <span className="dp-driver-name muted">· {r.driver}</span>
                      </div>
                      <div>
                        {isOffline ? (
                          <span className="badge bad">
                            <span className="dot" /> No signal
                          </span>
                        ) : (
                          <StatusBadge status={r.status} />
                        )}
                      </div>
                    </div>

                    {/* Stop progress bar */}
                    <div className="dp-progress-container">
                      <div className="dp-progress-bar">
                        {r.stops.map((s) => {
                          let segmentClass = s.status;
                          if (isOffline && s.status === "next") {
                            segmentClass = "offline";
                          }
                          return (
                            <div
                              key={s.seq}
                              className={`dp-progress-segment ${segmentClass}`}
                              title={`Stop ${s.seq}: ${s.outletName} (${s.status})`}
                            />
                          );
                        })}
                      </div>

                      <div className="dp-progress-legend">
                        <span>
                          <b>
                            {deliveredCount} of {r.stops.length}
                          </b>{" "}
                          stops delivered
                        </span>
                        {remainingNames && (
                          <span className="dp-remaining-stops">Remaining: {remainingNames}</span>
                        )}
                      </div>
                    </div>

                    {/* Move stop actions for on-road pending deliveries */}
                    {r.status === "on_road" && pendingStops.length > 0 && (
                      <div className="dp-stop-actions">
                        <span className="small muted" style={{ alignSelf: "center", marginRight: 4 }}>
                          Actions:
                        </span>
                        {pendingStops.map((s) => (
                          <button
                            key={s.seq}
                            className="dp-move-btn"
                            onClick={() => moveStop(s)}
                            title={`Move ${s.outletName} to tomorrow's plan`}
                          >
                            Move {s.outletName} to tomorrow
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Column: Alerts and Live Feed */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Alerts Box */}
          <Card
            title="Needs a decision / Alerts"
            action={
              totalAlerts > 0 ? (
                <span className="badge bad">{totalAlerts}</span>
              ) : (
                <span className="badge ok">All clear</span>
              )
            }
          >
            {totalAlerts === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>
                All runs operating on schedule. No exceptions or pending conflicts.
              </p>
            ) : (
              <div className="dp-alerts-card">
                {/* 1. Offline Vehicles */}
                {offlineVehicles.map((v) => {
                  const run = (runs.data || []).find((r) => r.vehicleId === v.vehicleId);
                  const remaining = run ? run.stops.filter((s) => s.status !== "delivered").length : 2;
                  return (
                    <div key={v.vehicleId} className="dp-alert-item bad">
                      <div className="dp-alert-title" style={{ color: "var(--red-text)" }}>
                        <span>■</span> {v.vehicleId} has had no signal
                      </div>
                      <div className="dp-alert-body">
                        Last known location at <b>{v.place || "Kadugannawa pass"}</b>. The driver app
                        continues recording offline. {remaining} stops remaining.
                      </div>
                      <div className="dp-alert-actions">
                        <a
                          className="btn secondary"
                          style={{ minHeight: 28, fontSize: 12, padding: "0 10px" }}
                          href={`tel:+94771234567`}
                        >
                          Call {run?.driver || "Driver"}
                        </a>
                        <Link
                          className="btn secondary"
                          style={{ minHeight: 28, fontSize: 12, padding: "0 10px" }}
                          to="/dispatcher/tracking"
                        >
                          Open on map
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Chilled Over Capacity */}
                {over > 0 && (
                  <div className="dp-alert-item now">
                    <div className="dp-alert-title" style={{ color: "var(--yellow-deep)" }}>
                      <span>■</span> Wed: {over} chilled orders have no reefer slot
                    </div>
                    <div className="dp-alert-body">
                      {plan.data?.chilled.orders || 8} chilled orders for Wednesday, but only{" "}
                      {plan.data?.chilled.slots || 5} reefer slots available (VEH031 is in the workshop).
                    </div>
                    <div className="dp-alert-actions">
                      <Link
                        className="btn now"
                        style={{ minHeight: 28, fontSize: 12, padding: "0 10px" }}
                        to="/dispatcher/plan"
                      >
                        Decide who waits →
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3. Dock Shortfalls */}
                {shortfalls.map((sf) => (
                  <div key={sf.id} className="dp-alert-item bad">
                    <div className="dp-alert-title" style={{ color: "var(--red-text)" }}>
                      <span>■</span> Dock shortfall: {sf.name}
                    </div>
                    <div className="dp-alert-body">
                      {sf.loaded} of {sf.planned} loaded for {sf.outletName}. The truck is not blocked;
                      missing items are automatically queued for the next delivery.
                    </div>
                  </div>
                ))}

                {/* 4. Open Conflicts */}
                {openConflicts.map((c) => (
                  <div key={c.id} className="dp-alert-item bad">
                    <div className="dp-alert-title" style={{ color: "var(--red-text)" }}>
                      <span>■</span> Conflict on {c.orderId}: phone and office disagree
                    </div>
                    <div className="dp-alert-body">
                      {c.outletName}: driver completed delivery while offline, but dispatch moved it to
                      tomorrow.
                    </div>
                    <div className="dp-alert-actions">
                      <Link
                        className="btn secondary"
                        style={{ minHeight: 28, fontSize: 12, padding: "0 10px" }}
                        to="/dispatcher/tracking"
                      >
                        Check tracking
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Live Feed */}
          <Card
            title="Live feed"
            action={
              <span className="badge ok">
                <span className="dot" /> live
              </span>
            }
          >
            {events.length === 0 ? (
              <p className="muted small">
                Nothing yet. Changes from the dock, drivers and stores appear here instantly.
              </p>
            ) : (
              <ul className="feed">
                {events.map((e) => (
                  <li key={e.id} className={e.id === fresh ? "fresh" : ""}>
                    <span className="t">{time(e.at)}</span>
                    <span className="fill">{describe(e)}</span>
                    {tone(e.type) && <span className={`badge ${tone(e.type)}`}>{e.type.split(".")[0]}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
