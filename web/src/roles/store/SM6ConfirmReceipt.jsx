// SM6. Owner: STORE FRONTEND.  Design: /design/SM6-ConfirmReceipt.jpg
import { Todo } from "../../shared/ui.jsx";

export default function SM6ConfirmReceipt({ outletId }) {
  return (
    <Todo
      code={`SM6 · ${outletId}`}
      owner="Store FE"
      design="SM6-ConfirmReceipt"
      tasks={[
        "List what was delivered today (GET /api/deliveries?outletId=...).",
        "For each line: tick 'received' or enter the real count.",
        "Differences become a problem report (SM7).",
      ]}
    />
  );
}
