// DP5 Live tracking. Owner: DISPATCHER FRONTEND.  Design: /design/DP5-LiveTracking.jpg
// WORKING BASELINE: vehicle list with signal state. TODO: a map (optional, see task file).
import { useApi } from "../../shared/live.js";
import { Card, PageHead, Badge, Loading, Todo } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";

export default function DP5LiveTracking() {
  const { data, loading } = useApi("/tracking", ["vehicle.position", "vehicle.offline", "vehicle.online"]);
  return (
    <>
      <PageHead
        code="DP5"
        title="Live tracking"
        sub="Where every truck is, and which ones have lost signal."
      />
      <Card className="pad-0">
        {loading ? (
          <Loading />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Last seen</th>
                <th>Position</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.vehicleId}>
                  <td className="mono">
                    <b>{p.vehicleId}</b>
                  </td>
                  <td className="mono">{time(p.at)}</td>
                  <td className="mono small">
                    {p.lat?.toFixed(3)}, {p.lng?.toFixed(3)}{" "}
                    {p.place && <span className="muted">near {p.place}</span>}
                  </td>
                  <td>
                    {p.online === false ? (
                      <Badge tone="bad">No signal · records saved on phone</Badge>
                    ) : (
                      <Badge tone="ok">Online</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Todo
        code="DP5"
        owner="Dispatcher FE"
        design="DP5-LiveTracking"
        tasks={[
          "Optional map: npm i leaflet react-leaflet -w web (ask the Lead first, they own package.json).",
          "Show the planned stops of RUN-VEH022 and which are done.",
          "When a truck is offline, say what that means: 'deliveries are saved on the phone and will sync'.",
        ]}
      />
    </>
  );
}
