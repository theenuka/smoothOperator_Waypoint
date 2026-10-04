// Deliveries the store manager has checked and signed on SM6.
// There is no API for this yet, so it is kept in this browser (localStorage), keyed by delivery id.
const KEY = "wp.receipts";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

/**
 * { by, at } if this delivery was checked and signed, otherwise undefined.
 * notBefore: the time of the last "Reset demo data". A check made before it no longer counts.
 */
export function receiptFor(deliveryId, notBefore) {
  const r = deliveryId ? read()[deliveryId] : undefined;
  if (r && notBefore && new Date(r.at) < new Date(notBefore)) return undefined;
  return r;
}

export function markReceived(deliveryId, by) {
  const all = read();
  all[deliveryId] = { by, at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  return all[deliveryId];
}
