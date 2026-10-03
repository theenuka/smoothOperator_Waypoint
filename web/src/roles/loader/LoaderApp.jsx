// Loader app (Ruwan, shared dock tablet, dark). Owner: LOADER FRONTEND.  Task file: docs/tasks/05-loader-frontend.md
import { Routes, Route, Navigate } from "react-router-dom";
import { DockShell } from "../../shared/shells.jsx";
import LD1DockHome from "./LD1DockHome.jsx";
import LD2LoadList from "./LD2LoadList.jsx";
import LD3ItemCheck from "./LD3ItemCheck.jsx";
import LD4FlagShortfall from "./LD4FlagShortfall.jsx";
import LD5LoadComplete from "./LD5LoadComplete.jsx";
import LD6LoadingHistory from "./LD6LoadingHistory.jsx";

const nav = [
  { to: "home", label: "Dock" },
  { to: "history", label: "History" },
];

export default function LoaderApp() {
  return (
    <DockShell
      nav={nav}
      right={
        <span className="small" style={{ color: "var(--dock-text-2)" }}>
          Ruwan Jayasinghe · Peliyagoda dock
        </span>
      }
    >
      <Routes>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<LD1DockHome />} />
        <Route path="run/:runId" element={<LD2LoadList />} />
        <Route path="run/:runId/check/:orderId/:sku" element={<LD3ItemCheck />} />
        <Route path="run/:runId/short/:orderId/:sku" element={<LD4FlagShortfall />} />
        <Route path="run/:runId/complete" element={<LD5LoadComplete />} />
        <Route path="history" element={<LD6LoadingHistory />} />
      </Routes>
    </DockShell>
  );
}
