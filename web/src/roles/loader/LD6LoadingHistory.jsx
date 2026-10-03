// LD6 Loading history. Owner: LOADER FRONTEND.  Design: /design/LD6-LoadingHistory.jpg
import { Todo } from "../../shared/ui.jsx";

export default function LD6LoadingHistory() {
  return (
    <Todo
      code="LD6"
      owner="Loader FE"
      design="LD6-LoadingHistory"
      tasks={[
        "List today's loads: GET /api/runs?date=2026-09-29, then GET /api/loads/:runId for each.",
        "For each truck: bay, vehicle, sealed time, lines loaded / planned, number of shortfalls.",
        "Shortfalls in red with the reason and who flagged them.",
      ]}
    />
  );
}
