// SM2 Place order. Owner: STORE FRONTEND.  Design: /design/SM2-PlaceOrder.jpg
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Loading, Badge, useToast } from "../../shared/ui.jsx";
import { GROUPS, ALL_ITEMS } from "./products.js";
import "./store.css";

function longDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const rest = d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return { weekday, rest };
}

function Stepper({ value, onChange }) {
  return (
    <div className={`sm-step ${value > 0 ? "on" : ""}`}>
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

export default function SM2PlaceOrder({ outletId }) {
  const [toast, show] = useToast();
  const [qty, setQty] = useState({});
  const [windowId, setWindowId] = useState("early");
  const [saving, setSaving] = useState(false);
  const [placed, setPlaced] = useState(null);

  const meta = useApi("/meta");
  const orders = useApi(`/orders?outletId=${outletId}`, ["order.placed", "delivery.recorded"]);

  // Start a fresh order when the demo switch changes outlet
  useEffect(() => {
    setQty({});
    setPlaced(null);
  }, [outletId]);

  if (meta.loading || orders.loading) return <Loading />;

  const planDate = meta.data.meta.planDate;
  const cutoff = meta.data.meta.cutoff;
  const { weekday, rest } = longDate(planDate);

  // "Last" order = the most recent delivered one for this outlet
  const lastOrder = (orders.data || [])
    .filter((o) => o.status === "delivered")
    .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate))[0];
  const lastQty = Object.fromEntries((lastOrder?.lines || []).map((l) => [l.sku, l.qty]));

  const lines = ALL_ITEMS.filter((i) => (qty[i.sku] || 0) > 0);
  const coldLines = lines.filter((i) => i.cold);
  const coldPacks = coldLines.reduce((n, i) => n + qty[i.sku], 0);
  const weight = Math.round(lines.reduce((n, i) => n + qty[i.sku] * i.kg, 0));

  const setOne = (sku, v) => setQty((q) => ({ ...q, [sku]: Math.max(0, v) }));

  async function submit() {
    setSaving(true);
    try {
      const order = await api.post("/orders", {
        outletId,
        deliveryDate: planDate,
        chilled: coldLines.length > 0,
        lines: lines.map((i) => ({ sku: i.sku, name: i.name, qty: qty[i.sku], unit: i.unit })),
      });
      setPlaced(order);
    } catch (e) {
      show(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (placed) {
    return (
      <>
        <PageHead code={`SM2 · ${outletId}`} title="Order placed" />
        <div className="notice ok">
          <b className="mono">{placed.id}</b> is booked for {weekday} {rest}. You can change it until {cutoff}{" "}
          today.
        </div>
        <div className="row">
          <Link to="/store/orders" className="btn now">
            See my orders
          </Link>
          <button
            className="btn secondary"
            onClick={() => {
              setQty({});
              setPlaced(null);
            }}
          >
            Place another
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        code={`FOR ${weekday.toUpperCase()} ${rest.toUpperCase()} · CLOSES ${cutoff}`}
        title={`Place ${weekday}'s order`}
        sub={`Orders placed after ${cutoff} go to the day after.`}
      >
        <button className="btn secondary" disabled={!lastOrder} onClick={() => setQty(lastQty)}>
          Repeat last order
        </button>
      </PageHead>

      <div className="sm-order">
        <Card className="pad-0">
          {GROUPS.map((g) => (
            <div key={g.id}>
              <div className="sm-group">
                <span className="label">{g.label}</span>
                {g.cold && <span className="cold">needs a reefer</span>}
              </div>
              {g.items.map((i) => (
                <div key={i.sku} className="sm-line">
                  <div className="fill">
                    <div className="name">{i.name}</div>
                    <div className="small muted">{i.pack}</div>
                  </div>
                  <span className="last">{lastQty[i.sku] != null ? `last: ${lastQty[i.sku]}` : ""}</span>
                  <Stepper value={qty[i.sku] || 0} onChange={(v) => setOne(i.sku, v)} />
                </div>
              ))}
            </div>
          ))}
        </Card>

        <Card title="Delivery window">
          <div className="col">
            {[
              ["early", "05:30–08:00", "before opening"],
              ["late", "08:00–10:00", ""],
            ].map(([id, label, hint]) => (
              <label key={id} className={`sm-window ${windowId === id ? "on" : ""}`}>
                <input
                  type="radio"
                  name="window"
                  checked={windowId === id}
                  onChange={() => setWindowId(id)}
                />
                <span className="mono fill">{label}</span>
                {hint && <span className="small muted">{hint}</span>}
              </label>
            ))}

            {coldLines.length > 0 && (
              <div className="notice cold small">
                Your chilled lines are guaranteed a refrigerated truck on {weekday}.
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <div className="sm-sum">
                <span className="muted">Lines</span>
                <b className="mono">{lines.length}</b>
              </div>
              <div className="sm-sum">
                <span className="muted">Chilled and frozen</span>
                <b className="mono">{coldPacks} packs</b>
              </div>
              <div className="sm-sum">
                <span className="muted">Estimated weight</span>
                <b className="mono">{weight} kg</b>
              </div>
            </div>

            <button className="btn big block" disabled={lines.length === 0 || saving} onClick={submit}>
              {saving ? "Placing…" : "Place order"}
            </button>
            <span className="small muted" style={{ textAlign: "center" }}>
              You can change it until {cutoff} today.
            </span>
          </div>
        </Card>
      </div>
      {toast}
    </>
  );
}
