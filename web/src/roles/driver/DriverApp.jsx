// Driver app (Chamara, own phone). Owner: DRIVER FRONTEND.  Task file: docs/tasks/06-driver-frontend.md
import { Routes, Route, Navigate } from "react-router-dom";
import { PhoneShell } from "../../shared/shells.jsx";
import { useDriver, setOnline, VEHICLE } from "./outbox.js";
import DR1TodaysRoute from "./DR1TodaysRoute.jsx";
import DR2ActiveStop from "./DR2ActiveStop.jsx";
import DR3ProofOfDelivery from "./DR3ProofOfDelivery.jsx";
import DR4IssueAtStop from "./DR4IssueAtStop.jsx";
import DR5OfflineMode from "./DR5OfflineMode.jsx";
import DR6SyncReconcile from "./DR6SyncReconcile.jsx";
import DR7TripSummary from "./DR7TripSummary.jsx";

const nav = [
  { to: "route", label: "Route" },
  { to: "outbox", label: "Saved" },
  { to: "sync", label: "Sync" },
  { to: "summary", label: "Summary" },
];

function Top() {
  const { online, outbox } = useDriver();
  return (
    <>
      <div className="row between">
        <b style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 800 }}>{VEHICLE} · Kandy run</b>
        <button
          className={`signal ${online ? "on" : "off"}`}
          onClick={() => setOnline(!online)}
          aria-pressed={!online}
          title="Demo switch: simulate losing signal"
        >
          <span className="dot" /> {online ? "Online" : "No signal"}
        </button>
      </div>
      <span className="small" style={{ color: "var(--dock-text-2)" }}>
        Chamara Wickramasinghe ·{" "}
        {outbox.length ? `${outbox.length} saved on phone, waiting to send` : "everything sent"}
      </span>
    </>
  );
}

export default function DriverApp() {
  return (
    <PhoneShell top={<Top />} nav={nav}>
      <Routes>
        <Route index element={<Navigate to="route" replace />} />
        <Route path="route" element={<DR1TodaysRoute />} />
        <Route path="stop/:seq" element={<DR2ActiveStop />} />
        <Route path="stop/:seq/deliver" element={<DR3ProofOfDelivery />} />
        <Route path="stop/:seq/issue" element={<DR4IssueAtStop />} />
        <Route path="outbox" element={<DR5OfflineMode />} />
        <Route path="sync" element={<DR6SyncReconcile />} />
        <Route path="summary" element={<DR7TripSummary />} />
      </Routes>
    </PhoneShell>
  );
}
