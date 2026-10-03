// SM2. Owner: STORE FRONTEND.  Design: /design/SM2-PlaceOrder.jpg
import { Todo } from "../../shared/ui.jsx";

export default function SM2PlaceOrder({ outletId }) {
  return (
    <Todo
      code={`SM2 · ${outletId}`}
      owner="Store FE"
      design="SM2-PlaceOrder"
      tasks={[
        "Product list with qty steppers (use the SKUs from server/src/seed.json orders).",
        "Chilled toggle, and show the 16:00 cutoff clearly (orders after 16:00 go to the day after).",
        "POST /api/orders { outletId, deliveryDate, chilled, lines:[{sku,name,qty,unit}] }.",
        "Show the new order id and go to /store/orders.",
      ]}
    />
  );
}
