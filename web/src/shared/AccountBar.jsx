// Thin bar above every role app: who is signed in, and a way out. Owner: LEAD.
// Sign-in on: name, role, outlet and "Sign out" (the dispatcher also gets "Reset demo data").
// Sign-in off (demo): "Switch role".
import { Link } from "react-router-dom";
import { api } from "./api.js";
import { authOn, signOut, useAuth } from "./auth.jsx";
import { dropLive } from "./live.js";
import { ROLE_NAMES } from "./Login.jsx";
import { useToast } from "./ui.jsx";

export default function AccountBar({ role }) {
  const { user } = useAuth();
  const [toast, show] = useToast();
  const out = async () => {
    await signOut();
    dropLive();
  };
  const reset = async () => {
    await api.post("/meta/reset");
    show("Demo data reset");
  };
  return (
    <header className="account-bar">
      {authOn && user ? (
        <>
          <span>
            <b>{user.name}</b> · {ROLE_NAMES[user.role]}
            {user.outletId && <span className="mono"> · {user.outletId}</span>}
          </span>
          <span className="row" style={{ gap: 8 }}>
            {user.role === "dispatcher" && (
              <button className="btn secondary" onClick={reset}>
                Reset demo data
              </button>
            )}
            <button className="btn secondary" onClick={out}>
              Sign out
            </button>
          </span>
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
      {toast}
    </header>
  );
}
