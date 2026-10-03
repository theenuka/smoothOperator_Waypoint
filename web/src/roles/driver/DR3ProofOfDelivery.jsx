// DR3 Proof of delivery. Owner: DRIVER FRONTEND.  Design: /design/DR3-ProofOfDelivery.jpg
// WORKING BASELINE: saves to the phone outbox first, sends when online. TODO: signature pad + photo.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Card, Loading } from "../../shared/ui.jsx";
import { addRecord, useDriver, RUN } from "./outbox.js";

export default function DR3ProofOfDelivery() {
  const { seq } = useParams();
  const nav = useNavigate();
  const { online } = useDriver();
  const { data, loading } = useApi(`/runs/${RUN}`);
  const [signedBy, setSignedBy] = useState("");
  const [counted, setCounted] = useState(false);
  if (loading) return <Loading />;
  const s = data.stops.find((x) => String(x.seq) === seq);

  const complete = () => {
    addRecord({
      stopSeq: s.seq,
      orderId: s.orderId,
      outletId: s.outletId,
      status: "delivered",
      signedBy: signedBy || s.outlet?.manager,
      countedTogether: counted,
    });
    nav("/driver/route");
  };

  return (
    <>
      <div className="col" style={{ gap: 2 }}>
        <span className="label">DR3 · Proof of delivery</span>
        <h1 className="h-page" style={{ fontSize: 32 }}>
          {s.outletName}
        </h1>
      </div>
      <Card>
        <div className="stack">
          <label className="field">
            <span className="label">Received by</span>
            <input
              className="input"
              placeholder={s.outlet?.manager}
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
            />
          </label>
          <label className="row" style={{ gap: 10 }}>
            <input
              type="checkbox"
              checked={counted}
              onChange={(e) => setCounted(e.target.checked)}
              style={{ width: 22, height: 22 }}
            />
            Counted together with the store
          </label>
        </div>
      </Card>
      <div className={`notice ${online ? "ok" : "cold"}`}>
        {online
          ? "Online: this is sent right away."
          : "No signal: this is saved on the phone and sent automatically when signal returns. Keep driving."}
      </div>
      <button className="btn now big block" onClick={complete}>
        Complete delivery
      </button>
    </>
  );
}
