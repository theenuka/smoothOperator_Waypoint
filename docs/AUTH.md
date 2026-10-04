# Sign-in and database (Supabase)

Sign-in and the Supabase database are **always on**, in development too. There is no open mode: without the keys the server refuses to start and the web app shows a setup page. For local work, `docker compose up` starts a local Supabase with the demo accounts (see the README); never point a local server at the live project.

## What it does

- The role picker stays. Each role card opens a **new tab** with a sign-in page for that role; after sign-in the tab continues into the role app. Each role app keeps its own sign-in (saved per role in the browser), so one browser can be signed in as all four roles at once, and reopening a role keeps it signed in. Sign out only signs that role out.
- "Reset to seed data" is in the dispatcher's bar.
- A bar above every role app shows the name, the role, the outlet (store managers) and **Sign out**.
- Every `/api` call must carry the Supabase access token (`Authorization: Bearer ...`). No token or an expired one gets `401`. A role calling something it may not use gets `403` (the table is `ACCESS` in `server/src/auth.js`). `/api/health` stays open.
- Live events (Socket.IO) only reach signed-in users.
- The role, name and outlet live in the user's Supabase **app_metadata**, which only an admin can change:
  `{ "role": "dispatcher" | "loader" | "driver" | "store", "name": "Kavindi Perera", "outletId": "OUT014" }`

## Database

The data lives in Supabase Postgres (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`). `server/data/db.json` is no longer used.

- Create the tables once: SQL Editor > paste `server/supabase/schema.sql` > Run. Row Level Security is on with no policies, so the public anon key can read nothing; only the server (service role key) reaches the tables.
- On its first start the server fills the empty tables from `seed.json`. "Reset to seed data" and `npm run reset-data` put the seed back in the tables.
- Each list (orders, runs, deferrals, ...) is a table of `{ id, pos, data }` rows; `meta`, `history`, `loads`, `positions` are rows in `app_state`. Routes did not change: `db()` and `save()` work as before, and `save()` sends only the rows that changed.
- Limit: the data is loaded into memory, so run one server instance (as today). Moving routes to real queries is the next step for scaling out.

## Set up (local)

1. Create a project at supabase.com. Authentication > Sign In / Providers: keep **Email** on.
2. Project Settings > API: copy the Project URL, the `anon` key and the `service_role` key.
3. `server/.env` (copy `server/.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_PASSWORD`.
4. `web/.env` (copy `web/.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Create the tables: SQL Editor > paste `server/supabase/schema.sql` > Run.
6. Create the four demo accounts, one per role:
   ```bash
   node --env-file=server/.env scripts/create-demo-users.mjs
   ```
   `kavindi@waypoint.demo` (dispatcher), `ruwan@waypoint.demo` (loader), `chamara@waypoint.demo` (driver), `nadeeka@waypoint.demo` (store, OUT014). All use `DEMO_PASSWORD`.
7. `npm run dev`, open http://localhost:5173, pick a role and sign in in the new tab.

The server checks tokens with Supabase's public signing keys (`/auth/v1/.well-known/jwks.json`). Older projects that still use the legacy JWT secret: set `SUPABASE_JWT_SECRET` in `server/.env` as well.

## Set up (Cloud Run)

Do this **before** merging: the server will not start on Cloud Run without these.

- Server: `gcloud run services update waypoint --region asia-southeast1 --update-env-vars SUPABASE_URL=https://<ref>.supabase.co,SUPABASE_SERVICE_ROLE_KEY=<key>` (kept across deploys; Secret Manager is better for the key).
- Web: the `VITE_` values are baked in at build time from `web/.env.production` (committed; the values are public).
- The deploy smoke test now calls `/api/health` (everything else needs sign-in).

## Not done yet

- Store managers still see the demo outlet switch in the store app; the server does not yet limit them to their own `outletId`.
- The shared loader tablet signs in with email and password, not the PIN from the design.
