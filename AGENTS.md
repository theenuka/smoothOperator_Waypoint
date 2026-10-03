# AGENTS.md: context for AI coding assistants

You are helping one member of team smoothOperator build **Waypoint** for a hackathon with a deadline tomorrow. Seven beginners work in this repo at the same time. Your most important job is to **not create merge conflicts** and to **keep the app running**.

## Before you write any code

1. Ask (or check the prompt) which role you are helping: Lead, Backend A, Backend B, Dispatcher FE, Loader FE, Driver FE or Store FE.
2. Read that member's task file in `docs/tasks/` (01 to 07). It lists the files they own.
3. Read `docs/API_CONTRACT.md` for endpoints and `docs/DATA_MODEL.md` for data shapes.
4. Look at the target design image for the screen: `web/public/design/<CODE>-<Name>.jpg`.

## Hard rules

- **Only create or edit files owned by the current member.** Ownership is written at the top of each file (`Owner: ...`) and in the table below. If a change is needed in another owner's file, stop and tell the member what to ask that owner for. Do not "quickly fix" other files.
- Do not edit `package.json`, `package-lock.json`, `web/src/App.jsx`, `web/src/main.jsx`, `web/src/shared/*`, `server/src/index.js`, `server/src/db.js`, `server/src/events.js` or `server/src/seed.json` unless the member is the **Lead**.
- Do not add npm packages unless the member is the Lead. Plain React and CSS can do everything needed.
- Do not rename or move existing files, routes, exports or API endpoints. Other people's code imports them.
- Do not change the shape of API responses that already exist. You may add new fields. New endpoints must be added to `docs/API_CONTRACT.md` in the same change (Backend A/B own that section).
- Keep the code simple and readable for beginners: plain function components, `useState`, `useEffect`, the shared hooks. No TypeScript, no Redux, no CSS frameworks, no class components.
- Never commit `node_modules`, `server/data/` or `.env` files.
- After a change, the member must be able to run `npm run dev` with no errors and `npm test` must pass.

## File ownership

| Owner | Files |
|---|---|
| Lead | `package.json`, `web/package.json`, `server/package.json`, `server/src/index.js`, `db.js`, `events.js`, `seed.json`, `routes/_util.js`, `routes/meta.js`, `web/src/main.jsx`, `App.jsx`, `web/src/shared/*`, `docs/*`, `.github/*`, `scripts/*`, `AGENTS.md`, `CONTRIBUTING.md` |
| Backend A | `server/src/logic/fairness.js`, `server/src/routes/orders.js`, `planning.js`, `deferrals.js`, `notices.js`, `server/test/fairness.test.js` |
| Backend B | `server/src/logic/conflict.js`, `server/src/routes/runs.js`, `loads.js`, `deliveries.js`, `sync.js`, `tracking.js`, `server/test/conflict.test.js` |
| Dispatcher FE | `web/src/roles/dispatcher/*` (screens DP1 to DP6) |
| Loader FE | `web/src/roles/loader/*` (screens LD1 to LD6) |
| Driver FE | `web/src/roles/driver/*` (screens DR1 to DR7, `outbox.js`) |
| Store FE | `web/src/roles/store/*` (screens SM1 to SM7, `outlet.js`) |

A member may create **new** files inside their own folder (for example `web/src/roles/driver/SignaturePad.jsx` or `web/src/roles/driver/driver.css`).

## Project facts

- Monorepo with npm workspaces: `server/` (Express + Socket.IO, ES modules) and `web/` (React 18 + Vite + React Router 6).
- Database: a JSON file. Use `db()` to read, mutate the object, then call `save()`. Use `newId("PREFIX")` and `nowIso()` from `db.js`.
- Every important change calls `publish(type, payload)` from `events.js`. That writes the audit log and pushes the event to every open screen.
- Event types: `order.placed`, `deferral.decided`, `deferral.reversed`, `load.shortfall`, `load.completed`, `delivery.recorded`, `sync.conflict`, `sync.resolved`, `vehicle.position`, `vehicle.offline`, `vehicle.online`, `demo.reset`.
- Demo data: today is **Tuesday 29 September 2026**, planning **Wednesday 30 September**. Driver run `RUN-VEH022` (Chamara, VEH022, Kandy route, 5 stops). Shortfall `SF-1`: 6 of 10 detergent for Kegalle (OUT083). 8 chilled orders for Wednesday but only 5 reefer slots (VEH031 is in the workshop).
- Frontend calls the API with `api.get("/path")` and `api.post("/path", body)` from `web/src/shared/api.js` (paths without `/api`).
- Live data in a screen: `const { data, loading, error, reload } = useApi("/runs/RUN-VEH022", ["delivery.recorded"])` from `web/src/shared/live.js`. The second argument lists events that should reload the data.
- Shared UI in `web/src/shared/ui.jsx`: `Card`, `Badge`, `Stat`, `PageHead`, `StatusBadge`, `Loading`, `ErrorNote`, `Empty`, `useToast`, `Todo`. Formatting in `shared/format.js`: `time`, `day`, `kg`, `describe`.
- CSS classes from `web/src/shared/tokens.css`: `btn` (+ `now`, `secondary`, `danger`, `ghost`, `big`, `block`), `card`, `badge` (+ `now`, `bad`, `ok`, `cold`, `ink`), `notice` (+ `bad`, `ok`, `cold`), `table`, `input`, `select`, `textarea`, `field`, `label`, `row`, `col`, `stack`, `grid-2`, `grid-4`, `h-page`, `h-sec`, `muted`, `small`, `mono`, `stencil`.
- Colour meaning (never break it): yellow = "now / needs attention", red = short, conflict, offline, green = done, blue = chilled only, ink black = structure.
- Use the CSS variables (`var(--yellow)`, `var(--red)` and so on). Never hard-code new colours.
- Each role app (`DispatcherApp.jsx`, `LoaderApp.jsx`, `DriverApp.jsx`, `StoreApp.jsx`) holds that role's routes. To add a screen: create the file, import it, add one `<Route>` (and one `nav` item if it needs a menu link). Link with absolute paths like `/driver/stop/3`.
- A screen that is not built yet renders `<Todo ... />`. When you build it, delete the `<Todo/>`.

## Writing style in the UI

Plain, calm English that a tired loader at 04:30 understands. Say what happened and what happens next: "6 of 10 loaded. The other 4 arrive on the next delivery." No jargon ("sync conflict" becomes "phone and office disagree"), no exclamation marks, no emoji. Big touch targets on the tablet and phone (at least 48px).

## How to finish a task

1. Run `npm run dev`, open http://localhost:5173 and click through the screen.
2. Run `npm test` and `npm run format`.
3. Git (GitHub Flow, see `docs/GIT_GUIDE.md`): one short-lived branch per task named `<role>/<task>` made from the newest `main`; add only the member's own files by path (never `git add .`); Conventional Commit messages such as `feat(driver): DR4 issue screen saves offline`; push and open a pull request that fills the template and says `Closes #<issue>`. Never push to `main`, never merge, never force-push.
4. Ready-made agent prompts for each member: `docs/ANTIGRAVITY_PROMPTS.md`.
