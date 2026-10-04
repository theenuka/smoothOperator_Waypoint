// Signature pad for proof of delivery.
// A plain <canvas> with pointer events, so it works with a finger, a pen or a mouse.
// onChange(dataUrl) is called after every stroke, and onChange(null) after "Clear".
import { useEffect, useRef, useState } from "react";

export default function SignaturePad({ onChange, label = "Sign here" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  // Match the canvas pixels to its size on screen (sharp lines on high-density phones).
  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
  }, []);

  const point = (e) => {
    const box = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const start = (e) => {
    e.preventDefault();
    try {
      canvasRef.current.setPointerCapture(e.pointerId); // keep drawing even if the finger slips off the pad
    } catch {}
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1); // a single tap still leaves a dot
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setSigned(true);
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onChange(null);
  };

  return (
    <div className="dr-sign">
      <canvas
        ref={canvasRef}
        className="dr-sign-canvas"
        aria-label={label}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {!signed && <span className="dr-sign-hint">{label}</span>}
      {signed && (
        <button type="button" className="btn ghost dr-sign-clear" onClick={clear}>
          Clear
        </button>
      )}
    </div>
  );
}
