// Store manager app (Nadeeka, desktop).
import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopShell } from "../../shared/shells.jsx";
import { useOutlet, OUTLETS } from "./outlet.js";
import SM1Dashboard from "./SM1Dashboard.jsx";
import SM2PlaceOrder from "./SM2PlaceOrder.jsx";
import SM3OrderQueue from "./SM3OrderQueue.jsx";
import SM4OrderDetail from "./SM4OrderDetail.jsx";
import SM5DeferralNotice from "./SM5DeferralNotice.jsx";
import SM6ConfirmReceipt from "./SM6ConfirmReceipt.jsx";
import SM7ReportIssue from "./SM7ReportIssue.jsx";

const nav = [
  { to: "today", code: "SM1", label: "Today" },
  { to: "order", code: "SM2", label: "Order" },
  { to: "orders", code: "SM3", label: "Orders" },
  { to: "notices", code: "SM5", label: "Notices" },
  { to: "receive", code: "SM6", label: "Receive" },
  { to: "issue", code: "SM7", label: "Problem" },
];

export default function StoreApp() {
  const [outletId, setOutletId] = useOutlet();
  const person = { name: "Nadeeka Fernando", role: "Store manager", initials: "NF" };
  const props = { outletId };
  return (
    <DesktopShell
      person={person}
      nav={nav}
      title={
        <select
          className="select"
          style={{ minHeight: 32, padding: "4px 8px", width: "auto" }}
          value={outletId}
          onChange={(e) => setOutletId(e.target.value)}
          aria-label="Outlet (demo switch)"
        >
          {OUTLETS.map(([id, label]) => (
            <option key={id} value={id}>
              {id} · {label}
            </option>
          ))}
        </select>
      }
    >
      <Routes>
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<SM1Dashboard {...props} />} />
        <Route path="order" element={<SM2PlaceOrder {...props} />} />
        <Route path="orders" element={<SM3OrderQueue {...props} />} />
        <Route path="orders/:id" element={<SM4OrderDetail {...props} />} />
        <Route path="notices" element={<SM5DeferralNotice {...props} />} />
        <Route path="receive" element={<SM6ConfirmReceipt {...props} />} />
        <Route path="issue" element={<SM7ReportIssue {...props} />} />
      </Routes>
    </DesktopShell>
  );
}
