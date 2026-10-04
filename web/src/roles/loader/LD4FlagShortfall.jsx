// LD4 Flag shortfall (degradation scenario 1).  Design: docs/design/LD4-FlagShortfall.jpg
// The truck still leaves; the store, driver and dispatch are told at once.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { ErrorNote, Loading, useToast } from "../../shared/ui.jsx";
import "./loader.css";

const REASONS = [
  ["short_on_dock", "Short on the dock", "Fewer cartons than the plan"],
  ["damaged", "Damaged", "Crushed, wet or opened"],
  ["wrong_item", "Wrong item", "Label doesn't match the plan"],
  ["never_arrived", "Never arrived", "Supplier didn't deliver it"],
];

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function LD4FlagShortfall() {
  const { runId, orderId, sku } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const load = useApi(`/loads/${runId}`);
  const run = useApi(`/runs/${runId}`);
  const [loaded, setLoaded] = useState(loc.state?.loaded ?? null); // LD3 sends the count it had
  const [reason, setReason] = useState("short_on_dock");
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();
  const keys = useRef({});

  const back = `/loader/run/${runId}`;
  const line = load.data?.lines.find((l) => l.orderId === orderId && l.sku === sku);
  const flagged = Boolean(load.data?.shortfalls.some((s) => s.orderId === orderId && s.sku === sku));
  const stop = run.data?.stops.find((s) => s.orderId === orderId);
  const planned = line?.planned ?? 0;
  const maxN = Math.max(planned - 1, 0); // a shortfall means at least one is missing
  const n = Math.min(loaded ?? maxN, maxN);
  const missing = planned - n;

  const step = (d) => setLoaded(Math.min(maxN, Math.max(0, n + d)));

  const send = async () => {
    if (!line || busy || flagged || planned < 1) return;
    setBusy(true);
    try {
      await api.post(`/loads/${runId}/shortfall`, {
        orderId,
        sku,
        loaded: n,
        reason,
        by: "Ruwan Jayasinghe",
      });
      nav(back);
    } catch (e) {
      show(e.message);
      setBusy(false);
    }
  };

  // Keyboard: - and + change the count, 1-4 pick a reason, Enter flags it.
  keys.current = { step, send };
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (e.key === "-" || e.key === "_") keys.current.step(-1);
      else if (e.key === "+" || e.key === "=") keys.current.step(1);
      else if (/^[1-4]$/.test(e.key)) setReason(REASONS[Number(e.key) - 1][0]);
      else if (e.key === "Enter" && !e.target.closest?.("button, a")) keys.current.send();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (load.loading || run.loading) return <Loading />;
  if (load.error || run.error) return <ErrorNote error={load.error || run.error} />;
  if (!line)
    return (
      <div className="stack">
        <div className="notice bad">
          That line is not on this truck ({orderId} · {sku}).
        </div>
        <Link className="btn secondary big" to={back}>
          Back to load plan
        </Link>
      </div>
    );

  const outlet = stop ? `${stop.outletId} ${stop.outletName}` : orderId;
  const driver = run.data.driver ? run.data.driver.split(" ")[0] : "Driver";

  const hears = [
    { who: "Dispatch", init: "DP", what: "Shown on the overview straight away" },
    {
      who: `${outlet}, store manager`,
      init: initials(stop?.outletName || "Store"),
      what: `Told before the truck leaves: ${n} arrive today, ${missing} on the next order`,
    },
    {
      who: `${driver}, driver`,
      init: initials(run.data.driver),
      what: "Printed on the proof of delivery, so nobody argues at the door",
    },
  ];

  return (
    <>
      <div className="hazard" style={{ height: 10 }} />

      <div className="ld-flag-head">
        <div className="col" style={{ gap: 6 }}>
          <span className="label">
            Stop {line.stopSeq} · {outlet} · {sku}
          </span>
          <h1 className="ld-item-name">{line.name}</h1>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
          <span className="ld-sign-count" style={{ color: "var(--dock-red)" }}>
            {n}
            <small>/{planned}</small>
          </span>
          <span className="muted small">going on the truck</span>
        </div>
      </div>

      {flagged && (
        <div className="notice">This line is already flagged. Go back to the load plan to keep loading.</div>
      )}

      <div className="ld-flag-grid">
        <div className="col" style={{ gap: 14 }}>
          <h2 className="h-sec">What's wrong?</h2>
          <div className="ld-reasons">
            <span className="ld-badge-n">1</span>
            {REASONS.map(([k, label, hint]) => (
              <button
                key={k}
                type="button"
                aria-pressed={reason === k}
                className="ld-reason"
                onClick={() => setReason(k)}
              >
                <b>{label}</b>
                <span>{hint}</span>
              </button>
            ))}
          </div>

          <div className="row between">
            <span className="muted">Loading</span>
            <div className="ld-stepper">
              <button
                className="btn secondary"
                aria-label="One less"
                disabled={n <= 0}
                onClick={() => step(-1)}
              >
                −
              </button>
              <span className="mono ld-stepper-n">
                {n} of {planned}
              </span>
              <button
                className="btn secondary"
                aria-label="One more"
                disabled={n >= maxN}
                onClick={() => step(1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <h2 className="h-sec">Who hears about it</h2>
          <div className="ld-hears">
            <span className="ld-badge-n">2</span>
            {hears.map((h) => (
              <div className="ld-hear" key={h.who}>
                <span className="ld-avatar">{h.init}</span>
                <div className="col" style={{ gap: 0 }}>
                  <b>{h.who}</b>
                  <span className="muted small">{h.what}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="muted small">
            The {missing} missing {missing === 1 ? "unit is" : "units are"} added to{" "}
            {stop?.outletName || "the store"}'s next order automatically.
          </span>
        </div>
      </div>

      <div className="ld-flag-foot">
        <Link className="btn secondary ld-cancel" to={back}>
          Cancel
        </Link>
        <div className="ld-confirm-wrap">
          <span className="ld-badge-n">3</span>
          <button
            className="btn now ld-confirm block"
            disabled={busy || flagged || planned < 1}
            onClick={send}
          >
            Flag {missing} short and keep loading
          </button>
        </div>
      </div>
      <span className="muted small">Keys: − and + change the count, 1–4 pick the reason, Enter flags it</span>
      {toast}
    </>
  );
}
