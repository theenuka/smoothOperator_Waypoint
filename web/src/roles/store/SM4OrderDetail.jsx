// SM4. Owner: STORE FRONTEND.  Design: /design/SM4-OrderDetail.jpg
import { Todo } from "../../shared/ui.jsx";

export default function SM4OrderDetail({ outletId }) {
  return (
    <Todo
      code={`SM4 · ${outletId}`}
      owner="Store FE"
      design="SM4-OrderDetail"
      tasks={[
        "Read the id with useParams(), then GET /api/orders/:id.",
        "Timeline: placed \u2192 planned \u2192 loaded \u2192 on the road \u2192 delivered (or moved, with the reason).",
        "Show shortfalls (order.shortfalls) and deferrals (order.deferrals).",
      ]}
    />
  );
}
