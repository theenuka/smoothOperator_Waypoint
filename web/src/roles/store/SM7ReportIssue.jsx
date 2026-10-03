// SM7. Owner: STORE FRONTEND.  Design: /design/SM7-ReportIssue.jpg
import { Todo } from "../../shared/ui.jsx";

export default function SM7ReportIssue({ outletId }) {
  return (
    <Todo
      code={`SM7 · ${outletId}`}
      owner="Store FE"
      design="SM7-ReportIssue"
      tasks={[
        "Choose the delivery, the item and the problem (missing, damaged, wrong, warm chilled goods).",
        "Backend: ask Backend A for POST /api/issues (add it to docs/API_CONTRACT.md first).",
        "Dispatch must see it on the live feed.",
      ]}
    />
  );
}
