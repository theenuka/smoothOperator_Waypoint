# 03 · Backend B: runs, dock, deliveries, sync, tracking

**You own the "execution" side:** what goes on the truck, what the driver records, and how offline records come back without losing or overwriting anything. This is where both degradation scenarios live, so it must be rock solid.

## You own

`server/src/logic/conflict.js`, `server/src/routes/runs.js`, `loads.js`, `deliveries.js`, `sync.js`, `tracking.js`, `server/test/conflict.test.js`, and your sections of `docs/API_CONTRACT.md` (Runs, Loads, Deliveries, Sync, Tracking). You may add new files in `server/src/logic/` and `server/test/` (for example `logic/backorder.js`).

## Already working

Every endpoint in your sections. Shortfalls create a store notice and a live event. Sync is idempotent (the same `clientId` twice is saved once). Conflicts are detected and resolved (keeping the phone's delivery reverses the deferral). 4 conflict tests pass.

## Must

- [ ] **Back-order** (TODO in `loads.js`): when a shortfall is flagged, add the missing quantity to the outlet's next open order (or create a new order for the next day if there is none). Mark the line `"backorder": true` and `"fromShortfall": "<shortfall id>"`. Pure function in `logic/backorder.js` + a test.
- [ ] **Failed deliveries:** a record with `status: "failed"` (DR4, with `issue` and `note`) must set the stop to `failed`, keep the order not delivered, and publish `delivery.recorded` with the status. Check it works through `POST /sync` too.
- [ ] **More conflict tests:** the same record sent twice in one `POST /sync`; a record for an unknown order (should return a clear error for that record, not crash the whole sync).

## Should

- [ ] In `POST /sync`, one bad record must not stop the others: wrap each record in try/catch and return `"errors": [{ clientId, error }]` (add it to the API contract).
- [ ] `GET /runs/:id/summary` for DR7: delivered, failed, deferred counts, first and last delivery time, shortfalls handed over.
- [ ] `GET /tracking`: add `"silentMinutes"` (minutes since the last ping) so DP5 can show "no signal for 25 min".

## Nice

- [ ] A small script `server/src/sim.js` (ask the Lead to add `"sim": "node src/sim.js"` to `server/package.json`) that sends a ping for VEH022 every 5 seconds moving along the A1, so the map on DP5 moves during the demo.

## How to test

```bash
# offline sync with one clean record and one duplicate
curl -X POST http://localhost:4000/api/sync -H "content-type: application/json" \
  -d '{"deviceId":"t","records":[{"clientId":"x1","runId":"RUN-VEH022","orderId":"ORD41803","outletId":"OUT083","status":"delivered","recordedAt":"2026-09-29T08:52:00+05:30"}]}'
# run it again: x1 should come back under "duplicates"
curl http://localhost:4000/api/sync/conflicts?status=open
```

Or click through the driver app with **No signal** on (see `DEMO_SCRIPT.md` section 3).

## Rules for you

- **Never lose a record.** If something is unclear, store it and raise a conflict; don't drop it.
- Never change existing response shapes; adding fields is fine.
- Keep decisions in pure functions (`logic/`) with tests.

## AI prompt (paste into Claude / Gemini / Antigravity)

```
You are helping me, BACKEND B, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/API_CONTRACT.md, docs/DATA_MODEL.md and docs/tasks/03-backend-b.md.
I ONLY own: server/src/logic/conflict.js, server/src/routes/runs.js, loads.js, deliveries.js,
sync.js, tracking.js, server/test/conflict.test.js, and new files I create in server/src/logic and server/test.
Never edit any other file. Node.js 20, Express, ES modules, JSON db (db(), save(), newId(), nowIso()
from server/src/db.js), live events via publish() from server/src/events.js.
The most important rule: never lose or silently overwrite a delivery record.
Task: <paste ONE item from the Must list>.
Put logic in a pure function with node:test tests. Don't change existing response shapes.
Update my sections of docs/API_CONTRACT.md if the API changes. Tell me the files changed and how to test with curl.
```
