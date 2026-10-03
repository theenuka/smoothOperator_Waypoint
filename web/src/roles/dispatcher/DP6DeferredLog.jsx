// DP6 Deferral log (audit). Owner: DISPATCHER FRONTEND.  Design: /design/DP6-DeferredLog.jpg
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";

export default function DP6DeferredLog() {
  const { data, loading } = useApi("/deferrals", ["deferral.decided", "deferral.reversed", "sync.resolved"]);
  return (
    <>
      <PageHead
        code="DP6"
        title="Deferral log"
        sub="Every decision, who made it, and the reason the store saw. Nothing is deleted."
      />
      <Card className="pad-0">
        {loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Decided</th>
                  <th>Outlet</th>
                  <th>Moved</th>
                  <th>Reason</th>
                  <th>By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="mono">
                      {day(d.at)} {time(d.at)}
                    </td>
                    <td>
                      <b>{d.outletName || d.outletId}</b>
                      <div className="mono small muted">{d.orderId}</div>
                    </td>
                    <td className="mono">
                      {day(d.fromDate)} → {day(d.toDate)}
                    </td>
                    <td className="small" style={{ maxWidth: 420 }}>
                      {d.reason}
                    </td>
                    <td className="small">{d.decidedBy}</td>
                    <td>
                      {d.reversed ? <Badge tone="ok">Reversed</Badge> : <Badge tone="now">Deferred</Badge>}
                      {d.note && <div className="small muted">{d.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
