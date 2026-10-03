// Formatting helpers. Owner: LEAD. Sri Lanka time (Asia/Colombo) everywhere.
const TZ = "Asia/Colombo";
export const time = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "";
export const day = (isoOrDate) =>
  isoOrDate
    ? new Date(isoOrDate.length === 10 ? isoOrDate + "T12:00:00+05:30" : isoOrDate).toLocaleDateString(
        "en-GB",
        {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: TZ,
        }
      )
    : "";
export const kg = (n) => `${Number(n || 0).toLocaleString("en-GB")} kg`;
export const hoursAgo = (iso, from = Date.now()) => Math.round((from - new Date(iso).getTime()) / 3600000);

// Plain-English text for each event type (shown in feeds)
export function describe(ev) {
  const p = ev.payload || {};
  switch (ev.type) {
    case "order.placed":
      return `New order ${p.orderId} from ${p.outletName || p.outletId}`;
    case "deferral.decided":
      return `${p.outletName} moved to ${day(p.toDate)}`;
    case "deferral.reversed":
      return `Deferral reversed for ${p.outletName || p.orderId}`;
    case "load.shortfall":
      return `Short at the dock: ${p.loaded} of ${p.planned} ${p.name} for ${p.outletName}`;
    case "load.completed":
      return `Truck sealed for ${p.runId} (${p.shortfalls} shortfall)`;
    case "delivery.recorded":
      return p.status === "failed" ? `Couldn't deliver to ${p.outletName}` : `Delivered to ${p.outletName}`;
    case "sync.conflict":
      return `Needs a decision: ${p.outletName} (phone and office disagree)`;
    case "sync.resolved":
      return `Resolved ${p.orderId}: kept the ${p.choice === "phone" ? "driver's delivery" : "office change"}`;
    case "vehicle.offline":
      return `${p.vehicleId} lost signal ${p.place ? "near " + p.place : ""}`;
    case "vehicle.online":
      return `${p.vehicleId} is back online`;
    case "vehicle.position":
      return `${p.vehicleId} position update`;
    case "notice.read":
      return `Notice read by the outlet`;
    default:
      return ev.type;
  }
}
// Badge colour for an event. Accepts the type string (tone(e.type)) or the whole event (tone(e)).
// Pass the whole event so a failed delivery shows red instead of green.
export const tone = (evOrType) => {
  const type = typeof evOrType === "string" ? evOrType : evOrType?.type || "";
  if (type === "delivery.recorded" && evOrType?.payload?.status === "failed") return "bad";
  return /shortfall|conflict|offline/.test(type)
    ? "bad"
    : /recorded|resolved|completed|online/.test(type)
      ? "ok"
      : /deferral/.test(type)
        ? "now"
        : "";
};
