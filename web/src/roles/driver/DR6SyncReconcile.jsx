// DR6 Sync and reconcile: phone and office disagree, a person decides. Owner: DRIVER FRONTEND.  Design: /design/DR6-SyncReconcile.jpg
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, Loading, useToast } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";
import { RUN } from "./outbox.js";

export default function DR6SyncReconcile() {
  const { data, loading, reload } = useApi(`/sync/conflicts?runId=${RUN}&status=open`, [
    "sync.conflict",
    "sync.resolved",
  ]);
  const [toast, show] = useToast();
  if (loading) return <Loading />;

  const resolve = async (c, choice) => {
    await api.post("/sync/resolve", { conflictId: c.id, choice, by: "Chamara Wickramasinghe" });
    show(choice === "phone" ? "Delivery kept. Dispatch and the store were told." : "Kept the office change.");
    reload();
  };

  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        <span className="label">DR6 · Sync</span>
        <h1 className="h-page" style={{ fontSize: 32 }}>
          {data.length ? `${data.length} need a decision` : "All synced"}
        </h1>
        <span className="muted">Clean records were saved silently. Only real disagreements come here.</span>
      </div>
      {data.map((c) => (
        <Card key={c.id} title={c.outletName}>
          <div className="stack" style={{ gap: 10 }}>
            <div className="notice cold small">
              <b>Your phone:</b> delivered at {time(c.phone.recordedAt)}
              {c.phone.signedBy ? `, signed by ${c.phone.signedBy}` : ""}.
            </div>
            <div className="notice small">
              <b>Office:</b> {c.server.changedBy} moved it to {day(c.server.toDate)} at{" "}
              {time(c.server.changedAt)}. "{c.server.reason}"
            </div>
            <button className="btn now block" onClick={() => resolve(c, "phone")}>
              It was delivered. Keep my record
            </button>
            <button className="btn secondary block" onClick={() => resolve(c, "server")}>
              Keep the office change
            </button>
          </div>
        </Card>
      ))}
      {toast}
    </>
  );
}
