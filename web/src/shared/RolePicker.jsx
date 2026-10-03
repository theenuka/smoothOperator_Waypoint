// Landing page: pick who you are. Owner: LEAD.
import { Link } from "react-router-dom";
import { api } from "./api.js";
import { useToast } from "./ui.jsx";

const ROLES = [
  {
    to: "/dispatcher",
    name: "Kavindi Perera",
    role: "Dispatcher",
    device: "Desktop · depot office",
    line: "Plans tomorrow's runs and decides who waits when chilled trucks are full.",
  },
  {
    to: "/loader",
    name: "Ruwan Jayasinghe",
    role: "Loader",
    device: "Shared tablet · dock",
    line: "Checks every line onto the truck and flags shortfalls without blocking it.",
  },
  {
    to: "/driver",
    name: "Chamara Wickramasinghe",
    role: "Driver",
    device: "Own phone · on the road",
    line: "Delivers and records proof, even with no signal on the A1 to Kandy.",
  },
  {
    to: "/store",
    name: "Nadeeka Fernando",
    role: "Store manager",
    device: "Desktop · OUT014 Dehiwala",
    line: "Orders stock and always knows what is coming, and why.",
  },
];

export default function RolePicker() {
  const [toast, show] = useToast();
  const reset = async () => {
    await api.post("/meta/reset");
    try {
      localStorage.removeItem("wp.outbox");
      localStorage.removeItem("wp.online");
    } catch {}
    show("Demo data reset");
  };
  return (
    <div className="picker">
      <div className="hazard" style={{ borderRadius: 0 }} />
      <div className="picker-in">
        <div className="col" style={{ gap: 14 }}>
          <span className="label">Team smoothOperator · Rootcode Tech-Triathlon 2026</span>
          <h1>
            <span>Waypoint</span>
          </h1>
          <p className="lead" style={{ fontSize: 18 }}>
            Explain the decision. Execute the run. Never lose the truth in between. Pick a role to open its
            app. Open two roles side by side to watch a change reach the other screen live.
          </p>
        </div>
        <div className="roles">
          {ROLES.map((r) => (
            <Link key={r.to} to={r.to} className="role">
              <span className="device">{r.device}</span>
              <b>{r.role}</b>
              <span className="small">{r.name}</span>
              <span className="small muted">{r.line}</span>
            </Link>
          ))}
        </div>
        <div className="row wrap">
          <button className="btn secondary" onClick={reset}>
            Reset demo data
          </button>
          <span className="small muted">
            Demo day: Tuesday 29 September 2026. Planning for Wednesday 30 September.
          </span>
        </div>
      </div>
      {toast}
    </div>
  );
}
