// Why a delivery could not be made (DR4). Owner: DRIVER FRONTEND.
// The id is saved in the record as `issue`; the label is what the driver reads (DR4, DR5, DR7).
import { icon } from "./icons.jsx";

export const REASONS = [
  { id: "store_closed", label: "Shutter down, nobody to receive", icon: icon.shutter },
  { id: "refused", label: "Outlet refused the goods", icon: icon.refused },
  { id: "damaged", label: "Goods damaged on the way", icon: icon.damaged },
  { id: "cant_reach_dock", label: "Can't reach the delivery bay", icon: icon.dock },
  { id: "other", label: "Something else", icon: icon.other },
];

export const reasonLabel = (id) => REASONS.find((r) => r.id === id)?.label || "Problem at the stop";
