// LD4 Flag shortfall (degradation scenario 1). Owner: LOADER FRONTEND.  Design: /design/LD4-FlagShortfall.jpg
// WORKING BASELINE. The truck still leaves; the store, driver and dispatcher are told at once.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, Loading } from "../../shared/ui.jsx";

const REASONS = [
  ["short_on_dock", "Not enough on the dock"],
  ["damaged", "Damaged"],
  ["wrong_item", "Wrong item"],
  ["never_arrived", "Never arrived from supplier"],
];

export default function LD4FlagShortfall() {
  const { runId, orderId, sku } = useParams();
  const nav = useNavigate();
  const load = useApi(`/loads/${runId}`);
  const [loaded, setLoaded] = useState(null);
  const [reason, setReason] = useState("short_on_dock");
  const [busy, setBusy] = useState(false);
  if (load.loading) return <Loading />;
  const line = load.data.lines.find((l) => l.orderId === orderId && l.sku === sku);
  const n = loaded ?? Math.max(0, line.planned - 1);

  const send = async () => {
    setBusy(true);
    await api.post(`/loads/${runId}/shortfall`, { orderId, sku, loaded: n, reason, by: "Ruwan Jayasinghe" });
    nav(`/loader/run/${runId}`);
  };

  return (
    <>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">LD4 · Flag shortfall · {orderId}</span>
        <h1 className="h-page">{line.name}</h1>
        <span className="muted">Planned {line.planned}. How many are actually going on the truck?</span>
      </div>
      <div className="grid-2">
        <Card title="Loaded count">
          <div className="row" style={{ gap: 16, justifyContent: "center" }}>
            <button
              className="btn secondary big"
              style={{ width: 80 }}
              aria-label="One less"
              onClick={() => setLoaded(Math.max(0, n - 1))}
            >
              −
            </button>
            <span
              className="stencil"
              style={{ fontSize: 96, color: "var(--yellow)", minWidth: 120, textAlign: "center" }}
            >
              {n}
            </span>
            <button
              className="btn secondary big"
              style={{ width: 80 }}
              aria-label="One more"
              onClick={() => setLoaded(Math.min(line.planned - 1, n + 1))}
            >
              +
            </button>
          </div>
          <p className="muted" style={{ textAlign: "center" }}>
            {line.planned - n} short of {line.planned}
          </p>
        </Card>
        <Card title="Why?">
          <div className="stack" style={{ gap: 8 }}>
            {REASONS.map(([k, label]) => (
              <button
                key={k}
                className={`btn big ${reason === k ? "now" : "secondary"}`}
                onClick={() => setReason(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="notice bad">
        The truck is NOT blocked. The store, the driver and dispatch see this right away, and the missing{" "}
        {line.planned - n} go on the next order.
      </div>
      <button className="btn danger big" disabled={busy} onClick={send}>
        Flag {line.planned - n} short and keep loading
      </button>
    </>
  );
}
