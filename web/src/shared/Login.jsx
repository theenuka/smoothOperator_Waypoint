// Sign-in page. Shown only when sign-in is on (docs/AUTH.md). Owner: LEAD.
import { useState } from "react";
import { Logo } from "./shells.jsx";
import { signIn } from "./auth.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
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

  return (
    <div className="picker">
      <div className="hazard" style={{ borderRadius: 0 }} />
      <form className="card login" onSubmit={submit}>
        <Logo tile={48} word={44} />
        <p className="muted">Sign in to open your Waypoint app. Your account decides which app you see.</p>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="notice bad">{error}</div>}
        <button className="btn now big block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
