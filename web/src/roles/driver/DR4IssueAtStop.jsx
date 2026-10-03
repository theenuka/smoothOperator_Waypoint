// DR4 Issue at stop. Owner: DRIVER FRONTEND.  Design: /design/DR4-IssueAtStop.jpg
import { Todo } from "../../shared/ui.jsx";

export default function DR4IssueAtStop() {
  return (
    <Todo
      code="DR4"
      owner="Driver FE"
      design="DR4-IssueAtStop"
      tasks={[
        "Big buttons for the problem: Store closed · Refused items · Damaged in transit · Can't reach dock.",
        "Optional note box.",
        "Save with addRecord({ stopSeq, orderId, outletId, status: 'failed', issue, note }) from ./outbox.js.",
        "Go back to /driver/route. Works offline too.",
      ]}
    />
  );
}
