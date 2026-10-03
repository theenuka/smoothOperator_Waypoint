// DR4 Issue at stop. Owner: DRIVER FRONTEND.  Design: /design/DR4-IssueAtStop.jpg
// The driver taps one reason, says what happens to the goods, and drives on.
// Saved through addRecord(), so it works with no signal and sends by itself later.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { addRecord, useDriver, RUN } from "./outbox.js";
import "./driver.css";

// Small line icons (24 x 24), drawn in the text colour.
const icon = {
  shutter: "M4 4h16M5 4v16h14V4M5 8h14M5 12h14M5 16h14",
  refused: "M6 6l12 12M18 6L6 18",
  damaged: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8M9 6l3 3-2 2 3 3",
  dock: "M2 7h11v9H2zM13 10h4l3 3v3h-7M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  other: "M12 3l10 18H2zM12 10v5M12 18v.5",
  check: "M5 12l5 5 9-10",
};
const Icon = ({ d }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const REASONS = [
  { id: "store_closed", label: "Shutter down, nobody to receive", icon: icon.shutter },
  { id: "refused", label: "Outlet refused the goods", icon: icon.refused },
  { id: "damaged", label: "Goods damaged on the way", icon: icon.damaged },
  { id: "cant_reach_dock", label: "Can't reach the delivery bay", icon: icon.dock },
  { id: "other", label: "Something else", icon: icon.other },
];

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
