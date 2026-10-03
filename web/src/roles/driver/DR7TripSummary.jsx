// DR7 Trip summary. Owner: DRIVER FRONTEND.  Design: /design/DR7-TripSummary.jpg
// The run in one screen: how many stops, what was handed over, and everything unusual with its time.
// Anything still on the phone is shown first, because it must be sent before the shift ends.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote, Badge } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { useDriver, RUN, VEHICLE } from "./outbox.js";
import { reasonLabel } from "./reasons.js";
import "./driver.css";

const short = (name) => name.split(",")[0].toLowerCase();
const minutesBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 60000);

// Build the "What happened" list from the run, deliveries, deferrals, conflicts and signal events.
function whatHappened({ run, deliveries, deferrals, conflicts, events }) {
  const rows = [];
  const name = (orderId) => run.stops.find((s) => s.orderId === orderId)?.outletName || orderId;

  for (const s of run.stops) {
    for (const x of s.shortfalls) {
      rows.push({
        at: x.at,
        title: `${s.outletName}: ${x.planned - x.loaded} ${short(x.name)} short`,
        detail: "Known from the dock. The rest comes on the next delivery.",
      });
    }
  }
  for (const d of deliveries.filter((x) => x.status === "failed")) {
    rows.push({
      at: d.recordedAt,
      title: `${name(d.orderId)}: not delivered`,
      detail: `${reasonLabel(d.issue)}. ${d.goods === "return" ? "Goods back to the depot." : "Try again on the way back."}`,
    });
  }
  for (const f of deferrals) {
    rows.push({
      at: f.at,
      title: `${name(f.orderId)} moved to ${day(f.toDate)}`,
      detail: f.reversed ? "You delivered it, so the move was cancelled." : `By dispatch: ${f.reason}`,
    });
  }
  for (const c of conflicts.filter((x) => x.status === "resolved")) {
    rows.push({
      at: c.resolvedAt || c.at,
      title: `${c.outletName}: phone and office disagreed`,
      detail:
        c.choice === "phone" ? "Your delivery stood. Dispatch was updated." : "You kept the office version.",
    });
  }
  // Signal: pair each "lost signal" with the next "back online".
  const signal = events
    .filter((e) => e.payload?.vehicleId === VEHICLE && /vehicle\.(offline|online)/.test(e.type))
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  signal.forEach((e, i) => {
    if (e.type !== "vehicle.offline") return;
    const back = signal.slice(i + 1).find((x) => x.type === "vehicle.online");
    rows.push({
      at: e.at,
      title: back
        ? `No signal for ${minutesBetween(e.at, back.at) < 1 ? "under a minute" : `${minutesBetween(e.at, back.at)} min`}`
        : "No signal now",
      detail: back
        ? `${e.payload.place ? `${e.payload.place}. ` : ""}Everything saved on the phone was sent at ${time(back.at)}.`
        : "Deliveries are saved on the phone and send by themselves.",
    });
  });
  return rows.sort((a, b) => new Date(a.at) - new Date(b.at));
}

export default function DR7TripSummary() {
  const { outbox } = useDriver();
  const [endedAt, setEndedAt] = useState(null);
  const refresh = ["delivery.recorded", "sync.resolved", "deferral.decided", "deferral.reversed"];
  const run = useApi(`/runs/${RUN}`, [...refresh, "load.shortfall"]);
  const deliveries = useApi(`/deliveries?runId=${RUN}`, refresh);
  const deferrals = useApi("/deferrals", refresh);
  const conflicts = useApi(`/sync/conflicts?runId=${RUN}`, ["sync.conflict", "sync.resolved"]);
  const events = useApi("/meta/events?limit=200", ["vehicle.offline", "vehicle.online"]);

  const all = [run, deliveries, deferrals, conflicts, events];
  if (all.some((x) => x.loading)) return <Loading />;
  const failed = all.find((x) => x.error);
  if (failed) return <ErrorNote error={failed.error} />;

  const r = run.data;
  const orderIds = r.stops.map((s) => s.orderId);
  const rows = whatHappened({
    run: r,
    // Records still on the phone count too: the driver already knows about them.
    deliveries: [...deliveries.data, ...outbox],
    deferrals: deferrals.data.filter((f) => orderIds.includes(f.orderId)),
    conflicts: conflicts.data,
    events: events.data,
  });

  const onPhone = (s) => outbox.some((x) => x.orderId === s.orderId);
  const finished = r.stops.filter((s) => s.status === "delivered" || s.status === "failed" || onPhone(s));
  const moved = r.stops.filter((s) => s.order?.status === "deferred");
  const allDone = finished.length + moved.length >= r.stops.length;
  const handedOver = r.stops
    .filter(
      (s) => s.status === "delivered" || outbox.some((x) => x.orderId === s.orderId && x.status !== "failed")
    )
    .flatMap((s) =>
      (s.order?.lines || []).map((l) => s.shortfalls.find((x) => x.sku === l.sku)?.loaded ?? l.qty)
    )
    .reduce((sum, n) => sum + n, 0);
  const problems = rows.length;
  const openConflicts = conflicts.data.filter((c) => c.status === "open").length;

  return (
    <>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">
          {day(r.date)} · {r.vehicleId} · {time(new Date().toISOString())}
        </span>
        <h1 className="dr-title">{allDone ? "Run complete" : "Run so far"}</h1>
      </div>

      <div className="dr-tiles">
        <div className="dr-tile">
          <b>
            {finished.length}/{r.stops.length}
          </b>
          <span className="small">stops done</span>
        </div>
        <div className="dr-tile">
          <b>{handedOver}</b>
          <span className="small">items handed over</span>
        </div>
        <div className="dr-tile">
          <b>{problems}</b>
          <span className="small">{problems === 1 ? "thing to know" : "things to know"}</span>
        </div>
      </div>

      {outbox.length > 0 && (
        <div className="notice bad small">
          <b>
            {outbox.length} {outbox.length === 1 ? "record is" : "records are"} still on this phone.
          </b>{" "}
          They send by themselves when there is signal. Wait for them before you end the shift.{" "}
          <Link to="/driver/outbox">See what is saved</Link>
        </div>
      )}
      {openConflicts > 0 && (
        <div className="notice small">
          <b>
            {openConflicts === 1 ? "One delivery needs" : `${openConflicts} deliveries need`} your answer.
          </b>{" "}
          <Link to="/driver/sync">Open Sync</Link>
        </div>
      )}

      <div className="dr-list">
        <div className="dr-list-head">
          <span className="label">What happened</span>
          {outbox.length ? (
            <Badge tone="bad">{outbox.length} on phone</Badge>
          ) : (
            <Badge tone="ok">All sent</Badge>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="dr-line muted">Nothing unusual. Every stop went to plan.</div>
        ) : (
          rows.map((row, i) => (
            <div key={i} className="dr-event">
              <span className="mono small muted">{time(row.at)}</span>
              <div className="col" style={{ gap: 2 }}>
                <b>{row.title}</b>
                <span className="small muted">{row.detail}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="col" style={{ gap: 8, marginTop: "auto" }}>
        {endedAt ? (
          <div className="notice ok">Shift ended at {time(endedAt)}. Thank you, Chamara.</div>
        ) : (
          <>
            <span className="small muted" style={{ textAlign: "center" }}>
              Hand the keys back at bay {r.bay}
            </span>
            <button
              className="btn big block"
              disabled={outbox.length > 0 || openConflicts > 0}
              onClick={() => setEndedAt(new Date().toISOString())}
            >
              {outbox.length > 0
                ? "Send saved records first"
                : openConflicts > 0
                  ? "Answer the open question first"
                  : allDone
                    ? "End shift"
                    : "End shift early"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
