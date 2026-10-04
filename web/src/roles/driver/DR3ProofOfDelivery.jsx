// DR3 Proof of delivery.  Design: docs/design/DR3-ProofOfDelivery.jpg
// Item checklist (the dock shortfall is already printed), photo, name and signature.
// Saved through addRecord(): the phone keeps the full record and sends it when there is signal.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../shared/live.js";
import { Loading, ErrorNote } from "../../shared/ui.jsx";
import { time } from "../../shared/format.js";
import { addRecord, useDriver, RUN } from "./outbox.js";
import { Icon, icon } from "./icons.jsx";
import { shrinkPhoto } from "./photo.js";
import SignaturePad from "./SignaturePad.jsx";
import "./driver.css";

export default function DR3ProofOfDelivery() {
  const { seq } = useParams();
  const nav = useNavigate();
  const { online } = useDriver();
  const { data, loading, error } = useApi(`/runs/${RUN}`, ["load.shortfall"]);
  const [notHanded, setNotHanded] = useState([]); // skus the driver unticked
  const [signedBy, setSignedBy] = useState(null); // null = use the store manager's name
  const [signature, setSignature] = useState(null);
  const [photo, setPhoto] = useState(null); // { data, at }
  const [photoError, setPhotoError] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const s = data.stops.find((x) => String(x.seq) === seq);
  if (!s) return <ErrorNote error={{ message: `There is no stop ${seq} on today's route.` }} />;

  const lines = s.order?.lines || [];
  const name = signedBy ?? s.outlet?.manager ?? "";
  const canComplete = signature && name.trim();

  const toggle = (sku) =>
    setNotHanded(notHanded.includes(sku) ? notHanded.filter((x) => x !== sku) : [...notHanded, sku]);

  const takePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoError("");
      setPhoto({ data: await shrinkPhoto(file), at: new Date().toISOString() });
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  const complete = () => {
    addRecord({
      stopSeq: s.seq,
      orderId: s.orderId,
      outletId: s.outletId,
      status: "delivered",
      signedBy: name.trim(),
      signature,
      photo: photo?.data,
      photoAt: photo?.at,
      items: lines.map((l) => {
        const sf = s.shortfalls.find((x) => x.sku === l.sku);
        return {
          sku: l.sku,
          name: l.name,
          ordered: l.qty,
          handedOver: notHanded.includes(l.sku) ? 0 : sf ? sf.loaded : l.qty,
        };
      }),
    });
    nav("/driver/route");
  };

  return (
    <>
      <Link to="/driver/route" className="dr-back">
        ← Route
      </Link>
      <div className="col" style={{ gap: 6 }}>
        <span className="label">
          Stop {s.seq} of {data.stops.length} · {time(new Date().toISOString())}
        </span>
        <h1 className="dr-title">
          {s.outletId} {s.outletName}
        </h1>
      </div>

      <div className="dr-list">
        {lines.map((l) => {
          const sf = s.shortfalls.find((x) => x.sku === l.sku);
          if (sf) {
            return (
              <div key={l.sku} className="dr-line short">
                <Icon d={icon.flag} />
                <span className="fill">{l.name}</span>
                <b className="mono">
                  {sf.loaded} of {sf.planned}
                </b>
              </div>
            );
          }
          const handed = !notHanded.includes(l.sku);
          return (
            <button
              key={l.sku}
              type="button"
              className={`dr-line ${handed ? "ok" : "missing"}`}
              aria-pressed={handed}
              onClick={() => toggle(l.sku)}
            >
              <Icon d={handed ? icon.check : icon.circle} />
              <span className="fill">{l.name}</span>
              <span className="mono">{handed ? l.qty : `0 of ${l.qty}`}</span>
            </button>
          );
        })}
        {s.shortfalls.map((sf) => (
          <div key={sf.id} className="dr-line-note">
            <Icon d={icon.flag} size={18} />
            <span>
              {sf.planned - sf.loaded} {sf.name.split(",")[0].toLowerCase()} short. Flagged at the dock{" "}
              {time(sf.at)}, the store already knows.
            </span>
          </div>
        ))}
      </div>
      {notHanded.length > 0 && (
        <span className="small muted">
          Unticked items are recorded as not handed over. Dispatch sees this when the delivery is sent.
        </span>
      )}

      <div className="dr-proof">
        <label className="dr-photo">
          {photo ? (
            <img src={photo.data} alt="Photo of the delivery" />
          ) : (
            <span className="col" style={{ alignItems: "center", gap: 4 }}>
              <Icon d={icon.camera} size={28} />
              <span className="small">Add photo</span>
            </span>
          )}
          {photo && <span className="dr-photo-time mono">{time(photo.at)}</span>}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={takePhoto}
            className="dr-hidden"
          />
        </label>
        <label className="field fill">
          <span className="label">Received by</span>
          <input className="input" value={name} onChange={(e) => setSignedBy(e.target.value)} />
          <span className="small muted">Store manager, signs on the phone</span>
        </label>
      </div>
      {photoError && <div className="notice bad small">{photoError}</div>}

      <SignaturePad onChange={setSignature} label={`${name || "Receiver"} signs here`} />

      {!online && (
        <div className="notice cold small">
          No signal: this is saved on the phone with its time, photo and signature, and sent by itself when
          signal returns. Keep driving.
        </div>
      )}

      <button className="btn big block" disabled={!canComplete} onClick={complete}>
        <Icon d={icon.check} /> {signature ? "Complete delivery" : "Ask the receiver to sign"}
      </button>
    </>
  );
}
