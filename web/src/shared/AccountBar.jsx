// Thin bar above every role app: who is signed in, and a way out. Owner: LEAD.
// Sign-in on: name, role, outlet and "Sign out". Sign-in off (demo): "Switch role".
import { Link } from "react-router-dom";
import { authOn, signOut, useAuth } from "./auth.jsx";
import { dropLive } from "./live.js";

const ROLE_NAMES = { dispatcher: "Dispatcher", loader: "Loader", driver: "Driver", store: "Store manager" };

export default function AccountBar({ role }) {
  const { user } = useAuth();
  const out = async () => {
    await signOut();
    dropLive();
  };
  return (
    <header className="account-bar">
      {authOn && user ? (
        <>
          <span>
            <b>{user.name}</b> · {ROLE_NAMES[user.role] || "No role"}
            {user.outletId && <span className="mono"> · {user.outletId}</span>}
          </span>
          <button className="btn secondary" onClick={out}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <span>
            Demo mode, no sign-in · <b>{ROLE_NAMES[role]}</b>
          </span>
          <Link className="btn secondary" to="/">
            Switch role
          </Link>
        </>
      )}
    </header>
  );
}
