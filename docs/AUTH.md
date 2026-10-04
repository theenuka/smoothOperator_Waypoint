# Sign-in (Supabase Auth)

Sign-in is **off by default**. With no keys set, the app works exactly like the demo: the role picker, no login. Turn it on with two small `.env` files.

## What it does when on

- The web app shows a sign-in page. After sign-in, the user only opens the app of their own role. `/` takes them straight there.
- A bar above every role app shows the name, the role, the outlet (store managers) and **Sign out**.
- Every `/api` call must carry the Supabase access token (`Authorization: Bearer ...`). No token or an expired one gets `401`. A role calling something it may not use gets `403` (the table is `ACCESS` in `server/src/auth.js`). `/api/health` stays open.
- Live events (Socket.IO) only reach signed-in users.
- The role, name and outlet live in the user's Supabase **app_metadata**, which only an admin can change:
  `{ "role": "dispatcher" | "loader" | "driver" | "store", "name": "Kavindi Perera", "outletId": "OUT014" }`

## Turn it on (local)

1. Create a project at supabase.com. Authentication > Sign In / Providers: keep **Email** on.
2. Project Settings > API: copy the Project URL, the `anon` key and the `service_role` key.
3. `server/.env` (copy `server/.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_PASSWORD`.
4. `web/.env` (copy `web/.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Create the four demo accounts, one per role:
   ```bash
   node --env-file=server/.env scripts/create-demo-users.mjs
   ```
   `kavindi@waypoint.demo` (dispatcher), `ruwan@waypoint.demo` (loader), `chamara@waypoint.demo` (driver), `nadeeka@waypoint.demo` (store, OUT014). All use `DEMO_PASSWORD`.
6. `npm run dev`, open http://localhost:5173 and sign in.

The server checks tokens with Supabase's public signing keys (`/auth/v1/.well-known/jwks.json`). Older projects that still use the legacy JWT secret: set `SUPABASE_JWT_SECRET` in `server/.env` as well.

## Turn it on (Cloud Run)

- Server: `gcloud run services update waypoint --region asia-southeast1 --update-env-vars SUPABASE_URL=https://<ref>.supabase.co` (kept across deploys).
- Web: the `VITE_` values are baked in at build time. Put them in `web/.env.production` (they are public, so this file may be committed).
- The deploy smoke test calls `/api/runs`, which needs a token once sign-in is on. Point it at `/api/health` in `.github/workflows/deploy.yml` at the same time.

## Not done yet

- Store managers still see the demo outlet switch in the store app; the server does not yet limit them to their own `outletId`.
- The shared loader tablet signs in with email and password, not the PIN from the design.
