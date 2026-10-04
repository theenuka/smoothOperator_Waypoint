# API contract

The agreement between frontend and backend. **If it's not written here, it doesn't exist.** To add or change an endpoint, the backend owner edits this file in the same pull request as the code.

- Base URL: `/api` (in the web app use `api.get("/runs")`, without `/api`).
- Request and response bodies are JSON. Errors always look like `{ "error": "message" }` with a 4xx or 5xx status.
- Times are ISO strings (`2026-09-29T08:52:00+05:30`). Dates are `YYYY-MM-DD`.
- Owner in brackets. ✅ = built in the starter, 🟡 = built but has a TODO, ⬜ = not built yet.

## Meta [Lead]

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /health` | | `{ ok, demoDate }` |
| ✅ | `GET /meta` | | `{ meta, depots, outlets, vehicles }` |
| ✅ | `GET /meta/events` | `?limit=50` | events, newest first |
| ✅ | `POST /meta/reset` | | `{ ok }`, publishes `demo.reset` |

## Orders [Backend A] {#orders}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /orders` | `?date=2026-09-30&outletId=OUT014&status=placed` (all optional) | orders with `outletName` |
| ✅ | `GET /orders/:id` | | order + `outletName`, `deferrals[]`, `deliveries[]`, `shortfalls[]` |
| ✅ | `POST /orders` | `{ outletId, deliveryDate, chilled, lines:[{ sku, name, qty, unit }] }` | the new order (201). Placed at or after the 16:00 cutoff (Sri Lanka time) for the next day: `deliveryDate` moves one day later and the response adds `"cutoffMoved": true`. Publishes `order.placed` |

`POST /orders` answers 400 `{ error }` with a plain message for an unknown `outletId`, no lines, a line without `sku`, or `qty <= 0`.

## Planning [Backend A] {#planning}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /plan` | `?date=2026-09-30` | `{ date, chilled:{ orders, slots, totalSlots, over }, reefers[], orders[], runs[] }` |
| ✅ | `GET /plan/suggest` | `?date=2026-09-30` | `{ date, slots, rule:[3 strings], rows:[{ rank, orderId, outletId, outletName, kg, protected, gapHours, deferrals14d, lastChilled, suggestion:"serve"\|"wait", reason }] }` |

## Deferrals [Backend A] {#deferrals}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /deferrals` | `?outletId=OUT014` | deferral log, newest first, with `outletName` |
| ✅ | `POST /deferrals` | `{ orderIds:[...], toDate, reason, decidedBy }` | created deferrals (201). Sets order `status:"deferred"`, creates a store notice (it names the store's previous wait, e.g. "You also waited on Friday 25 September."), publishes `deferral.decided` per order |
| ✅ | `POST /deferrals/:id/reverse` | `{ by, note }` | the deferral. Publishes `deferral.reversed` |

## Notices [Backend A] {#notices}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /notices` | `?outletId=OUT014` | `[{ id, outletId, type:"deferral"\|"shortfall"\|"failed", title, body, at, read }]` newest first |
| ✅ | `POST /notices/:id/read` | | the notice |
| 🟡 | `POST /issues` | `{ outletId, deliveryId, sku, problem:"short"|"damaged"|"wrong_item"|"past_date", note, qty?, fix?:"fix"|"credit", receivedBy? }` | the issue (201): `{ id, outletId, deliveryId, orderId, sku, problem, qty, fix, note, receivedBy, status:"open", at }`, stored in `db().issues`. 400 `{ error }` for unknown store, problem type or delivery. Publishes `issue.reported`. Router is `issues` exported from `routes/notices.js`; waiting for the Lead to mount it at `/api/issues` |

## Runs [Backend B] {#runs}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /runs` | `?date=2026-09-29&vehicleId=VEH022` | runs, expanded like below |
| ✅ | `GET /runs/:id` | | `{ id, vehicleId, vehicle, date, driver, bay, status, stops:[{ seq, outletId, outletName, outlet, orderId, order, eta, status:"delivered"\|"next"\|"pending"\|"failed", shortfalls[] }] }` |

## Loads (dock) [Backend B] {#loads}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /loads/:runId` | | `{ runId, status, lines:[{ orderId, stopSeq, sku, name, planned, loaded, checked }], shortfalls[] }` |
| ✅ | `POST /loads/:runId/check` | `{ orderId, sku, loaded }` | the line |
| ✅ | `POST /loads/:runId/shortfall` | `{ orderId, sku, loaded, reason:"short_on_dock"\|"damaged"\|"wrong_item"\|"never_arrived", by }` | the shortfall (201) with `backorder:{ orderId, deliveryDate, qty }`. The missing quantity is added to the outlet's next open order, or a new order for the next day is created (line marked `backorder:true, fromShortfall`). Creates a store notice, publishes `load.shortfall` |
| ✅ | `POST /loads/:runId/complete` | | the load with `status:"sealed"`. Publishes `load.completed` |

## Deliveries [Backend B] {#deliveries}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /deliveries` | `?runId=RUN-VEH022&outletId=OUT083` | deliveries |
| ✅ | `POST /deliveries` | one delivery record (below) | `{ status:"accepted"\|"duplicate"\|"conflict", delivery?, conflict? }`. `status` must be `delivered` or `failed` (400 otherwise). A failed record (DR4) marks the stop `failed`, moves "next" on, sends the store a notice with the reason, and with `goods:"return"` sets the order to `failed` for re-planning (`goods:"retry"` keeps it on the truck). When every stop is delivered or failed the run becomes `done` |

A **delivery record** (made on the phone, may be sent hours later):
```json
{ "clientId": "VEH022-1727600000000-ab12", "runId": "RUN-VEH022", "stopSeq": 3, "orderId": "ORD41803",
  "outletId": "OUT083", "status": "delivered", "signedBy": "Sunil Perera", "recordedAt": "2026-09-29T08:52:00+05:30" }
```
A failed record adds `"status": "failed", "issue": "store_closed"|"refused"|"damaged"|"cant_reach_dock"|"other", "note", "goods": "retry"|"return", "waitedMinutes"`.

`clientId` is made on the phone and makes sending twice safe (the second time is a `duplicate`).

## Sync [Backend B] {#sync}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `POST /sync` | `{ deviceId, records:[delivery records] }` | `{ accepted:[clientId], duplicates:[clientId], conflicts:[conflict], errors:[{ clientId, error }] }`. Records are applied oldest first; the same `clientId` twice is saved once; a bad record (e.g. unknown order) only lands in `errors` and the rest still sync. Errored records stay on the phone |
| ✅ | `GET /sync/conflicts` | `?runId=RUN-VEH022&status=open` | conflicts |
| ✅ | `POST /sync/resolve` | `{ conflictId, choice:"phone"\|"server", by }` | the conflict. `phone` = delivery kept and deferral reversed. Publishes `sync.resolved` |

A **conflict**: `{ id, clientId, runId, orderId, outletId, outletName, phone:{record}, server:{ status, changedAt, changedBy, deferralId, reason, toDate }, why, status:"open"\|"resolved", choice, resolvedBy, at }`

## Tracking [Backend B] {#tracking}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /tracking` | | `[{ vehicleId, lat, lng, at, online, place }]` |
| ✅ | `POST /tracking/ping` | `{ vehicleId, lat, lng }` | position. Publishes `vehicle.position` |
| ✅ | `POST /tracking/signal` | `{ vehicleId, online, place }` | position. Publishes `vehicle.offline` / `vehicle.online` |

## Live events (Socket.IO)

The server emits `"event"` with `{ id, type, at, payload }`. In React use `useApi(path, [types])` or `useLiveEvent(types, handler)`.

| Type | Payload | Who listens |
|---|---|---|
| `order.placed` | `{ orderId, outletId, outletName, deliveryDate }` | DP1, DP2 |
| `deferral.decided` | the deferral + `outletName` | DP1, DP3, DP6, SM1, SM5, DR1 |
| `deferral.reversed` | the deferral | DP6 |
| `load.shortfall` | the shortfall + `outletName`, `runId` | DP1, LD, DR1, DR2, SM5 |
| `load.completed` | `{ runId, shortfalls }` | DP1, LD1 |
| `delivery.recorded` | `{ orderId, outletName, runId, status:"delivered"\|"failed", issue?, goods?, recordedAt }` | DP1, DR1, SM1 |
| `sync.conflict` | `{ id, orderId, outletName }` | DP1, DR6 |
| `sync.resolved` | `{ conflictId, orderId, choice, by }` | DP1, DR6, SM5 |
| `vehicle.position` / `vehicle.offline` / `vehicle.online` | position | DP5 |
| `demo.reset` | `{}` | every `useApi` reloads |

## Requested endpoints (frontend writes here, backend builds)

| Requested by | Method and path | Body | Response | Owner | Status |
|---|---|---|---|---|---|
| Store FE | `POST /issues` | `{ outletId, deliveryId, sku, problem, note }` | the issue (201), publishes `issue.reported` | Backend A | 🟡 built, see Notices; needs mount in `index.js` |
