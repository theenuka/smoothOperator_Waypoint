// DR4 Issue at stop. Owner: DRIVER FRONTEND.  Design: /design/DR4-IssueAtStop.jpg
// The driver taps one reason, says what happens to the goods, and drives on.
// Saved through addRecord(), so it works with no signal and sends by itself later.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { addRecord, useDriver, RUN } from "./outbox.js";
import { Icon, icon } from "./icons.jsx";
import { REASONS } from "./reasons.js";
import "./driver.css";

export default function DR4IssueAtStop() {
  const { seq } = useParams();
  const nav = useNavigate();
  const { online } = useDriver();
  const { data, loading, error } = useApi(`/runs/${RUN}`, ["deferral.decided"]);
  const [issue, setIssue] = useState(null);
  const [goods, setGoods] = useState("retry");
  const [waited, setWaited] = useState(0);
  const [note, setNote] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const s = data.stops.find((x) => String(x.seq) === seq);
  if (!s) return <ErrorNote error={{ message: `There is no stop ${seq} on today's route.` }} />;

  const lastStop = data.stops[data.stops.length - 1];
  const needsNote = issue === "other";
  const canSend = issue && (!needsNote || note.trim());

  const send = () => {
    addRecord({
      stopSeq: s.seq,
      orderId: s.orderId,
      outletId: s.outletId,
      status: "failed",
      issue,
      note: note.trim(),
      goods, // "retry" = try again on the way back, "return" = take back to the depot
      waitedMinutes: waited,
    });
    nav("/driver/route");
  };

  return (
    <>
      <Link to={`/driver/stop/${s.seq}`} className="dr-back">
        ← Stop {s.seq}
      </Link>
      <div className="col" style={{ gap: 6 }}>
        <span className="label">
          Stop {s.seq} of {data.stops.length} · {s.outletId} {s.outletName} · {time(new Date().toISOString())}
        </span>
        <h1 className="dr-title">What's stopping this delivery?</h1>
      </div>

      <div className="col" style={{ gap: 10 }} role="group" aria-label="What is the problem">
        {REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="dr-option"
            aria-pressed={issue === r.id}
            onClick={() => setIssue(r.id)}
          >
            <Icon d={r.icon} />
            {r.label}
            {issue === r.id && (
              <span className="dr-check">
                <Icon d={icon.check} />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="dr-waited">
        <span className="fill">
          Waited <b className="mono">{waited} min</b>
        </span>
        <button
          type="button"
          className="btn secondary"
          aria-label="Waited 5 minutes less"
          disabled={waited === 0}
          onClick={() => setWaited(Math.max(0, waited - 5))}
        >
          −
        </button>
        <button
          type="button"
          className="btn secondary"
          aria-label="Waited 5 minutes more"
          onClick={() => setWaited(waited + 5)}
        >
          +
        </button>
      </div>

      <label className="field">
        <span className="label">{needsNote ? "What happened (needed)" : "Note for dispatch (optional)"}</span>
        <textarea
          className="textarea"
          placeholder="For example: called the manager twice, no answer"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="col" style={{ gap: 8 }}>
        <span className="label">What happens to the goods</span>
        <div className="dr-choices" role="group" aria-label="What happens to the goods">
          <button
            type="button"
            className="dr-choice"
            aria-pressed={goods === "retry"}
            onClick={() => setGoods("retry")}
          >
            <b>Try again on the way back</b>
            <span className="small muted">After {lastStop.outletName}</span>
          </button>
          <button
            type="button"
            className="dr-choice"
            aria-pressed={goods === "return"}
            onClick={() => setGoods("return")}
          >
            <b>Return to depot</b>
            <span className="small muted">Dispatch plans a new delivery</span>
          </button>
        </div>
      </div>

      <div className={`notice ${online ? "ok" : "cold"} small`}>
        {online
          ? "Dispatch and the store are told straight away."
          : "No signal: this is saved on the phone and sent by itself when signal returns."}
      </div>

      <button className="btn big block" disabled={!canSend} onClick={send}>
        {issue ? "Tell dispatch and drive on" : "Pick what's stopping the delivery"}
      </button>
    </>
  );
}
