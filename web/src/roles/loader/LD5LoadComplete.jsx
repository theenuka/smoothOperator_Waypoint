// LD5 Load complete: seal the truck, then hand over the manifest. Owner: LOADER FRONTEND.  Design: /design/LD5-LoadComplete.jpg
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { ErrorNote, Loading, useToast } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import "./loader.css";

const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);
const hhmm = (v) => (typeof v === "string" && v.includes("T") ? v.slice(11, 16) : null);
const dayLabel = (date) =>
  date
    ? new Date(`${date}T00:00:00Z`)
        .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
        .replace(",", "")
        .toUpperCase()
    : "";

const Tick = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--dock-green)"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export default function LD5LoadComplete() {
  const { runId } = useParams();
  const load = useApi(`/loads/${runId}`, ["load.shortfall", "load.completed"]);
  const run = useApi(`/runs/${runId}`);
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();
  if (load.loading || run.loading) return <Loading />;
  if (load.error || run.error) return <ErrorNote error={load.error || run.error} />;

  const data = load.data;
  const r = run.data;
  const sealed = data.status === "sealed";
  const sfOf = (l) => data.shortfalls.find((s) => s.orderId === l.orderId && s.sku === l.sku);
  const isDone = (l) => l.checked || Boolean(sfOf(l));
  const left = data.lines.filter((l) => !isDone(l)).length;
  const stopsLoaded = r.stops.filter((s) =>
    data.lines.filter((l) => l.orderId === s.orderId).every(isDone)
  ).length;
  const outletOf = (orderId) => r.stops.find((s) => s.orderId === orderId)?.outletName;
  const vt = typeof r.vehicle === "object" ? (r.vehicle?.type ?? r.vehicle?.kind ?? "") : "";
  const departs = hhmm(r.departs ?? r.departAt ?? r.departure);
  const driverFirst = r.driver ? r.driver.split(" ")[0] : "the driver";

  const seal = async () => {
    setBusy(true);
    try {
      await api.post(`/loads/${runId}/complete`);
      load.reload();
    } catch (e) {
      show(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ld-done">
      <h1 className="ld-done-title">
        {sealed ? (
          <>
            <Tick /> {r.vehicleId} is loaded and sealed
          </>
        ) : (
          <>Ready to seal {r.vehicleId}</>
        )}
      </h1>

      {!sealed && left > 0 && (
        <div className="notice" style={{ maxWidth: 620, width: "100%" }}>
          {left} line{left === 1 ? " is" : "s are"} not checked yet.{" "}
          <Link to={`/loader/run/${runId}`} style={{ fontWeight: 700 }}>
            Back to the load plan
          </Link>
        </div>
      )}

      <div className="ld-receipt">
        <div className="ld-rcpt-head">
          <span className="mono small">
            Load manifest · {dayLabel(r.date)} · {sealed ? time(data.sealedAt) : "not sealed"}
          </span>
          <b className="ld-rcpt-logo">Waypoint</b>
        </div>
        <Row label="Vehicle">
          {r.vehicleId}
          {vt ? ` · ${vt.toLowerCase()}` : ""} · Bay {r.bay}
        </Row>
        <Row label="Stops">
          {stopsLoaded} of {r.stops.length}, loaded last stop first
        </Row>
        <Row label="Items">
          {sum(data.lines, "loaded")} of {sum(data.lines, "planned")}
        </Row>
        <Row label="Short">
          {data.shortfalls.length === 0
            ? "None"
            : data.shortfalls.map((s) => (
                <div key={s.id ?? `${s.orderId}-${s.sku}`}>
                  {Math.max(s.planned - s.loaded, 0)} × {s.name} ({s.sku}) ·{" "}
                  {outletOf(s.orderId) || s.orderId}
                  {s.at ? ` · flagged ${time(s.at)}` : ""}
                </div>
              ))}
        </Row>
        {(data.seal ?? data.sealNo) && <Row label="Seal">{data.seal ?? data.sealNo}</Row>}
        <Row label="Loaded by">{data.sealedBy ?? "Ruwan Jayasinghe"}</Row>
        <Row label="Driver">
          {r.driver}
          {departs ? ` · departs ${departs}` : ""}
        </Row>
        <div className="ld-rcpt-foot small">
          {sealed
            ? "Dispatch has been told the truck is sealed."
            : "Sealing tells dispatch this truck is ready."}
        </div>
      </div>

      {sealed ? (
        <div className="ld-done-actions">
          <Link className="btn secondary ld-cancel" to="/loader/history">
            History
          </Link>
          <Link className="btn now ld-confirm fill" to="/loader/home">
            Hand keys to {driverFirst} →
          </Link>
        </div>
      ) : (
        <div className="ld-done-actions">
          <Link className="btn secondary ld-cancel" to={`/loader/run/${runId}`}>
            Back
          </Link>
          <button className="btn now ld-confirm fill" disabled={busy} onClick={seal}>
            Seal truck and release
          </button>
        </div>
      )}
      {toast}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="ld-rcpt-row">
      <span className="ld-rcpt-label">{label}</span>
      <span className="ld-rcpt-val">{children}</span>
    </div>
  );
}
