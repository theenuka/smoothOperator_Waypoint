// LD3 Item check: big, glove-friendly count for one line. Owner: LOADER FRONTEND.  Design: /design/LD3-ItemCheck.jpg
import { useParams } from "react-router-dom";
import { Todo } from "../../shared/ui.jsx";

export default function LD3ItemCheck() {
  const { runId, orderId, sku } = useParams();
  return (
    <Todo
      code="LD3"
      owner="Loader FE"
      design="LD3-ItemCheck"
      tasks={[
        `Load the line: GET /api/loads/${runId}, find orderId=${orderId} and sku=${sku}.`,
        "Show the product name huge, and the planned count. Big − and + buttons (at least 64px, gloves!).",
        "'All loaded' button: POST /api/loads/:runId/check { orderId, sku, loaded } then go back to the load plan.",
        "If loaded < planned, send them to the Short screen instead (/loader/run/:runId/short/:orderId/:sku).",
      ]}
    />
  );
}
