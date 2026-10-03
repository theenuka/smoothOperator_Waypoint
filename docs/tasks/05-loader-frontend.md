# 05 · Loader frontend (Ruwan, shared dock tablet)

**Ruwan loads trucks at 04:30 with gloves on, under sodium lamps.** Dark screen, huge numbers, huge buttons. Your LD4 screen is **degradation scenario 1**: flag a shortfall without blocking the truck.

## You own

Everything in `web/src/roles/loader/`. You may add files there (for example `loader.css`, `Counter.jsx`).

| Screen | File | Route | State now |
|---|---|---|---|
| LD1 Dock home | `LD1DockHome.jsx` | `/loader/home` | ✅ works: trucks with bay numbers |
| LD2 Load plan | `LD2LoadList.jsx` | `/loader/run/RUN-VEH022` | ✅ works: lines by stop, last stop first |
| LD3 Item check | `LD3ItemCheck.jsx` | `/loader/run/:runId/check/:orderId/:sku` | ⬜ TODO |
| LD4 Flag shortfall | `LD4FlagShortfall.jsx` | `/loader/run/:runId/short/:orderId/:sku` | ✅ works |
| LD5 Load complete | `LD5LoadComplete.jsx` | `/loader/run/:runId/complete` | ✅ works: seal the truck |
| LD6 Loading history | `LD6LoadingHistory.jsx` | `/loader/history` | ⬜ TODO |

Designs: `web/public/design/LD1-DockHome.jpg` … `LD6-LoadingHistory.jpg`. Test at 1180 × 820 (iPad landscape).

## Must

- [ ] **LD3 Item check**: product name huge, planned count, big − / + (at least 64 px), "All loaded" → `POST /api/loads/:runId/check`. If loaded < planned, go to LD4 instead. Remove the `<Todo/>`.
- [ ] **LD2** matches its design: a progress bar for the truck (lines checked / total), stop headers like painted bay signs, shortfall lines in red.
- [ ] **LD4** matches its design and makes it obvious that the truck is NOT blocked and who gets told.

## Should

- [ ] **LD6 Loading history**: today's trucks with sealed time, loaded vs planned, shortfalls with reason and who flagged them. Remove the `<Todo/>`.
- [ ] **LD1**: show how many lines are left per truck and which bay is being loaded now (yellow).

## Nice

- [ ] A fake "scan" field on LD2: type or paste a SKU, press Enter, it opens LD3 for that line.
- [ ] Keyboard shortcuts on LD3/LD4 (− and + keys, Enter to confirm).

## Data you use

`/runs?date=2026-09-29`, `/runs/:id`, `/loads/:runId`, `POST /loads/:runId/check`, `POST /loads/:runId/shortfall`, `POST /loads/:runId/complete`. Events: `load.shortfall`, `load.completed`.

## AI prompt (paste into Claude / Gemini / Antigravity, attach the design image)

```
You are helping me, the LOADER FRONTEND developer, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md and docs/tasks/05-loader-frontend.md.
I ONLY own web/src/roles/loader/. Never edit files outside that folder (no App.jsx, no shared/, no package.json).
The loader app is a DARK tablet UI (the .dock classes in web/src/shared/tokens.css) used with gloves:
huge numbers, buttons at least 56px tall, very short text. React 18 + React Router 6, plain JS.
Use useApi from ../../shared/live.js, api from ../../shared/api.js, Card/Badge/useToast from ../../shared/ui.jsx.
Extra CSS goes in roles/loader/loader.css. Link with absolute paths like /loader/run/RUN-VEH022.
Task: build <SCREEN CODE AND NAME> so it matches the attached design image.
Use real API data. Remove the <Todo/> when done. Tell me which files changed and what to click to test.
```
