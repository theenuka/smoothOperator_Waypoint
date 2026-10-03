// SM1 Today. Owner: STORE FRONTEND.  Design: /design/SM1-Dashboard.jpg
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, StatusBadge, Loading, ErrorNote } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import "./store.css";

const LIVE = [
  "deferral.decided",
  "load.shortfall",
  "load.completed",
  "delivery.recorded",
  "sync.resolved",
  "order.placed",
];
const STAGES = ["Placed", "Planned", "Loaded", "On the way", "Arrived", "Checked"];
const DEMO_NOW = "08:10"; // same fixed demo time as the header in the design

const dateOnly = (iso) => iso.slice(0, 10);
const longDay = (iso) =>
  new Date(dateOnly(iso) + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
const weekday = (iso) =>
  new Date(dateOnly(iso) + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" });
const mins = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export default function SM1Dashboard({ outletId }) {
  const meta = useApi("/meta");
  const orders = useApi(`/orders?outletId=${outletId}`, LIVE);
  const notices = useApi(`/notices?outletId=${outletId}`, LIVE);
  const deliveries = useApi(`/deliveries?outletId=${outletId}`, LIVE);
  const deferrals = useApi(`/deferrals?outletId=${outletId}`, LIVE);
  const demoDate = meta.data?.meta.demoDate;
  const runs = useApi(demoDate ? `/runs?date=${demoDate}` : null, LIVE);

  const err = orders.error || notices.error || meta.error;
  if (err) return <ErrorNote error={err} />;
  if (meta.loading || orders.loading || notices.loading || deliveries.loading || deferrals.loading)
    return <Loading />;
  if (demoDate && runs.loading) return <Loading />;

  const { planDate, cutoff } = meta.data.meta;
  const manager = meta.data.outlets.find((o) => o.id === outletId)?.manager || "";

  const all = orders.data || [];
  const dels = deliveries.data || [];
  const defs = (deferrals.data || []).filter((d) => !d.reversed);
  const unread = (notices.data || []).filter((n) => !n.read);
  const arrivalOf = (id) => dels.find((d) => d.orderId === id && d.status === "delivered");
  const shortNoticeOf = (o) =>
    (notices.data || []).find(
      (n) =>
        n.type === "shortfall" &&
        dateOnly(n.at) === o.deliveryDate &&
        o.lines.some((l) => n.body.includes(l.name))
    );

  // ---------- hero: today's delivery, else the next one ----------
  const live = all.filter((o) => o.status !== "deferred");
  const hero =
    live.find((o) => o.deliveryDate === demoDate) ||
    live
      .filter((o) => o.deliveryDate > demoDate)
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))[0];

  let heroCard = null;
  if (hero) {
    const run = (runs.data || []).find((r) => r.stops.some((s) => s.orderId === hero.id));
    const stop = run?.stops.find((s) => s.orderId === hero.id);
    const arrival = arrivalOf(hero.id);
    const onWay = !!run?.departedAt;
    const done = [
      true,
      !!run,
      ["loaded", "delivered"].includes(hero.status) || onWay,
      onWay,
      !!arrival,
      false, // there is no "receipt confirmed" record yet
    ];
    const active = done.indexOf(false);
    const waiting = !!arrival && hero.deliveryDate === demoDate;

    let big = day(hero.deliveryDate);
    if (arrival) big = `Arrived ${time(arrival.recordedAt)}`;
    else if (onWay && stop) big = `ETA ${stop.eta}`;
    else if (done[2]) big = "Loaded";

    const parts = run
      ? [run.vehicleId, run.driver, `${hero.lines.length} lines`]
      : [hero.chilled ? "Chilled" : "Dry", `${hero.lines.length} lines`];

    heroCard = (
      <Card>
        <div className="col" style={{ gap: 16 }}>
          <div className="row between">
            <span className="label">
              {hero.deliveryDate === demoDate ? "Today's delivery" : "Next delivery"} · {hero.id}
            </span>
            {waiting ? (
              <span className="sm-chip">■ Waiting for your check</span>
            ) : hero.chilled ? (
              <Badge tone="cold">Chilled</Badge>
            ) : (
              <Badge>Dry</Badge>
            )}
          </div>
          <div>
            <h2 className="sm-big">{big}</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {parts.join(" · ")}
            </p>
          </div>
          <div className="sm-prog">
            {STAGES.map((s, i) => {
              const state = done[i] ? "done" : i === active ? "now" : "todo";
              return (
                <Fragment key={s}>
                  {i > 0 && <span className={`line ${done[i] ? "" : "todo"}`} />}
                  <div className={`st ${state}`}>
                    <i />
                    {s}
                  </div>
                </Fragment>
              );
            })}
          </div>
          <div className="row wrap">
            {waiting && (
              <Link to="/store/receive" className="btn big">
                Check what arrived →
              </Link>
            )}
            <Link to={`/store/orders/${hero.id}`} className="btn secondary big">
              Order details
            </Link>
          </div>
        </div>
      </Card>
    );
  } else {
    heroCard = (
      <Card>
        <span className="label">Next delivery</span>
        <h2 className="sm-big" style={{ marginTop: 12 }}>
          Nothing coming
        </h2>
        <p className="muted">You have no orders on the way. Place one to get a delivery day.</p>
      </Card>
    );
  }

  // ---------- tomorrow's order ----------
  const planned = live.find((o) => o.deliveryDate === planDate);
  const left = mins(cutoff) - mins(DEMO_NOW);
  const lastWait = [...defs].sort((a, b) => b.fromDate.localeCompare(a.fromDate))[0];

  // ---------- recent orders ----------
  const recent = [...all]
    .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate) || b.id.localeCompare(a.id))
    .slice(0, 4);
  const summary = (o) => {
    const n = `${o.lines.length} lines`;
    const def = defs.find((d) => d.orderId === o.id);
    const short = shortNoticeOf(o);
    if (o.status === "deferred") return def ? `Moved to ${day(def.toDate)}` : "Moved to a later day";
    if (short) return short.title;
    const arr = arrivalOf(o.id);
    if (arr) return `Arrived ${time(arr.recordedAt)} · ${n}`;
    if (o.status === "placed") return `Placed ${time(o.placedAt)} · ${n}`;
    return `${o.status.replace("_", " ")[0].toUpperCase()}${o.status.replace("_", " ").slice(1)} · ${n}`;
  };
  const badge = (o) => {
    if (o.status === "deferred") return <Badge tone="bad">■ Deferred</Badge>;
    if (o.status === "delivered" && o.deliveryDate === demoDate) return <Badge tone="now">■ Check it</Badge>;
    if (o.status === "delivered")
      return (
        <Badge tone="ok">
          <span className="dot" /> Delivered
        </Badge>
      );
    return <StatusBadge status={o.status} />;
  };

  // ---------- last 30 days, one bar per delivery day ----------
  const since = new Date(Date.parse(demoDate) - 30 * 86400000).toISOString().slice(0, 10);
  const bars = all
    .filter((o) => o.deliveryDate >= since && o.deliveryDate <= demoDate)
    .map((o) => ({
      date: o.deliveryDate,
      kind:
        o.status === "deferred"
          ? "bad"
          : o.status === "delivered" && o.deliveryDate === demoDate
            ? "now"
            : "ok",
    }));
  // A deferral whose order is not in this list still happened
  defs
    .filter((d) => d.fromDate >= since && !all.some((o) => o.id === d.orderId))
    .forEach((d) => bars.push({ date: d.fromDate, kind: "bad" }));
  bars.sort((a, b) => a.date.localeCompare(b.date));
  const count = (k) => bars.filter((b) => b.kind === k).length;

  return (
    <>
      <PageHead code={longDay(demoDate).toUpperCase()} title={`Good morning, ${manager}`} />

      {unread[0] && (
        <Link
          to="/store/notices"
          className={`notice ${unread[0].type === "shortfall" ? "bad" : ""}`}
          style={{ textDecoration: "none", display: "block" }}
        >
          <b>{unread[0].title}</b>
          <span className="small"> · open notice{unread.length > 1 ? ` (${unread.length} unread)` : ""}</span>
        </Link>
      )}

      <div className="sm-home">
        {heroCard}

        <Card>
          <div className="col" style={{ gap: 14 }}>
            <span className="label">{weekday(planDate)}'s order</span>
            {planned ? (
              <>
                <h2 className="sm-big" style={{ fontSize: 44 }}>
                  Placed {time(planned.placedAt)}
                </h2>
                <p className="muted" style={{ margin: 0 }}>
                  <span className="mono">{planned.id}</span> · {planned.lines.length} lines for{" "}
                  {day(planned.deliveryDate)}
                </p>
              </>
            ) : (
              <>
                <h2 className="sm-big" style={{ fontSize: 44 }}>
                  Not placed yet
                </h2>
                <span className="sm-chip">
                  ■{" "}
                  {left > 0
                    ? `Orders close ${cutoff} · ${Math.floor(left / 60)} h ${left % 60} min`
                    : `Orders closed at ${cutoff}`}
                </span>
              </>
            )}
            {lastWait && (
              <div
                className="notice cold small"
                style={{ borderColor: "var(--line-2)", background: "var(--paper-2)" }}
              >
                <b>You are protected on the next tight day.</b> You waited on {day(lastWait.fromDate)}, so
                Waypoint won't make you wait next time.
              </div>
            )}
            <div>
              {planned ? (
                <Link to={`/store/orders/${planned.id}`} className="btn big">
                  See the order
                </Link>
              ) : (
                <Link to="/store/order" className="btn big">
                  Place {weekday(planDate)}'s order
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="sm-home">
        <Card className="pad-0">
          <div
            className="row between"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}
          >
            <h2 className="h-sec">Recent orders</h2>
            <Link to="/store/orders" className="small" style={{ fontWeight: 600 }}>
              All orders ›
            </Link>
          </div>
          {recent.length === 0 && <div className="empty">No orders yet.</div>}
          {recent.map((o) => (
            <Link key={o.id} to={`/store/orders/${o.id}`} className="sm-recent">
              <span className="mono" style={{ fontWeight: 700 }}>
                {o.id}
              </span>
              <span>{o.deliveryDate === demoDate ? "Today" : day(o.deliveryDate)}</span>
              <span className="muted small">{summary(o)}</span>
              {badge(o)}
            </Link>
          ))}
        </Card>

        <Card>
          <div className="col" style={{ gap: 14 }}>
            <div className="row between">
              <h2 className="h-sec">Last 30 days</h2>
              <span className="small muted">one bar per delivery day</span>
            </div>
            {bars.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                No deliveries in the last 30 days.
              </p>
            ) : (
              <div className="sm-bars" aria-label="Deliveries in the last 30 days">
                {bars.map((b, i) => (
                  <i key={i} className={b.kind === "ok" ? "" : b.kind} title={day(b.date)} />
                ))}
              </div>
            )}
            <div className="sm-key">
              <span>
                <i />
                On time {count("ok")}
              </span>
              <span>
                <i className="now" />
                Waiting for check {count("now")}
              </span>
              <span>
                <i className="bad" />
                Deferred {count("bad")}
              </span>
            </div>
            {lastWait && (
              <Link to="/store/notices" className="small">
                Why you were deferred on {day(lastWait.fromDate)}
              </Link>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
