// The app's data, kept in Supabase Postgres. Shape documented in docs/DATA_MODEL.md.
// Routes use db() (one plain object) and save() (sends what changed). Tables: server/supabase/schema.sql
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env (docs/AUTH.md); the server will not start without them.
// Empty tables are filled from seed.json on the first start. Reset to the seed any time with:  npm run reset-data
import "./env.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseStore, diff, markSaved } from "./supabaseStore.js";
import { shiftSeed, todayInColombo } from "./logic/seedDates.js";

const SEED_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "seed.json");

let state = null;
let remote = null; // the Supabase store
let saved = null; // what Supabase holds now, to send only changes
let writing = Promise.resolve();

// The seed scenario, moved so that it happens today (Sri Lanka date).
const seed = () => shiftSeed(JSON.parse(fs.readFileSync(SEED_FILE, "utf8")), todayInColombo());

// Call once before the server starts. Loads the data from Supabase (filling it from the seed when empty).
export async function init() {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key)
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Add them to server/.env (see docs/AUTH.md)."
    );
  remote = supabaseStore({ url, key });
  ({ state, saved } = await remote.load());
  if (!state) {
    console.log("Supabase is empty: loading the data from seed.json");
    state = seed();
    await flush();
  }
  console.log(`Data: Supabase Postgres (${state.orders.length} orders, ${state.outlets.length} outlets)`);
  return state;
}

// Puts the seed data back, in memory and in Supabase.
export function reset() {
  state = seed();
  save();
  return state;
}

export function db() {
  if (!state) throw new Error("db() was called before init()");
  return state;
}

// Sends what changed to Supabase. Writes run one after another; a failed one is retried by the next save().
export function flush() {
  writing = writing
    .then(async () => {
      const changes = diff(state, saved);
      await remote.write(changes);
      markSaved(saved, changes);
    })
    .catch((e) => console.error("Could not save to Supabase:", e.message));
  return writing;
}

let timer = null;
// Call save() after every change. Writes are batched so it is cheap.
export function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 50);
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

export const nowIso = () => new Date().toISOString();

// Run directly: node src/db.js --reset
if (process.argv[1] && process.argv[1].endsWith("db.js") && process.argv.includes("--reset")) {
  await init();
  state = seed();
  await flush();
  console.log("Data reset from seed.json");
}
