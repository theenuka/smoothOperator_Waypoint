// Page frames for each device.
// DesktopShell: dispatcher + store manager.  DockShell: loader tablet (dark).  PhoneShell: driver.
import { NavLink, Link } from "react-router-dom";

/** The Waypoint mark (brand guide): two waypoints joined by a dashed route. */
export const LogoMark = ({ size = 22, color = "var(--ink)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="2.7" stroke={color} strokeWidth="2" />
    <circle cx="18" cy="18" r="2.7" fill={color} />
    <path d="M8.3 8.3L15.7 15.7" stroke={color} strokeWidth="2" strokeDasharray="2.2 2.4" />
  </svg>
);

/** Logo lockup: the mark on its safety-yellow tile, then the wordmark. */
export const Logo = ({ tile = 32, word = 24, dark = false, suffix }) => (
  <span className="logo" style={{ gap: Math.round(tile * 0.3) }}>
    <span className="logo-tile" style={{ width: tile, height: tile, borderRadius: Math.round(tile * 0.18) }}>
      <LogoMark size={Math.round(tile * 0.6)} />
    </span>
    <span className="logo-word" style={{ fontSize: word, color: dark ? "var(--dock-text)" : "var(--ink)" }}>
      Waypoint
      {suffix && <span className="logo-suffix">{suffix}</span>}
    </span>
  </span>
);

/**
 * nav = [{ to: "dashboard", code: "DP1", label: "Today" }, ...] (paths relative to the role)
 * The menu shows the label only. `code` (the design screen code) is kept in the list for reference.
 */
export function DesktopShell({ person, nav, title, children }) {
  return (
    <div className="shell">
      <nav className="rail" aria-label={`${person.role} menu`}>
        <Link to="/" className="rail-mark" aria-label="Waypoint home: switch role">
          <LogoMark size={24} />
        </Link>
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
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
          <span className="logo-word" style={{ fontSize: 24 }}>
            Waypoint
          </span>
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
          <Logo tile={30} word={23} dark suffix="Dock" />
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
