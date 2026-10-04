// Live updates ("one fact, every screen").
// The server publishes an event for every important change. These hooks let a screen react.
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { api } from "./api.js";

let socket = null;
function getSocket() {
  if (!socket) socket = io({ path: "/socket.io" });
  return socket;
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
