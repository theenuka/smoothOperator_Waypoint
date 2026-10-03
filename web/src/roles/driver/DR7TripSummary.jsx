// DR7 Trip summary. Owner: DRIVER FRONTEND.  Design: /design/DR7-TripSummary.jpg
import { Todo } from "../../shared/ui.jsx";

export default function DR7TripSummary() {
  return (
    <Todo
      code="DR7"
      owner="Driver FE"
      design="DR7-TripSummary"
      tasks={[
        "GET /api/runs/RUN-VEH022 and GET /api/deliveries?runId=RUN-VEH022.",
        "Show: stops delivered, failed, deferred; time on the road; shortfalls handed over.",
        "Show anything still saved on the phone (useDriver().outbox) with a warning to get signal before going home.",
      ]}
    />
  );
}
