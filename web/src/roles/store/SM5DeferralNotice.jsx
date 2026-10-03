// SM5 Notices: deferrals and shortfalls, with the reason. Owner: STORE FRONTEND.  Design: /design/SM5-DeferralNotice.jpg
// WORKING BASELINE (live). TODO: match the design (big new date, "why" block, fairness history).
import { api } from "../../shared/api.js";
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, Empty } from "../../shared/ui.jsx";
import { day, time } from "../../shared/format.js";

export default function SM5DeferralNotice({ outletId }) {
  const { data, loading, reload } = useApi(`/notices?outletId=${outletId}`, [
    "deferral.decided",
    "load.shortfall",
    "sync.resolved",
  ]);
  if (loading) return <Loading />;
  return (
    <>
      <PageHead
        code={`SM5 · ${outletId}`}
        title="Notices"
        sub="When something changes, you hear why, not just a new date."
      />
      {data.length === 0 && <Empty>No notices. Everything is on time.</Empty>}
      {data.map((n) => (
        <Card
          key={n.id}
          title={n.title}
          action={
            <div className="row">
              <Badge tone={n.type === "shortfall" ? "bad" : "now"}>{n.type}</Badge>
              {!n.read && (
                <button
                  className="btn secondary"
                  onClick={async () => {
                    await api.post(`/notices/${n.id}/read`);
                    reload();
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          }
          style={n.read ? { opacity: 0.7 } : undefined}
        >
          <p style={{ margin: 0, maxWidth: "70ch" }}>{n.body}</p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {day(n.at)} · {time(n.at)}
            {n.by ? ` · ${n.by}` : ""}
          </p>
        </Card>
      ))}
    </>
  );
}
