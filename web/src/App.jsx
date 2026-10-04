// Routes for the whole app.
// Each role app owns everything under its own path.
// With sign-in on (docs/AUTH.md) a user only opens the app of their own role.
import { Routes, Route, Navigate } from "react-router-dom";
import RolePicker from "./shared/RolePicker.jsx";
import Login from "./shared/Login.jsx";
import AccountBar from "./shared/AccountBar.jsx";
import { authOn, signOut, useAuth } from "./shared/auth.jsx";
import { Loading } from "./shared/ui.jsx";
import DispatcherApp from "./roles/dispatcher/DispatcherApp.jsx";
import LoaderApp from "./roles/loader/LoaderApp.jsx";
import DriverApp from "./roles/driver/DriverApp.jsx";
import StoreApp from "./roles/store/StoreApp.jsx";

const APPS = { dispatcher: DispatcherApp, loader: LoaderApp, driver: DriverApp, store: StoreApp };

// Opens a role app when the signed-in user has that role (always, when sign-in is off).
function RoleRoute({ role }) {
  const { user } = useAuth();
  if (authOn && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  const RoleApp = APPS[role];
  return (
    <>
      <AccountBar role={role} />
      <RoleApp />
    </>
  );
}

export default function App() {
  const { ready, user } = useAuth();
  if (!ready) return <Loading />;
  if (authOn && !user) return <Login />;
  if (authOn && !APPS[user.role])
    return (
      <div className="picker">
        <div className="card login">
          <b>Your account has no app yet.</b>
          <p className="muted">Ask the dispatcher to give {user.email} a role, then sign in again.</p>
          <button className="btn secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  return (
    <Routes>
      <Route path="/" element={authOn ? <Navigate to={`/${user.role}`} replace /> : <RolePicker />} />
      {Object.keys(APPS).map((role) => (
        <Route key={role} path={`/${role}/*`} element={<RoleRoute role={role} />} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
