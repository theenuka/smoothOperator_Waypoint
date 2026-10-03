// LD2 Load plan: every line that must go on this truck, in reverse stop order. Owner: LOADER FRONTEND.  Design: /design/LD2-LoadList.jpg
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, Badge, Loading, ErrorNote } from "../../shared/ui.jsx";

export default function LD2LoadList() {
  const { runId } = useParams();
  const load = useApi(`/loads/${runId}`, ["load.shortfall", "load.completed"]);
  const run = useApi(`/runs/${runId}`);
  if (load.loading || run.loading) return <Loading />;
  if (load.error) return <ErrorNote error={load.error} />;

  // Load the LAST stop first, so the first stop's goods are at the door.
  const stops = [...run.data.stops].sort((a, b) => b.seq - a.seq);
  const short = (l) => load.data.shortfalls.find((s) => s.orderId === l.orderId && s.sku === l.sku);

  return (
    <>
      <div className="row between wrap">
        <div className="col" style={{ gap: 4 }}>
          <span className="label">
            LD2 · {run.data.vehicleId} · Bay {run.data.bay}
          </span>
          <h1 className="h-page">Load plan</h1>
          <span className="muted">
            Load the last stop first. Short? Flag it and keep loading. The truck is never blocked.
          </span>
        </div>
        <Link className="btn now big" to={`/loader/run/${runId}/complete`}>
          Finish loading
        </Link>
      </div>
      {stops.map((s) => (
        <Card
          key={s.seq}
          title={`Stop ${s.seq} · ${s.outletName}`}
          action={<span className="mono small muted">{s.orderId}</span>}
        >
          <table className="table">
            <tbody>
              {load.data.lines
                .filter((l) => l.orderId === s.orderId)
                .map((l) => {
                  const sf = short(l);
                  return (
                    <tr key={l.sku}>
                      <td>
                        <b>{l.name}</b>
                        <div className="mono small muted">{l.sku}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 18 }}>
                        {l.loaded} / {l.planned}
                      </td>
                      <td>
                        {sf ? (
                          <Badge tone="bad">Short {sf.planned - sf.loaded}</Badge>
                        ) : l.checked ? (
                          <Badge tone="ok">Checked</Badge>
                        ) : (
                          <Badge>To load</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <Link
                            className="btn secondary"
                            to={`/loader/run/${runId}/check/${l.orderId}/${l.sku}`}
                          >
                            Check
                          </Link>
                          {!sf && (
                            <Link
                              className="btn danger"
                              to={`/loader/run/${runId}/short/${l.orderId}/${l.sku}`}
                            >
                              Short
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      ))}
    </>
  );
}
