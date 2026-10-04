// Sign-in page for one role. Shown only when sign-in is on (docs/AUTH.md). Owner: LEAD.
// The role picker opens each role in its own tab; that tab signs in here and then continues to the app.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./shells.jsx";
import { signIn, signOut, useAuth } from "./auth.jsx";

export const ROLE_NAMES = {
  dispatcher: "Dispatcher",
  loader: "Loader",
  driver: "Driver",
  store: "Store manager",
};
// The demo accounts made by scripts/create-demo-users.mjs, filled in to save typing.
const DEMO_EMAIL = {
  dispatcher: "kavindi@waypoint.demo",
  loader: "ruwan@waypoint.demo",
  driver: "chamara@waypoint.demo",
  store: "nadeeka@waypoint.demo",
};

export default function Login({ role }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(DEMO_EMAIL[role] || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // Signed in, but with an account for another role.
  if (user)
    return (
      <div className="picker">
        <div className="card login">
          <Logo tile={48} word={44} />
          <div className="notice bad">
            {user.email} is a {ROLE_NAMES[user.role] || "account without a role"} account. This tab is for the{" "}
            {ROLE_NAMES[role]}. Sign out and sign in with a {ROLE_NAMES[role]} account.
          </div>
          <button className="btn now big block" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );

  return (
    <div className="picker">
      <div className="hazard" style={{ borderRadius: 0 }} />
      <form className="card login" onSubmit={submit}>
        <Logo tile={48} word={44} />
        <div className="col" style={{ gap: 4 }}>
          <span className="label">Sign in</span>
          <b style={{ fontSize: 22 }}>{ROLE_NAMES[role]}</b>
        </div>
        <label className="field">
          <span className="label">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="notice bad">{error}</div>}
        <button className="btn now big block" disabled={busy}>
          {busy ? "Signing in…" : `Sign in and open the ${ROLE_NAMES[role]} app`}
        </button>
        <Link to="/" className="small muted">
          Back to all roles
        </Link>
      </form>
    </div>
  );
}
