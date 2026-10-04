// DR6 Sync and reconcile: phone and office disagree, a person decides.  Design: docs/design/DR6-SyncReconcile.jpg
// Clean records already synced silently. Only real disagreements come here, side by side, and nothing is overwritten.
import { Link } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote, useToast } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { useDriver, RUN } from "./outbox.js";
import { reasonLabel } from "./reasons.js";
import { Icon, icon } from "./icons.jsx";
import "./driver.css";

const DRIVER = "Chamara Wickramasinghe";

// "Photo 10:07 · signature · 9 items"
function proofText(rec) {
  const parts = [];
  if (rec.photo) parts.push(`Photo ${time(rec.photoAt || rec.recordedAt)}`);
  if (rec.signature) parts.push("signature");
  if (rec.items) parts.push(`${rec.items.reduce((sum, i) => sum + i.handedOver, 0)} items`);
  return parts.join(" · ");
}

function Conflict({ c, online, onResolve }) {
  const phoneDelivered = c.phone.status !== "failed";
  // The office moved the stop (deferral) or already recorded it as delivered.
  const officeMoved = c.server.status === "deferred";
  const proof = proofText(c.phone);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <span className="label">
        {c.outletId} {c.outletName}
      </span>

      <div className="dr-versus">
        <div className="dr-side">
          <span className="label">On your phone</span>
          <b className="dr-side-what">{phoneDelivered ? "Delivered" : "Not delivered"}</b>
          <span className="mono small">{time(c.phone.recordedAt)}</span>
          <span className="small muted">
            {phoneDelivered
              ? [c.phone.signedBy && `Signed by ${c.phone.signedBy}`, proof].filter(Boolean).join(" · ")
              : reasonLabel(c.phone.issue)}
          </span>
        </div>
        <div className="dr-side">
          <span className="label">From dispatch</span>
          <b className="dr-side-what">
            {officeMoved ? `Moved to ${day(c.server.toDate).split(",")[0]}` : "Already delivered"}
          </b>
          <span className="mono small">{time(c.server.changedAt)}</span>
          <span className="small muted">
            {officeMoved
              ? c.server.reason || `Changed by ${c.server.changedBy}`
              : "The office has a delivery record"}
          </span>
        </div>
        <div className="dr-versus-foot small">
          <Icon d={icon.lock} size={16} /> Nothing was overwritten. Pick what's true.
        </div>
      </div>

      {phoneDelivered && (c.phone.photo || c.phone.signature) && (
        <div className="dr-proof-card">
          {c.phone.photo ? (
            <img src={c.phone.photo} alt="Delivery photo" />
          ) : (
            <img src={c.phone.signature} alt="Signature" className="sig" />
          )}
          <div className="col" style={{ gap: 2 }}>
            <span className="small muted">Proof that goes with your answer</span>
            <b>{proof}</b>
          </div>
        </div>
      )}

      {!online && (
        <div className="notice cold small">
          Your answer needs signal to reach the office. Both versions stay safe until then.
        </div>
      )}

      {phoneDelivered ? (
        <>
          <button className="btn big block" disabled={!online} onClick={() => onResolve(c, "phone")}>
            It was delivered, send my proof
          </button>
          <button
            className="btn secondary big block"
            disabled={!online}
            onClick={() => onResolve(c, "server")}
          >
            {officeMoved
              ? `Dispatch is right, keep it for ${day(c.server.toDate).split(",")[0]}`
              : "Dispatch is right"}
          </button>
        </>
      ) : (
        <>
          <button className="btn big block" disabled={!online} onClick={() => onResolve(c, "phone")}>
            It was not delivered, send my report
          </button>
          <button
            className="btn secondary big block"
            disabled={!online}
            onClick={() => onResolve(c, "server")}
          >
            The office is right, it was delivered
          </button>
        </>
      )}
    </div>
  );
}

export default function DR6SyncReconcile() {
  const { online, last } = useDriver();
  const { data, loading, error, reload } = useApi(`/sync/conflicts?runId=${RUN}&status=open`, [
    "sync.conflict",
    "sync.resolved",
  ]);
  const [toast, show] = useToast();
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  const resolve = async (c, choice) => {
    try {
      await api.post("/sync/resolve", { conflictId: c.id, choice, by: DRIVER });
      show(
        choice === "phone"
          ? c.phone.status === "failed"
            ? `Marked not delivered. Dispatch and ${c.outletName} were told.`
            : `Your delivery stands. Dispatch and ${c.outletName} were told.`
          : "Kept the office version. Your record is kept in the log."
      );
      reload();
    } catch (err) {
      show(`Not sent yet: ${err.message}. Both versions are still safe.`);
    }
  };

  return (
    <>
      {online && last && (
        <div className="dr-bar on" role="status">
          <Icon d={icon.sync} />
          <div className="col fill" style={{ gap: 2 }}>
            <b>Back online {time(last.at)}</b>
            <span className="small">
              {last.accepted.length} {last.accepted.length === 1 ? "record" : "records"} sent without any
              trouble
            </span>
          </div>
          <Icon d={icon.check} />
        </div>
      )}

      {data.length === 0 ? (
        <>
          <div className="col" style={{ gap: 4 }}>
            <span className="label">Sync</span>
            <h1 className="dr-title">Phone and office agree</h1>
          </div>
          <div className="notice ok">
            Nothing needs you. Clean records are sent by themselves; only a real disagreement comes here.
          </div>
          <Link to="/driver/route" className="btn secondary big block">
            Back to the route
          </Link>
        </>
      ) : (
        <>
          <h1 className="dr-title">
            {data.length === 1 ? "One delivery needs you" : `${data.length} deliveries need you`}
          </h1>
          {data.map((c) => (
            <Conflict key={c.id} c={c} online={online} onResolve={resolve} />
          ))}
        </>
      )}
      {toast}
    </>
  );
}
