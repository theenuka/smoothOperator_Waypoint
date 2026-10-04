// SM6 Check what arrived.  Design: docs/design/SM6-ConfirmReceipt.jpg
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, ErrorNote, Empty, useToast } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { ALL_ITEMS } from "./products.js";
import "./store.css";

const LIVE = ["delivery.recorded", "load.shortfall", "sync.resolved"];
const BY_SKU = Object.fromEntries(ALL_ITEMS.map((i) => [i.sku, i]));

function Stepper({ value, short, onChange }) {
  return (
    <div className={`sm-step ${short ? "short" : ""}`}>
      <button type="button" aria-label="One less" disabled={value === 0} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="qty">{value}</span>
      <button type="button" aria-label="One more" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

// Draw with mouse, finger or pen. Calls onInk(true) after the first stroke.
function SignaturePad({ onInk, resetKey }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setTouched(false);
    onInk(false);
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e) => {
    const c = ref.current;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height];
  };
  const down = (e) => {
    drawing.current = true;
    ref.current.setPointerCapture(e.pointerId);
    const ctx = ref.current.getContext("2d");
    const [x, y] = pos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1b1a17";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = ref.current.getContext("2d");
    const [x, y] = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!touched) {
      setTouched(true);
      onInk(true);
    }
  };
  const up = () => (drawing.current = false);

  return (
    <div className="sm-sign">
      {!touched && <span className="label hint">Sign here</span>}
      <canvas ref={ref} width={640} height={220} onPointerDown={down} onPointerMove={move} onPointerUp={up} />
    </div>
  );
}

export default function SM6ConfirmReceipt({ outletId }) {
  const navigate = useNavigate();
  const [toast, show] = useToast();
  const [counts, setCounts] = useState({}); // sku -> counted number (only if changed)
  const [name, setName] = useState(null); // null = use the name from the driver's record
  const [signed, setSigned] = useState(false);
  const [padKey, setPadKey] = useState(0);

  const meta = useApi("/meta");
  const deliveries = useApi(`/deliveries?outletId=${outletId}`, LIVE);
  const demoDate = meta.data?.meta.demoDate;
  const delivery = (deliveries.data || []).find(
    (d) => d.status === "delivered" && d.recordedAt.slice(0, 10) === demoDate
  );
  const order = useApi(delivery ? `/orders/${delivery.orderId}` : null);
  const run = useApi(delivery ? `/runs/${delivery.runId}` : null);

  // Fresh form when the demo switch changes outlet
  useEffect(() => {
    setCounts({});
    setName(null);
    setPadKey((k) => k + 1);
  }, [outletId]);

  if (meta.loading || deliveries.loading) return <Loading />;
  if (!delivery)
    return (
      <>
        <PageHead code={`SM6 · ${outletId}`} title="Check what arrived" />
        <Empty>
          Nothing has arrived today yet. When the driver hands over, your delivery shows up here.{" "}
          <Link to="/store/orders">See your orders</Link>
        </Empty>
      </>
    );
  if (order.error) return <ErrorNote error={order.error} />;
  if (order.loading) return <Loading />;

  const o = order.data;
  const rows = o.lines.map((l) => {
    const p = BY_SKU[l.sku];
    const got = counts[l.sku] ?? l.qty;
    return { ...l, label: p?.name || l.name, pack: p?.pack || l.unit, got, diff: got - l.qty };
  });
  const shorts = rows.filter((r) => r.diff < 0);
  const diffs = rows.filter((r) => r.diff !== 0);
  const totalShort = shorts.reduce((n, r) => n - r.diff, 0);
  const matches = rows.length - diffs.length;
  const receivedBy = name ?? delivery.signedBy ?? "";

  const missingText = shorts
    .map((r) => `${-r.diff} ${r.unit}${-r.diff > 1 ? "s" : ""} of ${r.label.toLowerCase()} missing`)
    .join(", ");

  const buttonText =
    totalShort > 0
      ? `Sign and report ${totalShort} short`
      : diffs.length
        ? "Sign and report a difference"
        : "Sign and confirm";

  function submit() {
    if (diffs.length === 0) {
      show("Thanks. Everything matches what you ordered.");
      return;
    }
    // Differences become a problem report (SM7)
    navigate("/store/issue", {
      state: {
        deliveryId: delivery.id,
        orderId: o.id,
        receivedBy,
        lines: diffs.map((r) => ({
          sku: r.sku,
          name: r.label,
          unit: r.unit,
          ordered: r.qty,
          received: r.got,
        })),
      },
    });
  }

  return (
    <>
      <PageHead
        code={`${o.id} · ARRIVED ${time(delivery.recordedAt)}${run.data ? " · " + run.data.vehicleId : ""}`}
        title="Check what arrived"
        sub="Count each line against what you ordered. Anything short or damaged is reported from here, while the driver's record is fresh."
      />

      <div className="sm-order">
        <Card className="pad-0">
          <table className="table sm-recv">
            <thead>
              <tr>
                <th className="label">Item</th>
                <th className="label">Pack</th>
                <th className="label" style={{ textAlign: "right" }}>
                  Ordered
                </th>
                <th className="label">Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sku} className={r.diff !== 0 ? "hl" : ""}>
                  <td>
                    <b>{r.label}</b>
                  </td>
                  <td className="muted">{r.pack}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {r.qty}
                  </td>
                  <td>
                    <Stepper
                      value={r.got}
                      short={r.diff < 0}
                      onChange={(v) => setCounts((c) => ({ ...c, [r.sku]: v }))}
                    />
                  </td>
                  <td>
                    {r.diff === 0 && (
                      <Badge tone="ok">
                        <span className="dot" /> Matches
                      </Badge>
                    )}
                    {r.diff < 0 && <Badge tone="bad">■ {-r.diff} short</Badge>}
                    {r.diff > 0 && <Badge tone="now">{r.diff} extra</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small muted" style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            {matches} of {rows.length} lines match.{" "}
            {missingText && (
              <b style={{ color: "var(--ink)" }}>{missingText[0].toUpperCase() + missingText.slice(1)}.</b>
            )}
          </div>
        </Card>

        <Card>
          <div className="col" style={{ gap: 14 }}>
            <label className="field">
              <span className="label">Received by</span>
              <input className="input" value={receivedBy} onChange={(e) => setName(e.target.value)} />
            </label>

            <div className="field">
              <div className="row between">
                <span className="label">Signature</span>
                <button
                  className="btn ghost"
                  style={{ minHeight: 28, padding: "0 8px" }}
                  onClick={() => setPadKey((k) => k + 1)}
                >
                  Clear
                </button>
              </div>
              <SignaturePad onInk={setSigned} resetKey={padKey} />
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {totalShort > 0
                ? "Signing confirms the counts above, including what is missing. It doesn't accept the shortfall."
                : "Signing confirms the counts above."}
            </p>

            <button className="btn big block" disabled={!signed || !receivedBy.trim()} onClick={submit}>
              {buttonText}
            </button>
            <button className="btn ghost block" onClick={() => navigate("/store/today")}>
              Save and finish later
            </button>
          </div>
        </Card>
      </div>
      {toast}
    </>
  );
}
