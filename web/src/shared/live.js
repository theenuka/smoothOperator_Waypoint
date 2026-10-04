// Live updates ("one fact, every screen").
// The server publishes an event for every important change. These hooks let a screen react.
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { api } from "./api.js";
import { getToken } from "./auth.jsx";

let socket = null;
function getSocket() {
  if (!socket) {
    // auth is read on every (re)connect, so a refreshed sign-in token is used automatically
    socket = io({ path: "/socket.io", auth: (cb) => cb({ token: getToken() }) });
    // A refused sign-in stops Socket.IO retrying by itself, so try again shortly with the newest token.
    socket.on("connect_error", () => {
      if (!socket.active) setTimeout(() => socket.connect(), 3000);
    });
  }
  return socket;
}

/** Close the live connection (on sign out). The next screen that needs it opens a new one. */
export function dropLive() {
  socket?.disconnect();
  socket = null;
}

/** Call `handler(event)` whenever one of `types` happens. types = ["delivery.recorded"] or "*" for all. */
export function useLiveEvent(types, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  const key = Array.isArray(types) ? types.join(",") : types;
  useEffect(() => {
    const s = getSocket();
    const fn = (ev) => {
      if (key === "*" || key.split(",").includes(ev.type) || ev.type === "demo.reset") ref.current(ev);
    };
    s.on("event", fn);
    return () => s.off("event", fn);
  }, [key]);
}

/**
 * Load data from the API and reload it automatically when a live event arrives.
 *   const { data, loading, error, reload } = useApi("/runs/RUN-VEH022", ["delivery.recorded"]);
 */
export function useApi(path, refreshOn = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(() => {
    if (!path) return;
    api
      .get(path)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })));
  }, [path]);
  useEffect(load, [load]);
  useLiveEvent(refreshOn.length ? refreshOn : ["__none__"], load);
  return { ...state, reload: load };
}

/**
 * Today (Sri Lanka) and the planning day (tomorrow), from the server clock. Both undefined until loaded,
 * so pass them to useApi like  useApi(today ? `/runs?date=${today}` : null).
 */
export function useDates() {
  const { data } = useApi("/meta");
  return { today: data?.meta.today, planDate: data?.meta.planDate };
}

/** Recent events, newest first, kept live. Used by the dispatcher feed. */
export function useEventFeed(limit = 30) {
  const [events, setEvents] = useState([]);
  const [fresh, setFresh] = useState(null);
  useEffect(() => {
    api
      .get(`/meta/events?limit=${limit}`)
      .then(setEvents)
      .catch(() => {});
  }, [limit]);
  useLiveEvent("*", (ev) => {
    if (ev.type === "demo.reset") return setEvents([]);
    setEvents((list) => [ev, ...list].slice(0, limit));
    setFresh(ev.id);
  });
  return { events, fresh };
}
