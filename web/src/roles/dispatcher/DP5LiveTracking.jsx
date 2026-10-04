// DP5 Live tracking. Design: docs/design/DP5-LiveTracking.jpg
// Requirements fulfilled: List of trucks with "last seen", clear red state for "no signal" explaining that deliveries are saved on phone and will sync, planned stops of RUN-VEH022 showing which are done, and route map.
import { useState } from "react";
import { useApi, useDates } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, StatusBadge } from "../../shared/ui.jsx";
import { time, longDay } from "../../shared/format.js";
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

      <div className="dp5-layout">
        {/* Left: Route Map with Kadugannawa Pass and live vehicles */}
        <div className="dp5-map-wrap">
          <svg className="dp5-map-svg" viewBox="0 0 620 480">
            {/* Terrain Contours & Coast */}
            <path d="M 60,0 C 80,120 120,260 110,480" fill="none" stroke="#e2ded4" strokeWidth="2" />
            <path d="M 280,120 C 340,160 480,220 580,260" fill="none" stroke="#ece7dc" strokeWidth="1.5" />
            <path d="M 320,160 C 400,200 500,280 600,320" fill="none" stroke="#ece7dc" strokeWidth="1.5" />

            <text
              x="30"
              y="380"
              transform="rotate(-90 30 380)"
              fill="#b0aba0"
              fontSize="10"
              letterSpacing="2"
              fontFamily="var(--f-mono)"
            >
              INDIAN OCEAN
            </text>

            <text x="420" y="320" fill="#b8b2a6" fontSize="10" letterSpacing="1.5" fontFamily="var(--f-mono)">
              HILL COUNTRY · PATCHY COVERAGE
            </text>

            {/* A1 Highway Route (Peliyagoda -> Kandy) */}
            <path
              d="M 120,380 L 175,340 L 220,290 L 320,220 L 400,180"
              fill="none"
              stroke="#1b1a17"
              strokeWidth="3.5"
            />
            <path
              d="M 400,180 L 490,175 L 535,160"
              fill="none"
              stroke="#1b1a17"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Other routes */}
            <path d="M 120,380 L 110,230" fill="none" stroke="#c8c3b7" strokeWidth="1.5" />
            <path
              d="M 220,290 L 280,140"
              fill="none"
              stroke="#c8c3b7"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path d="M 220,290 L 280,390" fill="none" stroke="#c8c3b7" strokeWidth="1.5" />

            {/* Depots */}
            <rect x="112" y="372" width="16" height="16" fill="#1b1a17" rx="2" />
            <text x="134" y="388" fontSize="11" fontWeight="700" fill="#1b1a17">
              Peliyagoda depot
            </text>
            <text x="134" y="401" fontSize="9.5" fill="#6b675e">
              PLG Main Depot
            </text>

            <rect
              x="528"
              y="152"
              width="14"
              height="14"
              fill="#facc15"
              stroke="#1b1a17"
              strokeWidth="2"
              rx="2"
            />
            <text x="490" y="144" fontSize="11" fontWeight="700" fill="#1b1a17">
              Kandy depot
            </text>

            {/* Stops */}
            <circle cx="175" cy="340" r="4.5" fill="#1b1a17" />
            <text x="182" y="336" fontSize="10" fill="#34322d">
              Kadawatha
            </text>

            <circle cx="220" cy="290" r="4.5" fill="#1b1a17" />
            <text x="228" y="294" fontSize="10" fill="#34322d">
              Nittambuwa
            </text>

            <circle cx="320" cy="220" r="4.5" fill="#1b1a17" />
            <text x="310" y="240" fontSize="10" fill="#34322d">
              Kegalle
            </text>

            <circle cx="490" cy="175" r="4" fill="#1b1a17" />
            <text x="470" y="196" fontSize="10" fill="#34322d">
              Peradeniya
            </text>

            <circle cx="280" cy="390" r="4" fill="#34322d" />
            <text x="292" y="394" fontSize="10" fill="#56534b">
              Avissawella
            </text>

            {/* Kadugannawa Pass (VEH022 location) */}
            <g transform="translate(400, 180)">
              {selectedTruck?.isOffline ? (
                <>
                  <circle cx="0" cy="0" r="14" fill="#f8e1da" stroke="#c8341e" strokeWidth="2.5" />
                  <line x1="-8" y1="-8" x2="8" y2="8" stroke="#c8341e" strokeWidth="2.5" />
                  <rect x="-65" y="18" width="130" height="34" rx="4" fill="#1b1a17" />
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    fill="#facc15"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="var(--f-mono)"
                  >
                    LAST SEEN {selectedTruck.at ? time(selectedTruck.at) : "09:40"}
                  </text>
                  <text
                    x="0"
                    y="45"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="var(--f-mono)"
                  >
                    Kadugannawa pass, A1
                  </text>
                </>
              ) : (
                <circle cx="0" cy="0" r="7" fill="#2f7a4a" stroke="#ffffff" strokeWidth="2" />
              )}
            </g>
            <text
              x="355"
              y="165"
              fontSize="11"
              fontWeight="700"
              fill={selectedTruck?.isOffline ? "#c8341e" : "#2f7a4a"}
            >
              VEH022 · {selectedTruck?.isOffline ? "no signal" : "online"}
            </text>
          </svg>

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

          {/* Planned Stops of Selected Vehicle (RUN-VEH022) */}
          <Card
            title={`Planned stops of ${selectedRun?.id || selectedTruck?.vehicleId}`}
            action={
              <span className="small muted">
                {selectedTruck?.deliveredCount} of {selectedTruck?.totalStops} delivered
              </span>
            }
          >
            {selectedTruck?.stops?.length === 0 ? (
              <p className="small muted">No planned stops for this vehicle.</p>
            ) : (
              <div className="dp5-stops-timeline">
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
                              <span style={{ color: "var(--yellow-deep)", marginLeft: 6, fontWeight: 600 }}>
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
            )}
          </Card>

          {/* List of Trucks on the Road */}
          <Card
            title="All vehicles"
            action={<span className="small muted">exceptions first</span>}
            className="pad-0"
          >
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
                          ■ No signal · saved on phone
                        </span>
                      ) : (
                        <span className="badge ok">● Online</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
