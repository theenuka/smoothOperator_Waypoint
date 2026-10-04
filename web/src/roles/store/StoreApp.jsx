// Store manager app (Nadeeka, desktop).
import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopShell } from "../../shared/shells.jsx";
import { useAuth } from "../../shared/auth.jsx";
import { useApi } from "../../shared/live.js";
import { Empty } from "../../shared/ui.jsx";
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

const initialsOf = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function StoreApp() {
  // The store comes from the signed-in account (Supabase app_metadata.outletId), so a manager only
  // ever sees their own store. There is no switch.
  const { user } = useAuth();
  const outletId = user?.outletId;
  const meta = useApi("/meta");
  const outlet = meta.data?.outlets.find((o) => o.id === outletId);
  const person = {
    name: user?.name || "Store manager",
    role: "Store manager",
    initials: initialsOf(user?.name || "S M"),
  };
  const props = { outletId };

  if (!outletId)
    return (
      <DesktopShell person={person} nav={[]}>
        <Empty>
          This account is not linked to a store yet. Ask the Lead to add your outlet to your sign-in
          (docs/AUTH.md).
        </Empty>
      </DesktopShell>
    );

  return (
    <DesktopShell
      person={person}
      nav={nav}
      title={
        <span className="mono small" aria-label="Your store">
          {outletId}
          {outlet ? ` · ${outlet.name}` : ""}
        </span>
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
