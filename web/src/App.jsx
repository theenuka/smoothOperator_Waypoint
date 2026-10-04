// Routes for the whole app.
// Each role app owns everything under its own path.
// With sign-in on (docs/AUTH.md) each role tab signs in first, then opens its app.
import { Routes, Route, Navigate } from "react-router-dom";
import RolePicker from "./shared/RolePicker.jsx";
import Login from "./shared/Login.jsx";
import AccountBar from "./shared/AccountBar.jsx";
import { authOn, useAuth } from "./shared/auth.jsx";
import { Loading } from "./shared/ui.jsx";
import DispatcherApp from "./roles/dispatcher/DispatcherApp.jsx";
import LoaderApp from "./roles/loader/LoaderApp.jsx";
import DriverApp from "./roles/driver/DriverApp.jsx";
import StoreApp from "./roles/store/StoreApp.jsx";

const APPS = { dispatcher: DispatcherApp, loader: LoaderApp, driver: DriverApp, store: StoreApp };

// The role app, after a sign-in with that role (straight away when sign-in is off).
function RoleRoute({ role }) {
  const { user } = useAuth();
  if (authOn && user?.role !== role) return <Login role={role} />;
  const RoleApp = APPS[role];
  return (
    <>
      <AccountBar role={role} />
      <RoleApp />
    </>
  );
}

export default function App() {
  const { ready } = useAuth();
  if (!ready) return <Loading />;
  return (
    <Routes>
      <Route path="/" element={<RolePicker />} />
      {Object.keys(APPS).map((role) => (
        <Route key={role} path={`/${role}/*`} element={<RoleRoute role={role} />} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
