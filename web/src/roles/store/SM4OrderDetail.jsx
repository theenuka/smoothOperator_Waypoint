// SM4 Order detail: the journey of one order. Owner: STORE FRONTEND.  Design: /design/SM4-OrderDetail.jpg
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, ErrorNote } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { ALL_ITEMS } from "./products.js";
import "./store.css";

const LIVE = [
  "order.placed",
  "deferral.decided",
  "load.shortfall",
  "load.completed",
  "delivery.recorded",
  "sync.resolved",
];
const BY_SKU = Object.fromEntries(ALL_ITEMS.map((i) => [i.sku, i]));
const stamp = (iso) => (iso ? `${day(iso)} · ${time(iso)}` : "");

export default function SM4OrderDetail({ outletId }) {
  const { id } = useParams();
  const meta = useApi("/meta");
  const order = useApi(`/orders/${id}`, LIVE);
  const o = order.data;

  const runs = useApi(o ? `/runs?date=${o.deliveryDate}` : null, LIVE);
  const run = (runs.data || []).find((r) => r.stops.some((s) => s.orderId === id));
  // Finished runs have no dock sheet in the seed, so only ask while a run is still open
  const loads = useApi(run && run.status !== "done" ? `/loads/${run.id}` : null, LIVE);

  if (order.error) return <ErrorNote error={order.error} />;
  if (order.loading || meta.loading || (o && runs.loading)) return <Loading />;

  const demoDate = meta.data.meta.demoDate;
  const delivery = (o.deliveries || []).find((d) => d.status === "delivered");
  const deferral =
    o.status === "deferred" ? [...(o.deferrals || [])].reverse().find((d) => !d.reversed) : null;
  const stop = run?.stops.find((s) => s.orderId === id);
  const load = loads.data;
  const myLines = (load?.lines || []).filter((l) => l.orderId === id);
  const planned = myLines.reduce((n, l) => n + l.planned, 0);
  const loaded = myLines.reduce((n, l) => n + l.loaded, 0);
  const arrived = !!delivery;
  const departed = !!run?.departedAt;
  const isLoaded = load?.status === "sealed" || departed || arrived;
  const checkNow = arrived && o.deliveryDate === demoDate;

  // ---- timeline ----
  const steps = [
    {
      when: stamp(o.placedAt),
      title: "You placed the order",
      sub: `${o.lines.length} lines`,
      state: "done",
    },
  ];
  if (deferral) {
    steps.push({
      when: stamp(deferral.at),
      title: `Moved to ${day(deferral.toDate)}`,
      sub: deferral.reason,
      state: "bad",
    });
  } else {
    steps.push(
      {
        when: "",
        title: run ? `Planned onto ${run.vehicleId}` : "Planned onto a truck",
        sub: run
          ? `${run.vehicle?.type === "reefer" ? "Refrigerated truck" : "Dry truck"}, stop ${stop.seq} of ${run.stops.length}`
          : "Dispatch plans this after the cutoff",
        state: run ? "done" : "todo",
      },
      {
        when: "",
        title: run ? `Loaded at Bay ${run.bay}` : "Loaded at the depot",
        sub: planned
          ? `${loaded} of ${planned} packs loaded`
          : isLoaded
            ? "Loaded and checked"
            : "Not loaded yet",
        state: isLoaded ? "done" : "todo",
      },
      {
        when: stamp(run?.departedAt),
        title: "Left the depot",
        sub: run?.driver ? `${run.driver} driving` : "Driver not set yet",
        state: departed ? "done" : "todo",
      },
      {
        when: stamp(delivery?.recordedAt),
        title: "Arrived at your outlet",
        sub: delivery?.signedBy
          ? `Handover signed by ${delivery.signedBy}`
          : stop
            ? `Expected around ${stop.eta}`
            : "On its way soon",
        state: arrived ? "done" : "todo",
      }
    );
    if (checkNow) {
      steps.push({
        when: "Now",
        title: "Your check",
        sub: "Compare what arrived with what you ordered",
        state: "now",
      });
    } else {
      const next = steps.find((s) => s.state === "todo");
      if (next) next.state = "now";
    }
  }

  const shortBy = Object.fromEntries((o.shortfalls || []).map((s) => [s.sku, s.planned - s.loaded]));
  const packs = o.lines.reduce((n, l) => n + l.qty, 0);
  const long = new Date(o.deliveryDate + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PageHead code={`${o.id} · ${long.toUpperCase()}`} title="Your order's journey">
        {checkNow && (
          <Link to="/store/receive" className="btn big">
            Check what arrived →
          </Link>
        )}
      </PageHead>

      {(o.shortfalls || []).map((s) => (
        <div key={s.id} className="notice bad">
          <b>
            {s.loaded} of {s.planned} {s.name} loaded.
          </b>{" "}
          The other {s.planned - s.loaded} come on the next delivery.
        </div>
      ))}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="card">
          <ol className="sm-tl">
            {steps.map((s, i) => (
              <li key={i} className={s.state}>
                <span className="when">{s.when}</span>
                <span className="pin">
                  <i />
                </span>
                <div>
                  <b>{s.title}</b>
                  <div className="small muted">{s.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Card className="pad-0">
          <div
            className="row between"
            style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}
          >
            <h2 className="h-sec">What you ordered</h2>
            <span className="small muted mono">
              {packs} packs · {o.kg} kg
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th className="label">Item</th>
                <th className="label">Pack</th>
                <th className="label" style={{ textAlign: "right" }}>
                  Qty
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {o.lines.map((l) => {
                const p = BY_SKU[l.sku];
                return (
                  <tr key={l.sku}>
                    <td>
                      <b>{p ? p.name : l.name}</b>
                    </td>
                    <td className="muted">{p ? p.pack : l.unit}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {l.qty}
                    </td>
                    <td style={{ width: 90 }}>
                      {shortBy[l.sku] > 0 ? (
                        <Badge tone="bad">{shortBy[l.sku]} short</Badge>
                      ) : p?.cold ? (
                        <span style={{ color: "var(--blue)" }} title="Chilled">
                          ❄
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
