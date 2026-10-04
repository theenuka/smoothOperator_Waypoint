// DR5 Offline mode (degradation scenario 2).  Design: docs/design/DR5-OfflineMode.jpg
// Three promises: offline is said plainly, every record is complete on the phone, sending is automatic.
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Badge, useToast } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { useDriver, setOnline, flush, RUN, DEAD_ZONE } from "./outbox.js";
import { reasonLabel } from "./reasons.js";
import { Icon, icon } from "./icons.jsx";
import "./driver.css";

// "09:52 · signature, photo, 11 items" or "07:52 · Shutter down, nobody to receive"
function details(r) {
  if (r.status === "failed") return `${time(r.recordedAt)} · ${reasonLabel(r.issue)}`;
  const parts = [];
  if (r.signature) parts.push("signature");
  if (r.photo) parts.push("photo");
  if (r.items) parts.push(`${r.items.reduce((sum, i) => sum + i.handedOver, 0)} items`);
  return [time(r.recordedAt), parts.join(", ")].filter(Boolean).join(" · ");
}

export default function DR5OfflineMode() {
  const { online, offlineSince, outbox, syncing, last } = useDriver();
  const { data: run } = useApi(`/runs/${RUN}`, ["delivery.recorded"]);
  const [toast, show] = useToast();

  const stopName = (r) => {
    const s = run?.stops.find((x) => x.orderId === r.orderId);
    return s ? `${s.outletId} ${s.outletName}` : `Stop ${r.stopSeq}`;
  };
  const errorFor = (r) => last?.errors?.find((e) => e.clientId === r.clientId)?.error;

  const sendNow = async () => {
    if (!online) return show("Still no signal. Your deliveries are safe on this phone.");
    await flush();
  };

  return (
    <>
      {!online ? (
        <div className="dr-bar off" role="status">
          <Icon d={icon.noSignal} />
          <div className="col fill" style={{ gap: 2 }}>
            <b>No signal since {time(offlineSince)}</b>
            <span className="small">{DEAD_ZONE} · everything below still works</span>
          </div>
        </div>
      ) : (
        <div className="dr-bar on" role="status">
          <Icon d={syncing ? icon.sync : icon.check} />
          <div className="col fill" style={{ gap: 2 }}>
            <b>{syncing ? `Sending ${outbox.length} saved…` : "Online"}</b>
            <span className="small">
              {outbox.length
                ? `${outbox.length} still on this phone, kept safe`
                : "Everything has reached the office"}
            </span>
          </div>
        </div>
      )}

      <div className="col" style={{ gap: 4 }}>
        <span className="label">{online ? "Online" : "Working offline"}</span>
        <h1 className="dr-title">Saved on this phone</h1>
      </div>

      <div className="dr-list">
        {outbox.length === 0 ? (
          <div className="dr-line muted">Nothing waiting. Every delivery has reached the office.</div>
        ) : (
          outbox.map((r) => {
            const error = errorFor(r);
            return (
              <div key={r.clientId} className={`dr-line ${error ? "short" : "ok"}`}>
                <Icon d={error ? icon.flag : icon.check} />
                <div className="col fill" style={{ gap: 2, padding: "10px 0" }}>
                  <b>
                    {stopName(r)} · {r.status === "failed" ? "not delivered" : "delivered"}
                  </b>
                  <span className="small muted">{details(r)}</span>
                  {error && <span className="small err">The office could not take this yet: {error}</span>}
                </div>
                <Badge tone={error ? "bad" : ""}>{error ? "Not sent" : "Saved"}</Badge>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <span className="label">Works without signal</span>
        <ul className="dr-checks">
          <li>
            <Icon d={icon.check} size={18} /> Route, stop details and contacts
          </li>
          <li>
            <Icon d={icon.check} size={18} /> Proof of delivery: signature and photo
          </li>
          <li>
            <Icon d={icon.check} size={18} /> Reporting a problem at a stop
          </li>
        </ul>
      </div>

      {last && online && (
        <div className={`notice ${last.conflicts.length || last.errors?.length ? "" : "ok"} small`}>
          Sent at {time(last.at)}: {last.accepted.length} saved by the office
          {last.duplicates.length ? `, ${last.duplicates.length} it already had` : ""}.
          {last.errors?.length > 0 && ` ${last.errors.length} could not be sent and stays on this phone.`}
          {last.conflicts.length > 0 && (
            <>
              {" "}
              {last.conflicts.length} needs you. <Link to="/driver/sync">Open Sync</Link>
            </>
          )}
        </div>
      )}

      <div className="col" style={{ gap: 10, marginTop: "auto" }}>
        <span className="small muted row" style={{ justifyContent: "center", gap: 6 }}>
          <Icon d={icon.sync} size={16} /> Sends by itself when signal returns. Nothing to press.
        </span>
        <button className="btn secondary big block" disabled={syncing || !outbox.length} onClick={sendNow}>
          {syncing ? "Sending…" : "Try to send now"}
        </button>
        <button className="btn ghost block" onClick={() => setOnline(!online)}>
          Demo: {online ? "lose signal" : "signal is back"}
        </button>
      </div>
      {toast}
    </>
  );
}
