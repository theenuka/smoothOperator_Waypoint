// Event bus. Owner: LEAD.
// Every important change is published here. It is saved to the audit log (db.events)
// and pushed live to every open screen through Socket.IO ("one fact, every screen").
// Event types are listed in docs/API_CONTRACT.md. Add new types there first.
import { db, save, newId, nowIso } from "./db.js";

let io = null;
export function attach(socketServer) {
  io = socketServer;
}

export function publish(type, payload = {}) {
  const event = { id: newId("EV"), type, at: nowIso(), payload };
  const d = db();
  d.events.unshift(event);
  d.events = d.events.slice(0, 500);
  save();
  if (io) io.emit("event", event);
  return event;
}
