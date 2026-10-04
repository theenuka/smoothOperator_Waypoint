// Routes for the whole app.
// Each role app owns everything under its own path.
// Each role opens in its own tab, signs in (docs/AUTH.md), then shows its app.
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

// The role app, only after a sign-in with that role.
function RoleRoute({ role }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Login role={role} />;
  const RoleApp = APPS[role];
  return (
    <>
      <AccountBar />
      <RoleApp />
    </>
  );
}

export default function App() {
  const { ready } = useAuth();
  if (!authOn)
    return (
      <div className="picker">
        <div className="card login">
          <b>Sign-in is not set up on this computer.</b>
          <p className="muted">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web/.env (see docs/AUTH.md), then restart npm
            run dev.
          </p>
        </div>
      </div>
    );
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
