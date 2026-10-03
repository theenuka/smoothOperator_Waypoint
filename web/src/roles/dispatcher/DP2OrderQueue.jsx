// DP2 Orders for Wednesday. Owner: DISPATCHER FRONTEND.  Design: /design/DP2-OrderQueue.jpg
// WORKING BASELINE: a plain table. TODO list is below the table.
import { useApi } from "../../shared/live.js";
import { Card, PageHead, StatusBadge, Loading, Badge, Todo } from "../../shared/ui.jsx";
import { kg, time } from "../../shared/format.js";

export default function DP2OrderQueue() {
  const { data, loading } = useApi("/orders?date=2026-09-30", ["order.placed", "deferral.decided"]);
  return (
    <>
      <PageHead
        code="DP2"
        title="Orders for Wednesday"
        sub="Everything stores ordered before the 16:00 cutoff."
      />
      <Card className="pad-0">
        {loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Outlet</th>
                  <th>Type</th>
                  <th>Weight</th>
                  <th>Placed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>{o.outletName}</td>
                    <td>{o.chilled ? <Badge tone="cold">Chilled</Badge> : <Badge>Dry</Badge>}</td>
                    <td className="mono">{kg(o.kg)}</td>
                    <td className="mono">{time(o.placedAt)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Todo
        code="DP2"
        owner="Dispatcher FE"
        design="DP2-OrderQueue"
        tasks={[
          "Add filter chips: All / Chilled / Dry, and a search box for outlet name.",
          "Show a summary row: total kg, chilled orders vs reefer slots.",
          "Click a row to open a side panel with the order lines (GET /api/orders/:id).",
          "Then delete this <Todo/> block.",
        ]}
      />
    </>
  );
}
