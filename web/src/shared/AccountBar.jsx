// Thin bar above every role app: who is signed in, and a way out. Owner: LEAD.
// Name, role, outlet and "Sign out". The dispatcher also gets "Reset to seed data".
import { api } from "./api.js";
import { signOut, useAuth } from "./auth.jsx";
import { dropLive } from "./live.js";
import { ROLE_NAMES } from "./Login.jsx";
import { useToast } from "./ui.jsx";

export default function AccountBar() {
  const { user } = useAuth();
  const [toast, show] = useToast();
  const out = async () => {
    await signOut();
    dropLive();
  };
  const reset = async () => {
    await api.post("/meta/reset");
    try {
      localStorage.removeItem("wp.outbox");
      localStorage.removeItem("wp.online");
    } catch {}
    show("Data reset to the seed.");
  };
  return (
    <header className="account-bar">
      <span>
        <b>{user.name}</b> · {ROLE_NAMES[user.role]}
        {user.outletId && <span className="mono"> · {user.outletId}</span>}
      </span>
      <span className="row" style={{ gap: 8 }}>
        {user.role === "dispatcher" && (
          <button className="btn secondary" onClick={reset}>
            Reset to seed data
          </button>
        )}
        <button className="btn secondary" onClick={out}>
          Sign out
        </button>
      </span>
      {toast}
    </header>
  );
}
