// DP2 Orders for Wednesday. Owner: DISPATCHER FRONTEND. Design: /design/DP2-OrderQueue.jpg
// Matches design: Brand / Temperature / District / Status filter sidebar, search, totals, and order lines side panel.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { api } from "../../shared/api.js";
import { Card, PageHead, StatusBadge, Loading, Badge } from "../../shared/ui.jsx";
import { kg, time } from "../../shared/format.js";
import "./dispatcher.css";

const OUTLET_METADATA = {
  OUT014: {
    district: "Colombo",
    brand: "Waypoint Fresh",
    window: "05:30–08:00",
    note: "Deferred twice in 14 days",
  },
  OUT045: { district: "Gampaha", brand: "Waypoint Fresh", window: "06:00–08:00", note: "Deferred today" },
  OUT058: { district: "Colombo", brand: "Waypoint Fresh", window: "05:30–07:30", note: "Deferred today" },
  OUT067: { district: "Gampaha", brand: "Waypoint Fresh", window: "06:00–09:00", note: "" },
  OUT022: { district: "Colombo", brand: "Waypoint Fresh", window: "05:30–08:30", note: "" },
  OUT036: { district: "Colombo", brand: "Waypoint Fresh", window: "06:00–09:00", note: "" },
  OUT031: {
    district: "Gampaha",
    brand: "Waypoint Fresh",
    window: "06:00–08:00",
    note: "+2 crates of milk",
    changed: true,
  },
  OUT011: { district: "Colombo", brand: "Waypoint Fresh", window: "05:30–09:00", note: "" },
  OUT083: {
    district: "Kegalle",
    brand: "Waypoint Fresh",
    window: "08:00–12:00",
    note: "Includes 4 detergent owed from Tue",
  },
  OUT072: {
    district: "Kandy",
    brand: "Waypoint Style",
    window: "10:00–13:00",
    note: "Mall dock, 3 hour window",
  },
  OUT075: { district: "Kandy", brand: "Waypoint Style", window: "09:00–12:00", note: "" },
  OUT061: { district: "Gampaha", brand: "Waypoint Tech", window: "07:00–11:00", note: "" },
  OUT077: { district: "Gampaha", brand: "Waypoint Fresh", window: "07:00–11:00", note: "" },
};

export default function DP2OrderQueue() {
  const { data, loading } = useApi("/orders?date=2026-09-30", ["order.placed", "deferral.decided"]);
  const plan = useApi("/plan?date=2026-09-30", ["deferral.decided", "deferral.reversed"]);
  const suggest = useApi("/plan/suggest?date=2026-09-30", ["deferral.decided", "deferral.reversed"]);

  const [search, setSearch] = useState("");
  const [selectedPill, setSelectedPill] = useState("all"); // "all" | "chilled" | "protected" | "changed"
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter sidebar states
  const [selectedBrands, setSelectedBrands] = useState(["Waypoint Fresh", "Waypoint Style", "Waypoint Tech"]);
  const [selectedTemps, setSelectedTemps] = useState(["Chilled", "Ambient"]);
  const [selectedDistricts, setSelectedDistricts] = useState([
    "Colombo",
    "Gampaha",
    "Kandy",
    "Kegalle",
    "Kurunegala",
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState(["Confirmed", "Protected", "Changed today"]);

  const toggleFilter = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const rawOrders = data || [];
  const protectedOutlets = new Set(
    (suggest.data?.rows || []).filter((r) => r.protected).map((r) => r.outletId)
  );

  // Enrich orders with metadata
  const orders = rawOrders.map((o) => {
    const meta = OUTLET_METADATA[o.outletId] || {
      district: "Colombo",
      brand: "Waypoint Fresh",
      window: "06:00–10:00",
      note: "",
    };
    const isProtected = protectedOutlets.has(o.outletId) || meta.protected;
    const isChanged = meta.changed;
    const tempLabel = o.chilled ? "Chilled" : "Ambient";
    const statusLabel = isProtected ? "Protected" : isChanged ? "Changed today" : "Confirmed";

    return {
      ...o,
      district: meta.district,
      brand: meta.brand,
      window: meta.window,
      note: meta.note,
      isProtected,
      isChanged,
      tempLabel,
      statusLabel,
    };
  });

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // Top quick pill
    if (selectedPill === "chilled" && !o.chilled) return false;
    if (selectedPill === "protected" && !o.isProtected) return false;
    if (selectedPill === "changed" && !o.isChanged) return false;

    // Sidebar filters
    if (!selectedBrands.includes(o.brand)) return false;
    if (!selectedTemps.includes(o.tempLabel)) return false;
    if (!selectedDistricts.includes(o.district)) return false;
    if (!selectedStatuses.includes(o.statusLabel)) return false;

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (o.outletName || "").toLowerCase().includes(q);
      const matchId = (o.id || "").toLowerCase().includes(q);
      const matchOutletId = (o.outletId || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchOutletId) return false;
    }
    return true;
  });

  // Counts for sidebar
  const countBrand = (b) => orders.filter((o) => o.brand === b).length;
  const countTemp = (t) => orders.filter((o) => o.tempLabel === t).length;
  const countDistrict = (d) => orders.filter((o) => o.district === d).length;
  const countStatus = (s) => orders.filter((o) => o.statusLabel === s).length;

  const chilledCount = orders.filter((o) => o.chilled).length;
  const protectedCount = orders.filter((o) => o.isProtected).length;
  const changedCount = orders.filter((o) => o.isChanged).length;
  const totalOrders = orders.length;
  const totalKg = orders.reduce((sum, o) => sum + (o.kg || 0), 0);
  const reeferSlots = plan.data?.chilled.slots ?? 5;
  const overChilled = Math.max(0, chilledCount - reeferSlots);

  // Select order for lines panel
  const handleSelectOrder = async (orderId) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setSelectedOrderDetail(null);
      return;
    }
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrderDetail(res);
    } catch {
      const fallback = orders.find((o) => o.id === orderId);
      setSelectedOrderDetail(fallback);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <PageHead
        code="PLANNING WEDNESDAY 30 SEPTEMBER"
        title="Orders for Wednesday"
        sub={`${totalOrders} orders in. 3 outlets haven't ordered yet; their orders join automatically until 16:00.`}
      >
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Export run sheet
        </button>
        <Link className="btn now" to="/dispatcher/plan">
          Send {totalOrders} to planning →
        </Link>
      </PageHead>

      {/* Totals Summary Row */}
      <div className="dp-totals-bar">
        <div className="dp-total-item">
          <span className="label">Total Orders</span>
          <span className="dp-total-val">{totalOrders}</span>
        </div>
        <div className="dp-total-item">
          <span className="label">Total Weight</span>
          <span className="dp-total-val mono">{kg(totalKg)}</span>
        </div>
        <div className="dp-total-item">
          <span className="label">Chilled Demand</span>
          <span className="dp-total-val" style={{ color: "var(--blue)" }}>
            {chilledCount} orders
          </span>
        </div>
        <div className="dp-total-item">
          <span className="label">Reefer Slots Available</span>
          <span className="dp-total-val mono">{reeferSlots} slots</span>
        </div>
        <div className="dp-total-item">
          <span className="label">Chilled Capacity Status</span>
          <span
            className="dp-total-val"
            style={{ color: overChilled > 0 ? "var(--red-text)" : "var(--green-text)" }}
          >
            {overChilled > 0 ? `${overChilled} over capacity` : "Within capacity"}
          </span>
        </div>
      </div>

      <div className="dp2-page-layout">
        {/* Left Filter Sidebar matching design */}
        <aside className="dp2-sidebar">
          {/* Brand */}
          <div className="dp2-sidebar-sec">
            <span className="dp2-sidebar-title">Brand</span>
            {["Waypoint Fresh", "Waypoint Style", "Waypoint Tech"].map((b) => (
              <label key={b} className="dp2-sidebar-item">
                <span className="dp2-sidebar-label">
                  <input
                    type="checkbox"
                    className="dp2-checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggleFilter(selectedBrands, setSelectedBrands, b)}
                  />
                  <span>{b}</span>
                </span>
                <span className="dp2-sidebar-count">{countBrand(b)}</span>
              </label>
            ))}
          </div>

          {/* Temperature */}
          <div className="dp2-sidebar-sec">
            <span className="dp2-sidebar-title">Temperature</span>
            {[
              { label: "Chilled", title: "❄ Chilled", color: "var(--blue)" },
              { label: "Ambient", title: "Ambient" },
            ].map((t) => (
              <label key={t.label} className="dp2-sidebar-item">
                <span className="dp2-sidebar-label">
                  <input
                    type="checkbox"
                    className="dp2-checkbox"
                    checked={selectedTemps.includes(t.label)}
                    onChange={() => toggleFilter(selectedTemps, setSelectedTemps, t.label)}
                  />
                  <span style={t.color ? { color: t.color, fontWeight: 500 } : {}}>{t.title}</span>
                </span>
                <span className="dp2-sidebar-count">{countTemp(t.label)}</span>
              </label>
            ))}
          </div>

          {/* District */}
          <div className="dp2-sidebar-sec">
            <span className="dp2-sidebar-title">District</span>
            {["Colombo", "Gampaha", "Kandy", "Kegalle", "Kurunegala"].map((d) => (
              <label key={d} className="dp2-sidebar-item">
                <span className="dp2-sidebar-label">
                  <input
                    type="checkbox"
                    className="dp2-checkbox"
                    checked={selectedDistricts.includes(d)}
                    onChange={() => toggleFilter(selectedDistricts, setSelectedDistricts, d)}
                  />
                  <span>{d}</span>
                </span>
                <span className="dp2-sidebar-count">{countDistrict(d)}</span>
              </label>
            ))}
          </div>

          {/* Status */}
          <div className="dp2-sidebar-sec">
            <span className="dp2-sidebar-title">Status</span>
            {[
              { label: "Confirmed", title: "Confirmed" },
              { label: "Protected", title: "Protected" },
              { label: "Changed today", title: "Changed today" },
              { label: "Not ordered", title: "Not ordered" },
            ].map((s) => (
              <label key={s.label} className="dp2-sidebar-item">
                <span className="dp2-sidebar-label">
                  <input
                    type="checkbox"
                    className="dp2-checkbox"
                    checked={selectedStatuses.includes(s.label)}
                    onChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, s.label)}
                  />
                  <span>{s.title}</span>
                </span>
                <span className="dp2-sidebar-count">{countStatus(s.label)}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="dp2-main">
          {/* Search and Top Pills Bar */}
          <div className="dp-filter-bar">
            <div className="dp-search-box">
              <input
                type="search"
                className="input"
                placeholder="Filter by outlet or order…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dp-chips-group">
              <button
                type="button"
                className={`dp-chip ${selectedPill === "all" ? "active" : ""}`}
                onClick={() => setSelectedPill("all")}
              >
                All ({totalOrders})
              </button>
              <button
                type="button"
                className={`dp-chip ${selectedPill === "chilled" ? "active" : ""}`}
                onClick={() => setSelectedPill("chilled")}
              >
                ❄ Chilled {chilledCount}
              </button>
              <button
                type="button"
                className={`dp-chip ${selectedPill === "protected" ? "active" : ""}`}
                onClick={() => setSelectedPill("protected")}
              >
                🔒 Protected {protectedCount}
              </button>
              <button
                type="button"
                className={`dp-chip ${selectedPill === "changed" ? "active" : ""}`}
                onClick={() => setSelectedPill("changed")}
              >
                Changed {changedCount}
              </button>
            </div>

            <span className="small muted" style={{ marginLeft: "auto" }}>
              Sorted by planning priority
            </span>
          </div>

          {/* Table & Side Panel Layout */}
          <div className={`dp-orders-layout ${selectedOrderId ? "has-panel" : ""}`}>
            <Card className="pad-0">
              {loading ? (
                <Loading />
              ) : filteredOrders.length === 0 ? (
                <div className="empty">No orders matching the selected filters.</div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Outlet</th>
                        <th>District</th>
                        <th>Brand</th>
                        <th>Temp</th>
                        <th>Kg</th>
                        <th>Window</th>
                        <th>Status</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => {
                        const isSelected = selectedOrderId === o.id;
                        return (
                          <tr
                            key={o.id}
                            className={`dp-table-row ${isSelected ? "is-selected" : ""}`}
                            onClick={() => handleSelectOrder(o.id)}
                            title="Click to view order lines"
                          >
                            <td className="mono">{o.id}</td>
                            <td>
                              <b>{o.outletName}</b>
                              <div className="small muted mono">{o.outletId}</div>
                            </td>
                            <td>{o.district}</td>
                            <td className="small muted">{o.brand.replace("Waypoint ", "")}</td>
                            <td>
                              {o.chilled ? (
                                <span style={{ color: "var(--blue)", fontWeight: 600 }}>❄ Chilled</span>
                              ) : (
                                <span className="muted">Ambient</span>
                              )}
                            </td>
                            <td className="mono">{kg(o.kg)}</td>
                            <td className="mono small">{o.window}</td>
                            <td>
                              {o.isProtected ? (
                                <Badge tone="now">🔒 Protected</Badge>
                              ) : o.isChanged ? (
                                <Badge tone="now">Changed</Badge>
                              ) : (
                                <span className="badge ok">
                                  <span className="dot" /> Confirmed
                                </span>
                              )}
                            </td>
                            <td className="small muted">{o.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Side Panel: Order Lines */}
            {selectedOrderId && (
              <aside className="dp-side-panel">
                <div className="row between">
                  <div>
                    <span className="label">Order Details</span>
                    <h3 className="h-sec mono" style={{ margin: "2px 0 0" }}>
                      {selectedOrderId}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn secondary small"
                    style={{ minHeight: 30, padding: "0 10px" }}
                    onClick={() => {
                      setSelectedOrderId(null);
                      setSelectedOrderDetail(null);
                    }}
                  >
                    ✕ Close
                  </button>
                </div>

                {detailLoading ? (
                  <Loading />
                ) : selectedOrderDetail ? (
                  <div className="col" style={{ gap: 14 }}>
                    <div
                      className="row wrap between"
                      style={{ background: "var(--paper-2)", padding: 10, borderRadius: 6 }}
                    >
                      <div>
                        <div className="small muted">Outlet</div>
                        <b>{selectedOrderDetail.outletName}</b> ({selectedOrderDetail.outletId})
                      </div>
                      <div>
                        <div className="small muted">Delivery</div>
                        <b>{selectedOrderDetail.deliveryDate}</b>
                      </div>
                      <div>
                        <div className="small muted">Weight</div>
                        <b>{kg(selectedOrderDetail.kg)}</b>
                      </div>
                      <div>
                        <div className="small muted">Temp</div>
                        {selectedOrderDetail.chilled ? (
                          <Badge tone="cold">❄ Chilled</Badge>
                        ) : (
                          <Badge>Ambient</Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="label" style={{ marginBottom: 6 }}>
                        Order Lines ({selectedOrderDetail.lines?.length || 0} items)
                      </h4>
                      <table className="table" style={{ fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrderDetail.lines || []).map((line, idx) => (
                            <tr key={line.sku || idx}>
                              <td>
                                <div>
                                  <b>{line.name}</b>
                                </div>
                                <span className="mono small muted">{line.sku}</span>
                              </td>
                              <td className="mono">
                                {line.qty} {line.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedOrderDetail.deferrals?.length > 0 && (
                      <div className="notice bad">
                        <b>Deferral history:</b>
                        {selectedOrderDetail.deferrals.map((d) => (
                          <div key={d.id} className="small" style={{ marginTop: 4 }}>
                            Deferred to {d.toDate} by {d.decidedBy}: {d.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="muted small">No details available.</p>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
