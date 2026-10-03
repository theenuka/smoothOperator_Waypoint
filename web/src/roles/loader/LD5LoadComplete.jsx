// LD5 Load complete: seal the truck. Owner: LOADER FRONTEND.  Design: /design/LD5-LoadComplete.jpg
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, Loading, Badge } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";

export default function LD5LoadComplete() {
  const { runId } = useParams();
  const nav = useNavigate();
  const { data, loading } = useApi(`/loads/${runId}`, ["load.shortfall", "load.completed"]);
  if (loading) return <Loading />;
  const total = data.lines.reduce((s, l) => s + l.planned, 0);
  const loaded = data.lines.reduce((s, l) => s + l.loaded, 0);
  return (
    <>
      <div className="col" style={{ gap: 4 }}>
        <span className="label">LD5 · {runId}</span>
        <h1 className="h-page">Ready to seal</h1>
      </div>
      <div className="grid-2">
        <Card title="Loaded">
          <span className="stencil" style={{ fontSize: 80 }}>
            {loaded}
            <span className="muted" style={{ fontSize: 40 }}>
              {" "}
              / {total}
            </span>
          </span>
        </Card>
        <Card title={`${data.shortfalls.length} shortfall(s), everyone told`}>
          {data.shortfalls.map((s) => (
            <div key={s.id} className="row between" style={{ padding: "6px 0" }}>
              <span>{s.name}</span>
              <span className="mono">
                {s.loaded}/{s.planned}
              </span>
              <Badge tone="bad">{s.reason.replace(/_/g, " ")}</Badge>
              <span className="mono small muted">{time(s.at)}</span>
            </div>
          ))}
        </Card>
      </div>
      {data.status === "sealed" ? (
        <div className="notice ok">Sealed at {time(data.sealedAt)}. The driver can leave.</div>
      ) : (
        <button
          className="btn now big"
          onClick={async () => {
            await api.post(`/loads/${runId}/complete`);
            nav("/loader/home");
          }}
        >
          Seal truck and release
        </button>
      )}
    </>
  );
}
