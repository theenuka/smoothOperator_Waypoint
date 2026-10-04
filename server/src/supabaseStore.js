// Keeps the app data in Supabase Postgres. Owner: LEAD.  Tables: server/supabase/schema.sql
// db.js still hands routes one plain object (db(), save()), so no route changes. This file:
//   load()  reads every table into that object at start-up
//   write() sends only what changed since the last write
// Each list (orders, runs, ...) is a table of rows { id, pos, data }. `pos` keeps the list order.
// Everything else (meta, history, loads, positions) is one row in app_state { name, data }.
// ponytail: the whole data set sits in memory, so run ONE server. Move routes to real queries before scaling out.

export const TABLES = [
  "depots",
  "outlets",
  "vehicles",
  "orders",
  "deferrals",
  "runs",
  "deliveries",
  "conflicts",
  "notices",
  "issues",
  "events",
];

const isTable = (name, value) =>
  TABLES.includes(name) && Array.isArray(value) && value.every((x) => x && x.id != null);

// Positions for a list. Rows we saw before keep their number; new rows in front get smaller numbers,
// new rows after get bigger ones (or the middle of their neighbours). So adding a newest event with
// unshift() writes one row, not all 500. If the old order was shuffled, everything is renumbered.
export function withPositions(list, oldPos) {
  const pos = list.map((x) => oldPos.get(x.id));
  const known = pos.filter((p) => p !== undefined);
  if (!known.every((p, i) => i === 0 || p > known[i - 1]))
    return list.map((x, i) => ({ id: x.id, pos: i, data: x }));
  const first = pos.findIndex((p) => p !== undefined);
  if (first < 0) return list.map((x, i) => ({ id: x.id, pos: i, data: x }));
  for (let i = first - 1; i >= 0; i--) pos[i] = pos[i + 1] - 1;
  for (let i = first + 1; i < list.length; i++) {
    if (pos[i] !== undefined) continue;
    let j = i + 1;
    while (j < list.length && pos[j] === undefined) j++;
    pos[i] = j < list.length ? (pos[i - 1] + pos[j]) / 2 : pos[i - 1] + 1;
  }
  return list.map((x, i) => ({ id: x.id, pos: pos[i], data: x }));
}

// What to send so the database matches `state`. `saved` = what the database holds now:
//   { tables: { orders: Map(id -> { pos, json }) }, docs: Map(name -> json) }
export function diff(state, saved) {
  const upserts = {};
  const deletes = {};
  const docs = [];
  for (const [name, value] of Object.entries(state)) {
    if (isTable(name, value)) {
      const prev = saved.tables[name] || new Map();
      const rows = withPositions(value, new Map([...prev].map(([id, r]) => [id, r.pos])));
      const changed = rows.filter((r) => {
        const p = prev.get(r.id);
        return !p || p.pos !== r.pos || p.json !== JSON.stringify(r.data);
      });
      const ids = new Set(value.map((x) => x.id));
      const gone = [...prev.keys()].filter((id) => !ids.has(id));
      if (changed.length) upserts[name] = changed;
      if (gone.length) deletes[name] = gone;
    } else if (saved.docs.get(name) !== JSON.stringify(value)) {
      docs.push({ name, data: value });
    }
  }
  return { upserts, deletes, docs };
}

// After a successful write, remember it as the database's state.
export function markSaved(saved, { upserts, deletes, docs }) {
  for (const [t, rows] of Object.entries(upserts)) {
    saved.tables[t] ||= new Map();
    for (const r of rows) saved.tables[t].set(r.id, { pos: r.pos, json: JSON.stringify(r.data) });
  }
  for (const [t, ids] of Object.entries(deletes)) for (const id of ids) saved.tables[t].delete(id);
  for (const d of docs) saved.docs.set(d.name, JSON.stringify(d.data));
}

// Talks to Supabase's REST API with the service role key (server only, never in the browser).
export function supabaseStore({ url, key }) {
  const rest = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
  const call = async (method, path, body, prefer) => {
    const res = await fetch(rest + path, {
      method,
      headers: prefer ? { ...headers, prefer } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      const hint =
        res.status === 404 ? " (run server/supabase/schema.sql in the Supabase SQL editor first)" : "";
      throw new Error(`Supabase ${method} ${path.split("?")[0]} failed: ${res.status} ${text}${hint}`);
    }
    return method === "GET" ? res.json() : null;
  };
  const upsert = (path, rows) => call("POST", path, rows, "resolution=merge-duplicates,return=minimal");

  return {
    // Returns { state, saved }. state is null when the database is still empty.
    async load() {
      const state = {};
      const saved = { tables: {}, docs: new Map() };
      let empty = true;
      for (const t of TABLES) {
        // ponytail: Supabase returns at most 1000 rows per call by default; page with Range headers past that
        const rows = await call("GET", `/${t}?select=id,pos,data&order=pos.asc`);
        state[t] = rows.map((r) => r.data);
        saved.tables[t] = new Map(rows.map((r) => [r.id, { pos: r.pos, json: JSON.stringify(r.data) }]));
        if (rows.length) empty = false;
      }
      for (const d of await call("GET", "/app_state?select=name,data")) {
        state[d.name] = d.data;
        saved.docs.set(d.name, JSON.stringify(d.data));
        empty = false;
      }
      return { state: empty ? null : state, saved };
    },

    async write({ upserts, deletes, docs }) {
      for (const [t, rows] of Object.entries(upserts))
        for (let i = 0; i < rows.length; i += 500)
          await upsert(`/${t}?on_conflict=id`, rows.slice(i, i + 500));
      for (const [t, ids] of Object.entries(deletes)) {
        const list = ids.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(",");
        await call("DELETE", `/${t}?id=in.(${encodeURIComponent(list)})`);
      }
      if (docs.length) await upsert("/app_state?on_conflict=name", docs);
    },
  };
}
