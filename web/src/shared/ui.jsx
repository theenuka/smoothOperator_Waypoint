// Small shared components. Owner: LEAD. Use these so every screen looks the same.
import { useEffect, useState } from "react";

export const Card = ({ title, action, children, className = "", ...rest }) => (
  <section className={`card ${className}`} {...rest}>
    {(title || action) && (
      <div className="card-head">
        {title && <h2 className="h-sec">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const Badge = ({ tone = "", children }) => <span className={`badge ${tone}`}>{children}</span>;

export const Stat = ({ label, value, tone = "", hint }) => (
  <div className={`card stat ${tone}`}>
    <span className="label">{label}</span>
    <span className="v">{value}</span>
    {hint && <span className="small muted">{hint}</span>}
  </div>
);

export const PageHead = ({ code, title, sub, children }) => (
  <header className="page-head">
    <div className="col" style={{ gap: 6 }}>
      {code && <span className="label">{code}</span>}
      <h1 className="h-page">{title}</h1>
      {sub && <p className="lead">{sub}</p>}
    </div>
    {children && <div className="row wrap">{children}</div>}
  </header>
);

export const Loading = () => <div className="empty">Loading…</div>;
export const ErrorNote = ({ error }) =>
  error ? <div className="notice bad">Something went wrong: {error.message}</div> : null;
export const Empty = ({ children }) => <div className="empty">{children}</div>;

/** Status of an order / stop as a coloured badge */
export function StatusBadge({ status }) {
  const map = {
    delivered: "ok",
    loaded: "ok",
    sealed: "ok",
    synced: "ok",
    next: "now",
    placed: "",
    pending: "",
    deferred: "now",
    short: "bad",
    failed: "bad",
    conflict: "bad",
    offline: "bad",
  };
  return <Badge tone={map[status] ?? ""}>{String(status || "").replace("_", " ")}</Badge>;
}

/** Shows a message for 3 seconds. const [toast, show] = useToast(); show("Saved"); then render {toast} */
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);
  return [
    msg ? (
      <div className="toast" role="status">
        {msg}
      </div>
    ) : null,
    setMsg,
  ];
}

/**
 * Placeholder for a screen that is not built yet. It shows the design you must copy and your task list.
 * When you build the screen, DELETE the <Todo/> and write the real UI.
 */
export function Todo({ code, design, owner, tasks = [] }) {
  return (
    <div className="todo">
      <div className="row wrap between">
        <b>{code}: not built yet</b>
        <Badge tone="now">Owner: {owner}</Badge>
      </div>
      {tasks.length > 0 && (
        <ol>
          {tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      )}
      {design && (
        <>
          <span className="label">Target design (copy this)</span>
          <img src={`/design/${design}.jpg`} alt={`Design for ${code}`} loading="lazy" />
        </>
      )}
    </div>
  );
}
