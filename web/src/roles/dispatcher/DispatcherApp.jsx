// Dispatcher app (Kavindi, desktop). Owner: DISPATCHER FRONTEND.  Task file: docs/tasks/04-dispatcher-frontend.md
// Add a screen: create the file, then add ONE line to `nav` and ONE <Route> below.
import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopShell } from "../../shared/shells.jsx";
import DP1Dashboard from "./DP1Dashboard.jsx";
import DP2OrderQueue from "./DP2OrderQueue.jsx";
import DP3PlanAllocate from "./DP3PlanAllocate.jsx";
import DP4DeferralDecision from "./DP4DeferralDecision.jsx";
import DP5LiveTracking from "./DP5LiveTracking.jsx";
import DP6DeferredLog from "./DP6DeferredLog.jsx";

const person = { name: "Kavindi Perera", role: "Dispatcher · Peliyagoda", initials: "KP" };
const nav = [
  { to: "dashboard", code: "DP1", label: "Today" },
  { to: "orders", code: "DP2", label: "Orders" },
  { to: "plan", code: "DP3", label: "Plan" },
  { to: "decide", code: "DP4", label: "Decide" },
  { to: "tracking", code: "DP5", label: "Live" },
  { to: "deferrals", code: "DP6", label: "Log" },
];

export default function DispatcherApp() {
  return (
    <DesktopShell person={person} nav={nav} title="Dispatch">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DP1Dashboard />} />
        <Route path="orders" element={<DP2OrderQueue />} />
        <Route path="plan" element={<DP3PlanAllocate />} />
        <Route path="decide" element={<DP4DeferralDecision />} />
        <Route path="tracking" element={<DP5LiveTracking />} />
        <Route path="deferrals" element={<DP6DeferredLog />} />
      </Routes>
    </DesktopShell>
  );
}
