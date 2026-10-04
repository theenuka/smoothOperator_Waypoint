// DP5 Live tracking. Design: docs/design/DP5-LiveTracking.jpg
// Requirements fulfilled: List of trucks with "last seen", clear red state for "no signal" explaining that deliveries are saved on phone and will sync, planned stops of RUN-VEH022 showing which are done, and route map.
import { useState } from "react";
import { useApi, useDates } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, StatusBadge } from "../../shared/ui.jsx";
import { longDay, time } from "../../shared/format.js";
import LiveMap from "./LiveMap.jsx";
import "./dispatcher.css";

export default function DP5LiveTracking() {
  const trackingApi = useApi("/tracking", ["vehicle.position", "vehicle.offline", "vehicle.online"]);
  const { today } = useDates();
  const runsApi = useApi(today ? `/runs?date=${today}` : null, [
    "delivery.recorded",
    "sync.conflict",
    "sync.resolved",
    "load.shortfall",
    "deferral.decided",
  ]);

  const [activeVehicleId, setActiveVehicleId] = useState("VEH022");
  const [filter, setFilter] = useState("all"); // "all" | "exceptions" | "chilled"
  const [activeTab, setActiveTab] = useState("stops"); // "stops" | "vehicles"

  if (trackingApi.loading || runsApi.loading) return <Loading />;

  const runs = runsApi.data || [];
  const positions = trackingApi.data || [];

  // Match each tracking position with its run and metadata
  const trucks = positions.map((p) => {
    const run = runs.find((r) => r.vehicleId === p.vehicleId);
    const deliveredCount = run?.stops?.filter((s) => s.status === "delivered").length ?? 0;
    const totalStops = run?.stops?.length ?? 0;
    const isOffline = p.online === false;
    const isChilled = run?.vehicle?.type === "reefer";

    let routeName = "Local run";
    if (p.vehicleId === "VEH022") routeName = "Kandy run (A1)";
    else if (p.vehicleId === "VEH014") routeName = "Colombo South Reefer";
    else if (p.vehicleId === "VEH019") routeName = "Colombo Central Reefer";
    else if (p.vehicleId === "VEH026") routeName = "Gampaha Reefer";

    return {
      vehicleId: p.vehicleId,
      driver: run?.driver || "Driver",
      route: routeName,
      lat: p.lat,
      lng: p.lng,
      at: p.at,
      place: p.place || (p.vehicleId === "VEH022" ? "Kadugannawa pass, A1" : "En route"),
      online: !isOffline,
      isOffline,
      isChilled,
      run,
      deliveredCount,
      totalStops,
      stops: run?.stops || [],
    };
  });

  // Sort exceptions first (offline first, then others)
  const sortedTrucks = [...trucks].sort((a, b) => {
    if (a.isOffline && !b.isOffline) return -1;
    if (!a.isOffline && b.isOffline) return 1;
    return a.vehicleId.localeCompare(b.vehicleId);
  });

  const selectedTruck = sortedTrucks.find((t) => t.vehicleId === activeVehicleId) || sortedTrucks[0];
  const selectedRun = runs.find((r) => r.vehicleId === selectedTruck?.vehicleId) || runs[0];

  const filteredTrucks = sortedTrucks.filter((t) => {
    if (filter === "exceptions" && !t.isOffline) return false;
    if (filter === "chilled" && !t.isChilled) return false;
    return true;
  });

  const offlineCount = sortedTrucks.filter((t) => t.isOffline).length;

  return (
    <>
      <PageHead
        code={`${longDay(today).toUpperCase()} · LIVE`}
        title="Live tracking"
        sub="Where every truck is, and which ones have lost signal."
      >
        <div className="dp-chips-group">
          <button
            type="button"
            className={`dp-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All {sortedTrucks.length}
          </button>
          <button
            type="button"
            className={`dp-chip ${filter === "exceptions" ? "active" : ""}`}
            onClick={() => setFilter("exceptions")}
          >
            Exceptions {offlineCount}
          </button>
          <button
            type="button"
            className={`dp-chip ${filter === "chilled" ? "active" : ""}`}
            onClick={() => setFilter("chilled")}
          >
            ❄ Chilled {sortedTrucks.filter((t) => t.isChilled).length}
          </button>
        </div>
      </PageHead>

      {/* Fleet Quick-Selector Bar (Immediately visible and accessible without scrolling) */}
      <div className="dp5-fleet-bar">
        {filteredTrucks.map((t) => {
          const isSelected = activeVehicleId === t.vehicleId;
          const isOffline = t.isOffline;
          return (
            <div
              key={t.vehicleId}
              className={`dp5-fleet-chip ${isSelected ? "active" : ""} ${isOffline ? "offline" : ""}`}
              onClick={() => setActiveVehicleId(t.vehicleId)}
            >
              <div className="dp5-fleet-chip-top">
                <b className="mono">{t.vehicleId}</b>
                {isOffline ? (
                  <span className="badge bad" style={{ padding: "2px 6px", fontSize: 10 }}>
                    <span className="dot" /> No signal
                  </span>
                ) : (
                  <span className="badge ok" style={{ padding: "2px 6px", fontSize: 10 }}>
                    <span className="dot" /> Online
                  </span>
                )}
              </div>
              <div className="dp5-fleet-chip-mid">
                <b>{t.route}</b> · {t.driver.split(" ")[0]}
              </div>
              <div className="dp5-fleet-chip-bot">
                <span>
                  {t.deliveredCount} of {t.totalStops} stops
                </span>
                <span>{t.at ? time(t.at) : "now"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dp5-layout">
        {/* Left: Interactive OpenStreetMap with live vehicles and route */}
        <div className="dp5-map-wrap">
          <LiveMap
            trucks={filteredTrucks}
            selectedTruckId={activeVehicleId}
            selectedRun={selectedRun}
            onSelectVehicle={setActiveVehicleId}
          />

          {/* Map Legend */}
          <div className="dp5-map-legend">
            <div className="row" style={{ gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#1b1a17" }} />
              <span>On schedule</span>
            </div>
            <div className="row" style={{ gap: 5 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#facc15",
                  border: "1px solid #1b1a17",
                }}
              />
              <span>Late</span>
            </div>
            <div className="row" style={{ gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#c8341e" }} />
              <span style={{ color: "var(--red-text)", fontWeight: 600 }}>No signal (saved on phone)</span>
            </div>
            <div className="row" style={{ gap: 5 }}>
              <span style={{ width: 9, height: 9, background: "#1b1a17", borderRadius: 2 }} />
              <span>Depot</span>
            </div>
            <div className="row" style={{ gap: 5 }}>
              <span style={{ borderBottom: "2px dashed #1b1a17", width: 14 }} />
              <span>Stops left</span>
            </div>
          </div>
        </div>

        {/* Right: Active Vehicle Inspector & Planned Stops */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Active Vehicle Inspector */}
          <div className={`dp5-inspector ${selectedTruck?.isOffline ? "offline" : ""}`}>
            <div className="row between">
              <div className="col" style={{ gap: 2 }}>
                <div className="row">
                  <b className="mono" style={{ fontSize: 16 }}>
                    {selectedTruck?.vehicleId}
                  </b>
                  <span className="small muted">{selectedTruck?.route}</span>
                </div>
                <span className="small muted">{selectedTruck?.driver}</span>
              </div>
              <div>
                {selectedTruck?.isOffline ? (
                  <span className="badge bad" style={{ padding: "4px 10px", fontSize: 12 }}>
                    <span className="dot" /> No signal
                  </span>
                ) : (
                  <span className="badge ok">
                    <span className="dot" /> Online
                  </span>
                )}
              </div>
            </div>

            <div className="dp5-stat-grid">
              <span className="label">Last seen</span>
              <div>
                <b>{selectedTruck?.at ? time(selectedTruck.at) : "Just now"}</b> · {selectedTruck?.place}
              </div>

              <span className="label">Driver app</span>
              <div>
                {selectedTruck?.isOffline ? (
                  <span style={{ color: "var(--red-text)", fontWeight: 600 }}>
                    Recording offline, syncs automatically on signal
                  </span>
                ) : (
                  "Connected and tracking"
                )}
              </div>

              <span className="label">Delivered</span>
              <div>
                <b>
                  {selectedTruck?.deliveredCount} of {selectedTruck?.totalStops}
                </b>{" "}
                stops delivered
              </div>
            </div>

            {/* Clear explanation of what no signal means */}
            {selectedTruck?.isOffline && (
              <div className="notice bad" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                <b>
                  {selectedTruck.vehicleId} lost signal in {selectedTruck.place}.
                </b>
                <br />
                Deliveries are saved securely on the driver&apos;s phone outbox and will sync automatically to
                dispatch the moment signal returns.
              </div>
            )}

            <div className="row wrap" style={{ gap: 8, marginTop: 4 }}>
              <a className="btn" style={{ flex: 1, minHeight: 38, fontSize: 13 }} href="tel:+94771234567">
                Call {selectedTruck?.driver?.split(" ")[0]}
              </a>
              <button
                type="button"
                className="btn secondary"
                style={{ flex: 1, minHeight: 38, fontSize: 13 }}
                onClick={() => {}}
              >
                Message outlet
              </button>
            </div>
          </div>

          {/* Tabs: Planned Stops & Fleet List */}
          <div className="dp5-card-tabbed">
            <div className="dp5-tabs-header">
              <button
                type="button"
                className={`dp5-tab-btn ${activeTab === "stops" ? "active" : ""}`}
                onClick={() => setActiveTab("stops")}
              >
                Planned stops ({selectedTruck?.stops?.length || 0})
              </button>
              <button
                type="button"
                className={`dp5-tab-btn ${activeTab === "vehicles" ? "active" : ""}`}
                onClick={() => setActiveTab("vehicles")}
              >
                All vehicles ({filteredTrucks.length})
              </button>
            </div>

            <div className="dp5-scroll-area">
              {activeTab === "stops" ? (
                selectedTruck?.stops?.length === 0 ? (
                  <p className="small muted" style={{ margin: "16px 8px" }}>
                    No planned stops for this vehicle.
                  </p>
                ) : (
                  <div className="dp5-stops-timeline" style={{ marginTop: 0 }}>
                    {selectedTruck.stops.map((s) => {
                      const isDone = s.status === "delivered";
                      const isNext = s.status === "next";
                      const hasShortfall = (s.shortfalls || []).length > 0;
                      const isDeferred = s.order?.status === "deferred";

                      return (
                        <div
                          key={s.seq}
                          className={`dp5-stop-card ${isDone ? "delivered" : isNext ? "next" : "pending"}`}
                        >
                          <div className="dp5-stop-left">
                            <span className="dp5-stop-num mono">#{s.seq}</span>
                            <div>
                              <div>
                                <b>{s.outletName}</b> <span className="small muted mono">({s.outletId})</span>
                              </div>
                              <div className="small muted">
                                ETA {s.eta} · {s.orderId}
                                {hasShortfall && (
                                  <span style={{ color: "var(--red-text)", marginLeft: 6, fontWeight: 600 }}>
                                    (Shortfall flagged)
                                  </span>
                                )}
                                {isDeferred && (
                                  <span
                                    style={{ color: "var(--yellow-deep)", marginLeft: 6, fontWeight: 600 }}
                                  >
                                    (Moved to tomorrow)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isDone ? (
                              <span className="badge ok">✔ Delivered</span>
                            ) : isNext ? (
                              <span className="badge now">● Next stop</span>
                            ) : isDeferred ? (
                              <span className="badge now">Deferred</span>
                            ) : (
                              <span className="badge">Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="col" style={{ gap: 0 }}>
                  {filteredTrucks.map((t) => {
                    const isSelected = activeVehicleId === t.vehicleId;
                    const isOffline = t.isOffline;
                    return (
                      <div
                        key={t.vehicleId}
                        className={`dp5-truck-item ${isOffline ? "dp5-row-offline" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => setActiveVehicleId(t.vehicleId)}
                      >
                        <div className="col" style={{ gap: 2 }}>
                          <div className="row">
                            <b className="mono">{t.vehicleId}</b>
                            <span className="small">{t.route}</span>
                          </div>
                          <span className="small muted">
                            {t.driver.split(" ")[0]} · {t.deliveredCount} of {t.totalStops} stops · last seen{" "}
                            {t.at ? time(t.at) : "now"}
                          </span>
                        </div>

                        <div>
                          {isOffline ? (
                            <span className="badge bad" style={{ fontWeight: 700 }}>
                              ■ No signal
                            </span>
                          ) : (
                            <span className="badge ok">● Online</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
