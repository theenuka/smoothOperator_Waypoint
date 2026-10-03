# Waypoint

Team **smoothOperator** · Rootcode Tech-Triathlon 2026 · Hackathon

Waypoint is a delivery planning system for a retail chain with two depots and many outlets. It has four apps that share one live source of truth:

| Role | Person | Device | What they do in Waypoint |
|---|---|---|---|
| Dispatcher | Kavindi Perera | Desktop | Plans tomorrow's runs, decides who waits when chilled trucks are full (with a fair rule), explains why |
| Loader | Ruwan Jayasinghe | Shared tablet at the dock | Checks lines onto the truck, flags shortfalls without blocking the truck |
| Driver | Chamara Wickramasinghe | Own phone | Delivers with proof, keeps working with no signal, resolves sync conflicts |
| Store manager | Nadeeka Fernando | Desktop | Orders stock, sees what is coming and why things changed |

The two degradation scenarios from the brief both work end to end:

1. **Dock shortfall** (LD4): the loader flags 6 of 10 detergent. The truck still leaves. The store, the driver and dispatch see it at once, with the reason.
2. **No signal** (DR5, DR6): the driver keeps delivering offline. Records wait on the phone and sync when signal returns. If dispatch changed the same stop meanwhile, the driver gets one clear decision instead of a silent overwrite.

## Run it (first time)

You need **Node.js 20 or newer** (`node -v`) and **Git**.

```bash
git clone <your-repo-url>
cd waypoint
npm install
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:4000 (the web app forwards `/api` to it).

Useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and the web app together, both reload when you save |
| `npm test` | Runs the backend tests (fairness rule, sync conflicts) |
| `npm run build` | Builds the web app into `web/dist` |
| `npm start` | Production mode: the API also serves the built web app on one port |
| `npm run reset-data` | Puts the demo data back (stop `npm run dev` first), or press **Reset demo data** on the home page while it runs |
| `npm run format` | Formats all code the same way (run before every commit) |

## Folder map (who owns what)

```
server/src/
  index.js, db.js, events.js, seed.json, routes/_util.js, routes/meta.js   LEAD
  logic/fairness.js, routes/orders.js, planning.js, deferrals.js, notices.js   BACKEND A
  logic/conflict.js, routes/runs.js, loads.js, deliveries.js, sync.js, tracking.js   BACKEND B
web/src/
  main.jsx, App.jsx, shared/*                                                LEAD
  roles/dispatcher/*                                                         DISPATCHER FRONTEND
  roles/loader/*                                                             LOADER FRONTEND
  roles/driver/*                                                             DRIVER FRONTEND
  roles/store/*                                                              STORE FRONTEND
docs/, scripts/, .github/                                                    everyone reads, LEAD edits
```

**Rule number one: only edit files you own.** That is how seven people work at once with no merge conflicts. If you need a change in someone else's file, ask them in the group chat.

## Start here

1. Read [docs/START_HERE_SI.md](docs/START_HERE_SI.md) (Sinhala) or [docs/TEAM_PLAN.md](docs/TEAM_PLAN.md).
2. Find your task file in [docs/tasks/](docs/tasks/).
3. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/GIT_GUIDE.md](docs/GIT_GUIDE.md) (GitHub Flow: one branch per task, PR, CI, squash merge).
4. Paste your block from [docs/ANTIGRAVITY_PROMPTS.md](docs/ANTIGRAVITY_PROMPTS.md) into Antigravity. AI tools also read [AGENTS.md](AGENTS.md) automatically (Claude reads `CLAUDE.md`, Gemini and Antigravity read `GEMINI.md` and `.agent/rules/`, all say the same thing).

Other docs: [API contract](docs/API_CONTRACT.md) · [Data model](docs/DATA_MODEL.md) · [Design guide](docs/DESIGN_GUIDE.md) · [Demo script](docs/DEMO_SCRIPT.md) · [Deploy](docs/DEPLOY.md)

## Tech

Node.js 20, Express, Socket.IO (live updates), a JSON file as the database for the hackathon (`server/data/db.json`), React 18 with Vite and React Router. No database server to install. The production design (AWS serverless, Postgres with PostGIS, Terraform) is in the Designathon submission; this build is the working MVP of it.
