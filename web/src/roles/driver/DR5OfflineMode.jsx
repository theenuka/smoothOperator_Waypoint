// DR5 Offline mode (degradation scenario 2). Owner: DRIVER FRONTEND.  Design: /design/DR5-OfflineMode.jpg
import { Card, Badge } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { useDriver, setOnline, flush } from "./outbox.js";

export default function DR5OfflineMode() {
  const { online, outbox, syncing, last } = useDriver();
  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        <span className="label">DR5 · Saved on this phone</span>
        <h1 className="h-page" style={{ fontSize: 32 }}>
          {online ? "Online" : "No signal. Keep going."}
        </h1>
        <span className="muted">
          {online
            ? "Everything you record is sent straight away."
            : "Deliveries are saved here and sent by themselves when the signal comes back. You don't need to do anything."}
        </span>
      </div>
      <Card title={`${outbox.length} waiting to send`}>
        {outbox.length === 0 ? (
          <span className="muted">Nothing waiting.</span>
        ) : (
          outbox.map((r) => (
            <div key={r.clientId} className="row between" style={{ padding: "6px 0" }}>
              <span>
                Stop {r.stopSeq} · {r.orderId}
              </span>
              <span className="mono small">{time(r.recordedAt)}</span>
              <Badge tone="cold">on phone</Badge>
            </div>
          ))
        )}
      </Card>
      {last && (
        <div className="notice ok small">
          Last sync {time(last.at)}: {last.accepted.length} sent, {last.duplicates.length} already there,{" "}
          {last.conflicts.length} need you.
        </div>
      )}
      <div className="col">
        <button className="btn secondary block" onClick={() => setOnline(!online)}>
          Demo: {online ? "simulate losing signal" : "signal is back"}
        </button>
        <button className="btn now block" disabled={!online || syncing || !outbox.length} onClick={flush}>
          {syncing ? "Sending…" : "Send now"}
        </button>
      </div>
    </>
  );
}
