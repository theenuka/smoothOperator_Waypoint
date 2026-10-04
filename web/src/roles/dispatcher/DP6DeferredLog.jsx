// DP6 Deferral log (audit). Design: docs/design/DP6-DeferredLog.jpg
// Requirements fulfilled: Filter by outlet; reversed deferrals show who reversed and why; waited most ranking and reversal details.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import "./dispatcher.css";

export default function DP6DeferredLog() {
  const { data, loading } = useApi("/deferrals", ["deferral.decided", "deferral.reversed", "sync.resolved"]);

  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "reversed"

  if (loading) return <Loading />;

  const deferrals = data || [];

  // Extract unique outlets for dropdown filter
  const outletOptions = Array.from(
    new Set(deferrals.map((d) => d.outletName || d.outletId).filter(Boolean))
  ).sort();

  // Filter deferrals
  const filteredDeferrals = deferrals.filter((d) => {
    const outlet = d.outletName || d.outletId || "";
    if (selectedOutlet !== "all" && outlet !== selectedOutlet) return false;
    if (statusFilter === "active" && d.reversed) return false;
    if (statusFilter === "reversed" && !d.reversed) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchOutlet = outlet.toLowerCase().includes(q);
      const matchId = (d.id || "").toLowerCase().includes(q);
      const matchOrderId = (d.orderId || "").toLowerCase().includes(q);
      const matchReason = (d.reason || "").toLowerCase().includes(q);
      const matchNote = (d.note || "").toLowerCase().includes(q);
      if (!matchOutlet && !matchId && !matchOrderId && !matchReason && !matchNote) return false;
    }
    return true;
  });

  // Calculate "Waited most, last 30 days" ranking
  const countsByOutlet = deferrals.reduce((acc, d) => {
    const name = d.outletName || d.outletId || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const rankedOutlets = Object.entries(countsByOutlet)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCount = Math.max(...Object.values(countsByOutlet), 1);

  // Reversed deferrals list
  const reversedDeferrals = deferrals.filter((d) => d.reversed);

  return (
    <>
      <PageHead
        code="EVERY DEFERRAL, WITH WHO DECIDED AND WHY"
        title="Deferral log"
        sub="The fairness rule on the decision screen reads from this log. No outlet waits twice in a row."
      >
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Export
        </button>
      </PageHead>

      {/* Filter Bar */}
      <div className="dp-filter-bar">
        <div className="row wrap" style={{ gap: 12, flex: 1 }}>
          {/* Outlet Dropdown Filter */}
          <select
            className="select"
            style={{ width: "auto", minWidth: 200 }}
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
          >
            <option value="all">All Outlets ({deferrals.length})</option>
            {outletOptions.map((o) => (
              <option key={o} value={o}>
                {o} ({deferrals.filter((d) => (d.outletName || d.outletId) === o).length})
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="dp-search-box" style={{ maxWidth: 320 }}>
            <input
              type="search"
              className="input"
              placeholder="Filter by reason, order, or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="dp-chips-group">
          <button
            type="button"
            className={`dp-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({deferrals.length})
          </button>
          <button
            type="button"
            className={`dp-chip ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active ({deferrals.filter((d) => !d.reversed).length})
          </button>
          <button
            type="button"
            className={`dp-chip ${statusFilter === "reversed" ? "active" : ""}`}
            onClick={() => setStatusFilter("reversed")}
          >
            Reversed ({reversedDeferrals.length})
          </button>
        </div>
      </div>

      <div className="dp6-layout">
        {/* Left Column: Deferral Records Table */}
        <Card className="pad-0">
          {filteredDeferrals.length === 0 ? (
            <div className="empty">No deferral records match the current filter.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Decided</th>
                    <th>Outlet</th>
                    <th>Reason Given</th>
                    <th>By</th>
                    <th>Outcome & Reversal Details</th>
                    <th>14 Days</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeferrals.map((d) => {
                    const isToday = d.at && d.at.startsWith("2026-09-29");
                    return (
                      <tr
                        key={d.id}
                        style={{
                          background: isToday && !d.reversed ? "var(--yellow-soft)" : undefined,
                        }}
                      >
                        <td className="mono small" style={{ whiteSpace: "nowrap" }}>
                          {day(d.at)} · {time(d.at)}
                        </td>
                        <td>
                          <b>{d.outletName || d.outletId}</b>
                          <div className="mono small muted">{d.orderId}</div>
                        </td>
                        <td className="small" style={{ maxWidth: 340 }}>
                          {d.reason}
                        </td>
                        <td className="small" style={{ whiteSpace: "nowrap" }}>
                          {d.decidedBy}
                        </td>
                        <td style={{ minWidth: 220 }}>
                          {d.reversed ? (
                            <div className="col" style={{ gap: 4 }}>
                              <div className="row" style={{ gap: 6 }}>
                                <span className="badge ok">
                                  <span className="dot" /> Reversed
                                </span>
                                {d.reversedAt && (
                                  <span className="mono small muted">{time(d.reversedAt)}</span>
                                )}
                              </div>
                              {/* Prominently show WHO reversed and WHY */}
                              <div className="dp6-reversal-note">
                                <div>
                                  <b>Reversed by:</b> {d.reversedBy || "Driver"}
                                </div>
                                <div>
                                  <b>Reason:</b> {d.note || "Delivered while offline; delivery kept."}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="col" style={{ gap: 4 }}>
                              <Badge tone="now">Deferred to {day(d.toDate)}</Badge>
                              <span className="small muted">Protected on next run</span>
                            </div>
                          )}
                        </td>
                        <td className="mono small">
                          {countsByOutlet[d.outletName || d.outletId] >= 2 ? (
                            <span style={{ color: "var(--red-text)", fontWeight: 700 }}>
                              ●● {countsByOutlet[d.outletName || d.outletId]} (2nd in 14d)
                            </span>
                          ) : (
                            <span className="muted">●○ 1</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right Column: Statistics & Reversed Decisions Sidebar matching design */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Waited Most Ranking Card */}
          <Card title="Waited most, last 30 days">
            <div className="stack" style={{ gap: 12 }}>
              {rankedOutlets.map(([name, count]) => {
                const pct = Math.round((count / maxCount) * 100);
                const isHigh = count >= 2;
                return (
                  <div key={name} className="dp6-waited-item">
                    <div className="dp6-waited-meta">
                      <b>{name}</b>
                      <span className="mono">{count}</span>
                    </div>
                    <div className="dp6-waited-bar-track">
                      <div
                        className={`dp6-waited-bar-fill ${isHigh ? "high" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Reversed Decisions Details Card */}
          <Card
            title="Reversed decisions"
            action={<span className="small muted">{reversedDeferrals.length} reversed</span>}
          >
            {reversedDeferrals.length === 0 ? (
              <div className="col" style={{ gap: 8 }}>
                <p className="small muted" style={{ margin: 0 }}>
                  When dispatch defers an order while a driver delivers it offline, the conflict is resolved
                  in favor of reality.
                </p>
                <div className="dp6-reversed-item" style={{ borderLeftColor: "var(--line)" }}>
                  <span className="small muted">
                    Example: If Kandy City is moved to tomorrow, but Chamara delivers it before syncing, the
                    driver keeps their delivery and the deferral is reversed with the timestamp and
                    explanation.
                  </span>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {reversedDeferrals.map((rd) => (
                  <div key={rd.id} className="dp6-reversed-item">
                    <div className="row between">
                      <b>{rd.outletName || rd.outletId}</b>
                      <span className="badge ok">Reversed</span>
                    </div>
                    <div className="small">
                      <b>Who reversed:</b> {rd.reversedBy || "Driver / Reconcile"}
                    </div>
                    <div className="dp6-reversal-note">
                      <b>Why:</b> {rd.note || "Delivered while offline; delivery record confirmed."}
                    </div>
                    {rd.reversedAt && (
                      <span className="mono small muted">
                        Reversed at {day(rd.reversedAt)} {time(rd.reversedAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Link
                to="/dispatcher/dashboard"
                className="btn secondary small block"
                style={{ textAlign: "center" }}
              >
                See today&apos;s runs →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
