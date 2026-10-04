// Loads server/.env (Supabase keys) when it exists. Import this first. Owner: LEAD.  See docs/AUTH.md
// Values already set in the environment win (process.loadEnvFile never overwrites them).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
