// Offline outbox for the driver phone.
// Every delivery is saved on the phone FIRST (localStorage), then sent when there is signal.
// "Simulate no signal" lets you demo the A1 dead zone without really losing the network.
import { useSyncExternalStore } from "react";
import { api } from "../../shared/api.js";

const KEY = "wp.outbox";
const ONLINE = "wp.online";
const SINCE = "wp.offlineSince";
export const VEHICLE = "VEH022";
export const RUN = "RUN-VEH022";
export const DEAD_ZONE = "Kadugannawa pass"; // where the demo loses signal

const read = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const startOnline = read(ONLINE, true);
let state = {
  online: startOnline,
  // When the signal was lost (ISO time), null while online. "Reset demo data" clears wp.online but
  // not this, so an old time is only kept if the phone really starts in No signal.
  offlineSince: startOnline ? null : read(SINCE, null),
  outbox: read(KEY, []),
  syncing: false,
  last: null,
};
const subs = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  write(KEY, state.outbox);
  write(ONLINE, state.online);
  write(SINCE, state.offlineSince);
  subs.forEach((f) => f());
};

/** Send everything in the outbox. Clean records are accepted; real conflicts go to DR6. */
export async function flush() {
  if (!state.online || state.syncing || state.outbox.length === 0) return;
  set({ syncing: true });
  try {
    const res = await api.post("/sync", { deviceId: "phone-chamara", records: state.outbox });
    const done = new Set([...res.accepted, ...res.duplicates, ...res.conflicts.map((c) => c.clientId)]);
    set({
      outbox: state.outbox.filter((r) => !done.has(r.clientId)),
      syncing: false,
      last: { at: new Date().toISOString(), ...res },
    });
  } catch {
    set({ syncing: false }); // still offline or server down: keep everything, try later
  }
}

/** Save a delivery record. Works with or without signal. */
export function addRecord(rec) {
  const record = {
    clientId: `${VEHICLE}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    runId: RUN,
    recordedAt: new Date().toISOString(),
    ...rec,
  };
  set({ outbox: [...state.outbox, record] });
  flush();
  return record;
}

export async function setOnline(online) {
  set({ online, offlineSince: online ? null : state.offlineSince || new Date().toISOString() });
  // In real life the server notices the silence by itself. Here we tell it, so dispatch sees it live.
  api
    .post("/tracking/signal", { vehicleId: VEHICLE, online, place: online ? "" : DEAD_ZONE })
    .catch(() => {});
  if (online) await flush();
}

export function clearOutbox() {
  set({ outbox: [], last: null });
}

export function useDriver() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state
  );
}
