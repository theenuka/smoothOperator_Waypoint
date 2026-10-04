// Creates the four demo accounts in Supabase Auth, one per role. Owner: LEAD.  See docs/AUTH.md
// Run once:  node --env-file=server/.env scripts/create-demo-users.mjs
// Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (secret, never in the web app) and DEMO_PASSWORD.
// Safe to run again: existing accounts get their role, name and outlet updated.
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEMO_PASSWORD) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD in server/.env first.");
  process.exit(1);
}

const USERS = [
  { email: "kavindi@waypoint.demo", role: "dispatcher", name: "Kavindi Perera" },
  { email: "ruwan@waypoint.demo", role: "loader", name: "Ruwan Jayasinghe" },
  { email: "chamara@waypoint.demo", role: "driver", name: "Chamara Wickramasinghe" },
  { email: "nadeeka@waypoint.demo", role: "store", name: "Nadeeka Fernando", outletId: "OUT014" },
];

const admin = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`;
const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "content-type": "application/json",
};

const list = await fetch(`${admin}?per_page=1000`, { headers }).then((r) => r.json());
for (const { email, ...meta } of USERS) {
  const existing = (list.users || []).find((u) => u.email === email);
  const body = { email, password: DEMO_PASSWORD, email_confirm: true, app_metadata: meta };
  const res = await fetch(existing ? `${admin}/${existing.id}` : admin, {
    method: existing ? "PUT" : "POST",
    headers,
    body: JSON.stringify(body),
  });
  console.log(`${res.ok ? "ok  " : "FAIL"} ${existing ? "updated" : "created"} ${email} (${meta.role})`);
  if (!res.ok) console.log("     ", await res.text());
}
