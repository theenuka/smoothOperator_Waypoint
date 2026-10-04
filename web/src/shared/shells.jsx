// Page frames for each device.
// DesktopShell: dispatcher + store manager.  DockShell: loader tablet (dark).  PhoneShell: driver.
import { NavLink, Link } from "react-router-dom";

const Mark = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M7 24V8l9 8 9-8v16" fill="none" stroke="#1B1A17" strokeWidth="3.6" strokeLinejoin="round" />
  </svg>
);

/** nav = [{ to: "dashboard", code: "DP1", label: "Today" }, ...] (paths relative to the role) */
export function DesktopShell({ person, nav, title, children }) {
  return (
    <div className="shell">
      <nav className="rail" aria-label={`${person.role} menu`}>
        <Link to="/" className="rail-mark" aria-label="Waypoint home: switch role">
          <Mark />
        </Link>
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="code">{n.code}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        <Link to="/" className="end">
          <span className="code">⇄</span>
          <span>Switch</span>
        </Link>
      </nav>
      <div className="main">
        <div className="topbar">
          <b style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 800 }}>WAYPOINT</b>
          <span className="label">{title}</span>
          <div className="who">
            <div className="col" style={{ gap: 0, alignItems: "flex-end" }}>
              <b className="small">{person.name}</b>
              <span className="small muted">{person.role}</span>
            </div>
            <span className="avatar">{person.initials}</span>
          </div>
        </div>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

export function DockShell({ nav, right, children }) {
  return (
    <div className="dock">
      <div className="topbar">
        <Link to="/" style={{ textDecoration: "none" }} aria-label="Waypoint home: switch role">
          <b
            style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 800, color: "var(--yellow)" }}
          >
            WAYPOINT DOCK
          </b>
        </Link>
        <nav className="dock-tabs" aria-label="Loader menu">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">{right}</div>
      </div>
      <main className="page">{children}</main>
    </div>
  );
}

export function PhoneShell({ top, nav, children }) {
  return (
    <div className="phone-stage">
      <div className="phone">
        <div className="phone-top">{top}</div>
        <main className="phone-body">{children}</main>
        <nav className="phone-nav" aria-label="Driver menu">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
