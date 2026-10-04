// The app's data. Shape documented in docs/DATA_MODEL.md.
// Two places it can live, same db() / save() for every route:
//   Supabase Postgres  when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (docs/AUTH.md)
//   server/data/db.json (git-ignored) otherwise, like the demo
// Both start from seed.json. Reset to the demo seed any time with:  npm run reset-data
import "./env.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseStore, diff, markSaved } from "./supabaseStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(here, "seed.json");

let state = null;
let remote = null; // the Supabase store, when used
let saved = null; // what Supabase holds now, to send only changes
let writing = Promise.resolve();

const seed = () => JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));

// Call once before the server starts. Loads the data from Supabase (filling it from the seed when empty).
export async function init() {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) return db();
  remote = supabaseStore({ url, key });
  ({ state, saved } = await remote.load());
  if (!state) {
    console.log("Supabase is empty: loading the demo data from seed.json");
    state = seed();
    await flush();
  }
  console.log("Data: Supabase Postgres");
  return state;
}

export function reset() {
  if (remote) {
    state = seed();
    save();
    return state;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.copyFileSync(SEED_FILE, DB_FILE);
  state = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  return state;
}

export function db() {
  if (!state) {
    if (remote) throw new Error("db() was called before init()");
    if (!fs.existsSync(DB_FILE)) reset();
    else state = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
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
  timer = setTimeout(
    () => (remote ? flush() : fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2))),
    50
  );
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

export const nowIso = () => new Date().toISOString();

// Run directly: node src/db.js --reset
if (process.argv[1] && process.argv[1].endsWith("db.js") && process.argv.includes("--reset")) {
  await init();
  reset();
  if (remote) await flush();
  console.log("Demo data reset from seed.json");
}
