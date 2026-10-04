// Landing page: pick who you are.
import { Link } from "react-router-dom";
import { Logo } from "./shells.jsx";

const ROLES = [
  {
    to: "/dispatcher",
    step: "Plan",
    name: "Kavindi Perera",
    role: "Dispatcher",
    device: "Desktop · depot office",
    line: "Plans tomorrow's runs and decides who waits when chilled trucks are full.",
  },
  {
    to: "/loader",
    step: "Load",
    name: "Ruwan Jayasinghe",
    role: "Loader",
    device: "Shared tablet · dock",
    line: "Checks every line onto the truck and flags shortfalls without blocking it.",
  },
  {
    to: "/driver",
    step: "Drive",
    name: "Chamara Wickramasinghe",
    role: "Driver",
    device: "Own phone · on the road",
    line: "Delivers and records proof, even with no signal on the A1 to Kandy.",
  },
  {
    to: "/store",
    step: "Receive",
    name: "Nadeeka Fernando",
    role: "Store manager",
    device: "Desktop · OUT014 Dehiwala",
    line: "Orders stock and always knows what is coming, and why.",
  },
];

export default function RolePicker() {
  return (
    <div className="picker">
      <div className="picker-in">
        <header className="picker-head">
          <span className="label">Team smoothOperator · Rootcode Tech-Triathlon 2026</span>
          <h1 className="picker-logo">
            <Logo tile={96} word={104} />
          </h1>
          <p className="picker-tagline">Plan tomorrow's runs. Load them. Drive them. Know what arrives.</p>
          <p className="lead">
            One live truth for the depot office, the dock, the truck and the store. Pick a role to sign in to
            its app in a new tab, and open two side by side to watch a change arrive on the other screen.
          </p>
        </header>

        {/* The four roles as stops on one run: the route line from the logo joins them. */}
        <ol className="roles">
          {ROLES.map((r, i) => (
            <li key={r.to}>
              <Link to={r.to} className="role" target="_blank" rel="noreferrer">
                <span className="role-stop" aria-hidden="true">
                  <span className="role-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="role-step">{r.step}</span>
                </span>
                <span className="device">{r.device}</span>
                <b>{r.role}</b>
                <span className="small">{r.name}</span>
                <span className="small muted fill">{r.line}</span>
                <span className="role-open">
                  Open {r.role.toLowerCase()} app <span aria-hidden="true">↗</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <footer className="picker-foot mono small">
          <span>Demo day Tuesday 29 September 2026</span>
          <span>Planning Wednesday 30 September</span>
          <span>Every change reaches every screen live</span>
        </footer>
      </div>
    </div>
  );
}
