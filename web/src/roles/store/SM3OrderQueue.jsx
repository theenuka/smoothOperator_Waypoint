// SM3 Orders. Owner: STORE FRONTEND.  Design: /design/SM3-OrderQueue.jpg
import { Link } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, StatusBadge, Loading, Todo } from "../../shared/ui.jsx";
import { day, kg } from "../../shared/format.js";

export default function SM3OrderQueue({ outletId }) {
  const { data, loading } = useApi(`/orders?outletId=${outletId}`, [
    "order.placed",
    "deferral.decided",
    "delivery.recorded",
  ]);
  if (loading) return <Loading />;
  return (
    <>
      <PageHead code="SM3" title="Orders" />
      <Card className="pad-0">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Delivery</th>
              <th>Weight</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="mono" to={`/store/orders/${o.id}`}>
                    {o.id}
                  </Link>
                </td>
                <td>{day(o.deliveryDate)}</td>
                <td className="mono">{kg(o.kg)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Todo
        code="SM3"
        owner="Store FE"
        design="SM3-OrderQueue"
        tasks={["Tabs: Coming / Delivered / Moved.", "Show why a moved order was moved (from its deferral)."]}
      />
    </>
  );
}
