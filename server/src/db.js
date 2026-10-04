// Tiny JSON "database". Shape documented in docs/DATA_MODEL.md.
// Data lives in server/data/db.json (git-ignored). It is created from seed.json on first start.
// Reset to the demo seed any time with:  npm run reset-data
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(here, "seed.json");

let state = null;

export function reset() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.copyFileSync(SEED_FILE, DB_FILE);
  state = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  return state;
}

export function db() {
  if (!state) {
    if (!fs.existsSync(DB_FILE)) reset();
    else state = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return state;
}

let timer = null;
// Call save() after every change. Writes are batched so it is cheap.
export function save() {
  clearTimeout(timer);
  timer = setTimeout(() => fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2)), 50);
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

export const nowIso = () => new Date().toISOString();

// Run directly: node src/db.js --reset
if (process.argv[1] && process.argv[1].endsWith("db.js") && process.argv.includes("--reset")) {
  reset();
  console.log("Demo data reset from seed.json");
}
