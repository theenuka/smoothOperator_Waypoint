// SM7 Report a problem. Owner: STORE FRONTEND.  Design: /design/SM7-ReportIssue.jpg
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Loading, Empty, useToast } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { ALL_ITEMS } from "./products.js";
import "./store.css";

const BY_SKU = Object.fromEntries(ALL_ITEMS.map((i) => [i.sku, i]));
const PROBLEMS = [
  ["short", "Short"],
  ["damaged", "Damaged"],
  ["wrong_item", "Wrong item"],
  ["past_date", "Past its date"],
];
const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;

export default function SM7ReportIssue({ outletId }) {
  const navigate = useNavigate();
  const { state } = useLocation(); // filled in by SM6 when counts differ
  const [toast, show] = useToast();

  const [sku, setSku] = useState(null);
  const [problem, setProblem] = useState("short");
  const [qty, setQty] = useState(null);
  const [note, setNote] = useState("");
  const [fix, setFix] = useState("fix");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(null); // null | "saved" | "pending"

  const meta = useApi("/meta");
  const deliveries = useApi(`/deliveries?outletId=${outletId}`);
  const demoDate = meta.data?.meta.demoDate;
  const delivery =
    (deliveries.data || []).find((d) => d.id === state?.deliveryId) ||
    (deliveries.data || []).find((d) => d.status === "delivered" && d.recordedAt.slice(0, 10) === demoDate);
  const order = useApi(delivery ? `/orders/${delivery.orderId}` : null);
  const run = useApi(delivery ? `/runs/${delivery.runId}` : null);
  // Finished runs have no dock sheet in the seed, so only ask while a run is open
  const loads = useApi(run.data && run.data.status !== "done" ? `/loads/${run.data.id}` : null);

  // Fresh form when the demo switch changes outlet
  useEffect(() => {
    setSku(null);
    setQty(null);
    setNote("");
    setSent(null);
  }, [outletId]);

  if (meta.loading || deliveries.loading) return <Loading />;
  if (!delivery)
    return (
      <>
        <PageHead code={`SM7 · ${outletId}`} title="Report a problem" />
        <Empty>
          Nothing has arrived today, so there is nothing to report yet.{" "}
          <Link to="/store/orders">See your orders</Link>
        </Empty>
      </>
    );
  if (order.loading) return <Loading />;

  const o = order.data;
  const counted = state?.lines?.find((l) => l.sku === (sku ?? state?.lines?.[0]?.sku));
  const chosenSku = sku ?? state?.lines?.[0]?.sku ?? o.lines[0]?.sku;
  const line = o.lines.find((l) => l.sku === chosenSku) || o.lines[0];
  const p = BY_SKU[line.sku];
  const itemName = p?.name || line.name;
  const unit = line.unit;
  const howMany =
    qty ?? (counted && counted.ordered > counted.received ? counted.ordered - counted.received : 1);
  const isShort = problem === "short";

  const fixOptions = [
    [
      "fix",
      isShort
        ? `Add ${plural(howMany, unit)} to the next order, no charge`
        : "Replace it on the next delivery, no charge",
    ],
    ["credit", "Credit my account"],
  ];

  async function submit() {
    setSaving(true);
    try {
      await api.post("/issues", {
        outletId,
        deliveryId: delivery.id,
        sku: line.sku,
        problem,
        note,
        qty: howMany,
        fix,
        receivedBy: state?.receivedBy,
      });
      setSent("saved");
    } catch (e) {
      // POST /issues is a requested endpoint and may not be built yet
      if (String(e.message).includes("(404)")) setSent("pending");
      else show(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <>
        <PageHead code={`${o.id} · ${itemName.toUpperCase()}`} title="Report sent" />
        <div className={`notice ${sent === "saved" ? "ok" : ""}`}>
          {sent === "saved"
            ? "Dispatch can see your report now. They will get back to you about the fix you chose."
            : "The server does not accept problem reports yet (POST /issues is not built), so this report was not saved."}
        </div>
        <div className="row">
          <Link to="/store/orders" className="btn now">
            See my orders
          </Link>
          <button className="btn secondary" onClick={() => setSent(null)}>
            Back to the form
          </button>
        </div>
      </>
    );
  }

  const knows = [];
  const myLoad = (loads.data?.lines || []).find((l) => l.orderId === o.id && l.sku === line.sku);
  if (myLoad)
    knows.push({
      t: "",
      title: `Dock scan, Bay ${run.data.bay}`,
      sub: `${plural(myLoad.loaded, unit)} of ${itemName.toLowerCase()} scanned onto ${run.data.vehicleId}`,
      icon: "ok",
    });
  knows.push({
    t: time(delivery.recordedAt),
    title: "Driver handover",
    sub: `${run.data?.driver || "The driver"} recorded the handover${delivery.signedBy ? `, signed by ${delivery.signedBy}` : ""}`,
    icon: "ok",
  });
  if (counted)
    knows.push({
      t: "Now",
      title: "Your count",
      sub: `${plural(counted.received, unit)} counted`,
      icon: "flag",
    });

  return (
    <>
      <PageHead
        code={`${o.id} · ${itemName.toUpperCase()}${p ? ", " + p.pack.toUpperCase() : ""}`}
        title="Report a problem"
      />

      <div className="sm-order">
        <Card>
          <div className="col" style={{ gap: 18 }}>
            {o.lines.length > 1 && (
              <label className="field">
                <span className="label">Which item</span>
                <select
                  className="select"
                  value={line.sku}
                  onChange={(e) => {
                    setSku(e.target.value);
                    setQty(null);
                  }}
                >
                  {o.lines.map((l) => (
                    <option key={l.sku} value={l.sku}>
                      {BY_SKU[l.sku]?.name || l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="field">
              <span className="label">What happened</span>
              <div className="sm-pills">
                {PROBLEMS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={problem === id ? "on" : ""}
                    onClick={() => setProblem(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="row wrap" style={{ alignItems: "flex-end", gap: 16 }}>
              <div className="field">
                <span className="label">{isShort ? "How many missing" : "How many affected"}</span>
                <div className="sm-step">
                  <button
                    type="button"
                    aria-label="One less"
                    disabled={howMany <= 1}
                    onClick={() => setQty(howMany - 1)}
                  >
                    −
                  </button>
                  <span className="qty">{howMany}</span>
                  <button type="button" aria-label="One more" onClick={() => setQty(howMany + 1)}>
                    +
                  </button>
                </div>
              </div>
              <div className="field fill">
                <span className="label">Photo</span>
                <label className="sm-photo">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0]?.name || "")}
                  />
                  <span>{photo || "Add a photo of the shelf · optional"}</span>
                </label>
              </div>
            </div>

            <label className="field">
              <span className="label">Note for dispatch</span>
              <textarea
                className="textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you count, and where did you look?"
              />
            </label>

            <div className="field">
              <span className="label">How should we fix it</span>
              {fixOptions.map(([id, label]) => (
                <label key={id} className={`sm-window ${fix === id ? "on" : ""}`}>
                  <input type="radio" name="fix" checked={fix === id} onChange={() => setFix(id)} />
                  <b>{label}</b>
                </label>
              ))}
            </div>

            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn big" disabled={saving} onClick={submit}>
                {saving ? "Sending…" : "Send report"}
              </button>
              <button className="btn ghost big" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>
        </Card>

        <Card title="What Waypoint already knows">
          <p className="small muted" style={{ marginTop: 0 }}>
            Dispatch sees your report straight away, together with the dock and handover records below.
          </p>
          <ul className="sm-know">
            {knows.map((k, i) => (
              <li key={i}>
                <span className="t">{k.t}</span>
                <div>
                  <b>{k.title}</b>
                  <div className="small muted">{k.sub}</div>
                </div>
                <span style={{ color: k.icon === "ok" ? "var(--green)" : "var(--red)" }}>
                  {k.icon === "ok" ? "✓" : "⚑"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {toast}
    </>
  );
}
