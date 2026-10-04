// LD3 Item check: scan list for one stop. Tap a line (or arrive from LD2) and a big counter opens for it.
// Design: docs/design/LD3-ItemCheck.jpg
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { ErrorNote, Loading, useToast } from "../../shared/ui.jsx";
import "./loader.css";

const REASON_NOTE = {
  short_on_dock: "not on the dock",
  damaged: "damaged",
  wrong_item: "wrong item",
  never_arrived: "never arrived",
};
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);

const Tick = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);
const ScanIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4M3 12h18" />
  </svg>
);

/** Big counter for one line. Remounts (key = sku) so the count resets per line. */
function CounterSheet({ line, runId, onClose, onSaved }) {
  const nav = useNavigate();
  const [toast, show] = useToast();
  const [count, setCount] = useState(line.checked ? line.loaded : line.planned);
  const [busy, setBusy] = useState(false);
  const keys = useRef({});
  const planned = line.planned;
  const missing = planned - count;

  const step = (d) => setCount((c) => Math.min(planned, Math.max(0, c + d)));
  const confirm = async () => {
    if (busy) return;
    if (missing > 0) {
      // Less than planned: flag it instead. LD4 saves the shortfall.
      nav(`/loader/run/${runId}/short/${line.orderId}/${line.sku}`, { state: { loaded: count } });
      return;
    }
    setBusy(true);
    try {
      await api.post(`/loads/${runId}/check`, { orderId: line.orderId, sku: line.sku, loaded: count });
      onSaved(line);
    } catch (e) {
      show(e.message);
      setBusy(false);
    }
  };

  // Keyboard: - and + change the count, Enter confirms, Esc closes.
  keys.current = { step, confirm, onClose };
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (e.key === "-" || e.key === "_") keys.current.step(-1);
      else if (e.key === "+" || e.key === "=") keys.current.step(1);
      else if (e.key === "Escape") keys.current.onClose();
      else if (e.key === "Enter" && !e.target.closest?.("button, a")) keys.current.confirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ld-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ld-sheet" role="dialog" aria-label={`Check ${line.name}`}>
        <div className="col" style={{ gap: 4 }}>
          <span className="label">Item check · {line.sku}</span>
          <h2 className="ld-item-name">{line.name}</h2>
        </div>

        <div className="ld-counter">
          <button
            className="btn secondary ld-step"
            aria-label="One less"
            disabled={count <= 0}
            onClick={() => step(-1)}
          >
            −
          </button>
          <div className="col" style={{ alignItems: "center", gap: 2 }}>
            <span className={`stencil ld-count-n${missing > 0 ? " short" : ""}`}>{count}</span>
            <span className="mono ld-count-of">of {planned} planned</span>
          </div>
          <button
            className="btn secondary ld-step"
            aria-label="One more"
            disabled={count >= planned}
            onClick={() => step(1)}
          >
            +
          </button>
        </div>

        <button
          className={`btn ld-confirm block ${missing > 0 ? "danger" : "now"}`}
          disabled={busy}
          onClick={confirm}
        >
          {missing > 0 ? `Loaded ${count} of ${planned}: flag ${missing} short` : "All loaded"}
        </button>
        <div className="row between wrap">
          <button className="btn ghost big" onClick={onClose}>
            Close
          </button>
          <span className="muted small">Keys: − and + change the count, Enter confirms, Esc closes</span>
        </div>
        {toast}
      </div>
    </div>
  );
}

export default function LD3ItemCheck() {
  const { runId, orderId, sku } = useParams();
  const nav = useNavigate();
  const load = useApi(`/loads/${runId}`, ["load.shortfall", "load.completed"]);
  const run = useApi(`/runs/${runId}`);
  const [open, setOpen] = useState(true);
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState("");
  const [toast, show] = useToast();
  useEffect(() => setOpen(true), [orderId, sku]);

  if (load.loading || run.loading) return <Loading />;
  if (load.error || run.error) return <ErrorNote error={load.error || run.error} />;

  const back = `/loader/run/${runId}`;
  const lines = load.data.lines;
  const shortfalls = load.data.shortfalls;
  const sfOf = (l) => shortfalls.find((s) => s.orderId === l.orderId && s.sku === l.sku);
  const isDone = (l) => l.checked || Boolean(sfOf(l));

  const stops = [...run.data.stops].sort((a, b) => b.seq - a.seq);
  const idx = stops.findIndex((s) => s.orderId === orderId);
  const stop = stops[idx];
  if (!stop)
    return (
      <div className="stack">
        <div className="notice bad">That stop is not on this truck ({orderId}).</div>
        <Link className="btn secondary big" to={back}>
          Back to load plan
        </Link>
      </div>
    );

  const stopLines = lines.filter((l) => l.orderId === orderId);
  const active = stopLines.find((l) => l.sku === sku);
  const left = stopLines.filter((l) => !isDone(l)).length;
  const lineUrl = (l) => `/loader/run/${runId}/check/${l.orderId}/${l.sku}`;

  const lastKey = `ld-last-scan-${runId}`;
  let last = null;
  try {
    last = JSON.parse(sessionStorage.getItem(lastKey) || "null");
  } catch {
    last = null;
  }
  const remember = (l) => {
    try {
      sessionStorage.setItem(lastKey, JSON.stringify({ name: l.name, at: Date.now() }));
    } catch {
      /* storage can be blocked, everything else still works */
    }
  };

  const pick = (l) => {
    if (l.sku !== sku) nav(lineUrl(l), { replace: true });
    setOpen(true);
  };

  const saved = (l) => {
    remember(l);
    load.reload();
    // Roll straight on to the next line of this stop; close the counter when none is left.
    const next = stopLines.find((x) => x.sku !== l.sku && !isDone(x));
    if (next) pick(next);
    else setOpen(false);
  };

  // Fake scanner: type or paste a SKU, press Enter, jump to that line (any stop).
  const submit = (e) => {
    e.preventDefault();
    const c = code.trim().toLowerCase();
    if (!c) return;
    const hit = lines
      .filter((l) => l.sku.toLowerCase() === c || l.sku.toLowerCase() === `sku-${c}`)
      .sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || b.stopSeq - a.stopSeq)[0];
    if (!hit) {
      show(`No line with code ${code.trim()} on this truck`);
      return;
    }
    remember(hit);
    setCode("");
    nav(lineUrl(hit));
  };

  return (
    <>
      <div className="col" style={{ gap: 6 }}>
        <Link className="muted" to={back} style={{ textDecoration: "none" }}>
          ← {run.data.vehicleId} load plan
        </Link>
        <div className="ld-flag-head">
          <div className="col" style={{ gap: 6 }}>
            <span className="label">
              Stop {stop.seq} of {stops.length} · Loading {ordinal(idx + 1)}
            </span>
            <h1 className="ld-item-name">
              {stop.outletId} {stop.outletName}
            </h1>
            <span className="muted">Scan each carton as it goes onto the truck.</span>
          </div>
          <div className="col" style={{ gap: 2, alignItems: "flex-end" }}>
            <span className="ld-sign-count">
              {sum(stopLines, "loaded")}
              <small>/{sum(stopLines, "planned")}</small>
            </span>
            <span className="muted small">items scanned</span>
          </div>
        </div>
      </div>

      {last && (
        <div className="ld-last">
          <ScanIcon />
          <div className="col" style={{ gap: 0 }}>
            <span className="muted small">Last scan · {new Date(last.at).toLocaleTimeString("en-GB")}</span>
            <b>{last.name}</b>
          </div>
        </div>
      )}

      <section className="ld-stop">
        {stopLines.map((l, i) => {
          const sf = sfOf(l);
          const state = sf ? "short" : l.checked ? "done" : "todo";
          const fill = l.planned ? Math.min(100, (l.loaded / l.planned) * 100) : 0;
          return (
            <div
              key={l.sku}
              className={`ld-line ${state}${l.sku === sku ? " active" : ""}`}
              style={i === 0 ? { borderTop: 0 } : undefined}
            >
              <div className="col" style={{ gap: 2 }}>
                <b className="ld-line-name">{l.name}</b>
                <span className="mono small muted">{l.sku}</span>
              </div>
              <div className="col" style={{ gap: 8 }}>
                <div className="row between">
                  <span className="mono ld-nums">
                    <b className="ld-n">{l.loaded}</b> / {l.planned}
                  </span>
                  {sf && (
                    <span className="ld-note">
                      {Math.max((sf.planned ?? l.planned) - sf.loaded, 0)}{" "}
                      {REASON_NOTE[sf.reason] || sf.reason}
                    </span>
                  )}
                </div>
                <div className="ld-bar">
                  <i style={{ width: `${fill}%` }} />
                </div>
              </div>
              <div className="ld-act">
                {state === "done" && (
                  <button
                    className="ld-tick"
                    aria-label={`Change count for ${l.name}`}
                    onClick={() => pick(l)}
                  >
                    <Tick />
                    <span className="ld-tick-edit">Edit</span>
                  </button>
                )}
                {state === "short" && (
                  <button className="btn secondary ld-act-btn" onClick={() => pick(l)}>
                    Recount
                  </button>
                )}
                {state === "todo" && (
                  <>
                    <button className="btn secondary ld-act-btn" onClick={() => pick(l)}>
                      Check
                    </button>
                    <Link
                      className="btn now ld-act-btn"
                      to={`/loader/run/${runId}/short/${l.orderId}/${l.sku}`}
                    >
                      Flag short
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <div className="ld-foot">
        {typing ? (
          <form className="ld-scan" onSubmit={submit}>
            <input
              className="input"
              autoFocus
              autoCapitalize="characters"
              placeholder="Type or paste a SKU, then Enter"
              aria-label="SKU code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setTyping(false)}
            />
            <button className="btn now big" type="submit">
              Open
            </button>
          </form>
        ) : (
          <button className="btn secondary ld-type" onClick={() => setTyping(true)}>
            <ScanIcon /> Type a code
          </button>
        )}
        {left === 0 ? (
          <Link className="btn now ld-confirm" style={{ padding: "0 36px" }} to={back}>
            Stop done. Back to load plan →
          </Link>
        ) : (
          <span className="muted ld-foot-note">
            {left} line{left === 1 ? "" : "s"} left on this stop. Short? Flag it and keep loading.
          </span>
        )}
      </div>

      {open && active && (
        <CounterSheet
          key={`${orderId}-${sku}`}
          line={active}
          runId={runId}
          onClose={() => setOpen(false)}
          onSaved={saved}
        />
      )}
      {toast}
    </>
  );
}
