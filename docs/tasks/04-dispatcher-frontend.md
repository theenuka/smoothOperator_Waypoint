# 04 · Dispatcher frontend (Kavindi, desktop)

**Kavindi plans tomorrow and decides who waits.** Your screens are where judges see the fairness story, and DP1 is on the projector for the whole demo.

## You own

Everything in `web/src/roles/dispatcher/`. You may add files there (for example `dispatcher.css`, `RunCard.jsx`).

| Screen | File | Route | State now |
|---|---|---|---|
| DP1 Today's run | `DP1Dashboard.jsx` | `/dispatcher/dashboard` | ✅ works: stats, runs, live feed, move a stop |
| DP2 Orders for Wednesday | `DP2OrderQueue.jsx` | `/dispatcher/orders` | 🟡 plain table + TODO |
| DP3 Plan and allocate | `DP3PlanAllocate.jsx` | `/dispatcher/plan` | ✅ works: capacity, fairness rule, who waits |
| DP4 Deferral decision | `DP4DeferralDecision.jsx` | `/dispatcher/decide` | ✅ works: message + confirm |
| DP5 Live tracking | `DP5LiveTracking.jsx` | `/dispatcher/tracking` | 🟡 vehicle list + TODO |
| DP6 Deferral log | `DP6DeferredLog.jsx` | `/dispatcher/deferrals` | ✅ works |

Designs: `web/public/design/DP1-Dashboard.jpg` … `DP6-DeferredLog.jpg`.

## Must

- [ ] **DP1** matches its design: run cards with stop progress, an "alerts" column (shortfalls, conflicts, offline trucks) above the live feed. Keep the feed live.
- [ ] **DP2**: filter chips (All / Chilled / Dry), outlet search, totals row, click a row to see its lines (`GET /api/orders/:id`). Remove the `<Todo/>`.
- [ ] **DP3** matches its design: a capacity bar (slots used vs available, the workshop truck shown as lost slots), and each row's reason clearly visible.
- [ ] **DP4**: show a live preview of what the store will see (title + reason, styled like SM5) next to the form.

## Should

- [ ] **DP5**: a list of trucks with "last seen" and a clear red state for "no signal", plus what it means ("deliveries are saved on the phone and will sync"). Remove the `<Todo/>`.
- [ ] **DP6**: filter by outlet; reversed deferrals show who reversed and why.

## Nice

- [ ] **DP5 map** with Leaflet (ask the Lead to install `leaflet` and `react-leaflet`): depot, outlets, VEH022's position, stops coloured by status.
- [ ] A sound or a gentle flash on DP1 when a conflict arrives.

## Data you use

`useApi("/runs?date=2026-09-29", [...events])`, `/plan?date=2026-09-30`, `/plan/suggest?date=2026-09-30`, `/orders?date=2026-09-30`, `/deferrals`, `/tracking`, `/sync/conflicts?status=open`, and `useEventFeed()` for the feed. All in `docs/API_CONTRACT.md`.

## AI prompt (paste into Claude / Gemini / Antigravity, attach the design image)

```
You are helping me, the DISPATCHER FRONTEND developer, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md and docs/tasks/04-dispatcher-frontend.md.
I ONLY own web/src/roles/dispatcher/. Never edit files outside that folder (no App.jsx, no shared/, no package.json).
React 18 + React Router 6, plain JS. Use the shared pieces: useApi/useEventFeed from ../../shared/live.js,
api from ../../shared/api.js, Card/Badge/Stat/PageHead/StatusBadge/useToast from ../../shared/ui.jsx,
CSS classes and var(--...) colours from web/src/shared/tokens.css. Extra CSS goes in roles/dispatcher/dispatcher.css.
Task: build <SCREEN CODE AND NAME> so it matches the attached design image (web/public/design/<CODE>-<Name>.jpg).
Use the real API data (no hard-coded numbers). Keep it live with the right event types.
Remove the <Todo/> block when done. Tell me which files changed and what to click to test it.
```
