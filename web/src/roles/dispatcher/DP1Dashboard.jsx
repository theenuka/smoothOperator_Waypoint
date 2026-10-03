// DP1 Today's run (dashboard). Owner: DISPATCHER FRONTEND.  Design: /design/DP1-Dashboard.jpg
// WORKING BASELINE: stats + live feed. TODO: match the design (run cards with progress, alerts column).
import { Link, useNavigate } from "react-router-dom";
import { useApi, useEventFeed } from "../../shared/live.js";
import { Card, PageHead, Stat, StatusBadge, Loading } from "../../shared/ui.jsx";
import { describe, tone, time } from "../../shared/format.js";

const LIVE = [
  "delivery.recorded",
  "load.shortfall",
  "sync.conflict",
  "sync.resolved",
  "deferral.decided",
  "load.completed",
];

export default function DP1Dashboard() {
  const runs = useApi("/runs?date=2026-09-29", LIVE);
  const plan = useApi("/plan?date=2026-09-30", ["deferral.decided", "deferral.reversed", "order.placed"]);
  const conflicts = useApi("/sync/conflicts?status=open", ["sync.conflict", "sync.resolved"]);
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

  const shortfalls = (runs.data || []).flatMap((r) => r.stops.flatMap((s) => s.shortfalls));
  const over = plan.data?.chilled.over ?? 0;

  return (
    <>
      <PageHead
        code="DP1 · Tuesday 29 September"
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
        />
        <Stat
          label="Chilled over capacity (Wed)"
          value={over}
          tone={over ? "bad" : "ok"}
          hint={
            plan.data ? `${plan.data.chilled.orders} orders · ${plan.data.chilled.slots} reefer slots` : ""
          }
        />
        <Stat label="Dock shortfalls" value={shortfalls.length} tone={shortfalls.length ? "bad" : ""} />
        <Stat
          label="Need a decision"
          value={conflicts.data?.length ?? 0}
          tone={conflicts.data?.length ? "bad" : "ok"}
          hint="Phone and office disagree"
        />
      </div>

      <div className="grid-2">
        <Card title="Runs">
          {runs.loading ? (
            <Loading />
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {runs.data.map((r) => {
                const done = r.stops.filter((s) => s.status === "delivered").length;
                return (
                  <div key={r.id} className="col" style={{ gap: 6 }}>
                    <div className="row between">
                      <b className="mono">{r.vehicleId}</b>
                      <span className="small muted">{r.driver}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="row" style={{ gap: 3 }}>
                      {r.stops.map((s) => (
                        <span
                          key={s.seq}
                          title={`${s.outletName}: ${s.status}`}
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 2,
                            background:
                              s.status === "delivered"
                                ? "var(--green)"
                                : s.status === "next"
                                  ? "var(--yellow)"
                                  : "var(--line)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="small muted">
                      {done} of {r.stops.length} stops delivered
                    </span>
                    {r.status === "on_road" && (
                      <div className="row wrap" style={{ gap: 6 }}>
                        {r.stops
                          .filter((s) => s.status === "pending" && s.order?.status !== "deferred")
                          .map((s) => (
                            <button
                              key={s.seq}
                              className="btn secondary"
                              style={{ minHeight: 30, fontSize: 12.5, padding: "0 10px" }}
                              onClick={() => moveStop(s)}
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

        <Card
          title="Live feed"
          action={
            <span className="badge ok">
              <span className="dot" /> live
            </span>
          }
        >
          {events.length === 0 ? (
            <p className="muted">
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
    </>
  );
}
