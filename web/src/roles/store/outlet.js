// Which outlet the store manager is looking at. Owner: STORE FRONTEND.
import { useState } from "react";
export const OUTLETS = [
  ["OUT014", "Dehiwala · Nadeeka Fernando"],
  ["OUT083", "Kegalle · Sunil Perera"],
  ["OUT072", "Kandy City · R. Mendis"],
  ["OUT022", "Borella · R. Silva (likely to wait Wed)"],
];
export function useOutlet() {
  const [id, setId] = useState(() => {
    try {
      return localStorage.getItem("wp.outlet") || "OUT014";
    } catch {
      return "OUT014";
    }
  });
  const change = (v) => {
    setId(v);
    try {
      localStorage.setItem("wp.outlet", v);
    } catch {}
  };
  return [id, change];
}
