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
| 🟡 | `POST /orders` | `{ outletId, deliveryDate, chilled, lines:[{ sku, name, qty, unit }] }` | the new order (201). TODO: 16:00 cutoff check. Publishes `order.placed` |

## Planning [Backend A] {#planning}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /plan` | `?date=2026-09-30` | `{ date, chilled:{ orders, slots, totalSlots, over }, reefers[], orders[], runs[] }` |
| ✅ | `GET /plan/suggest` | `?date=2026-09-30` | `{ date, slots, rule:[3 strings], rows:[{ rank, orderId, outletId, outletName, kg, protected, gapHours, deferrals14d, lastChilled, suggestion:"serve"\|"wait", reason }] }` |

## Deferrals [Backend A] {#deferrals}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /deferrals` | `?outletId=OUT014` | deferral log, newest first, with `outletName` |
| ✅ | `POST /deferrals` | `{ orderIds:[...], toDate, reason, decidedBy }` | created deferrals (201). Sets order `status:"deferred"`, creates a store notice, publishes `deferral.decided` per order |
| ✅ | `POST /deferrals/:id/reverse` | `{ by, note }` | the deferral. Publishes `deferral.reversed` |

## Notices [Backend A] {#notices}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /notices` | `?outletId=OUT014` | `[{ id, outletId, type:"deferral"\|"shortfall", title, body, at, read }]` newest first |
| ✅ | `POST /notices/:id/read` | | the notice |

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
| 🟡 | `POST /loads/:runId/shortfall` | `{ orderId, sku, loaded, reason:"short_on_dock"\|"damaged"\|"wrong_item"\|"never_arrived", by }` | the shortfall (201). Creates a store notice, publishes `load.shortfall`. TODO: back-order onto the next order |
| ✅ | `POST /loads/:runId/complete` | | the load with `status:"sealed"`. Publishes `load.completed` |

## Deliveries [Backend B] {#deliveries}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `GET /deliveries` | `?runId=RUN-VEH022&outletId=OUT083` | deliveries |
| ✅ | `POST /deliveries` | one delivery record (below) | `{ status:"accepted"\|"duplicate"\|"conflict", delivery?, conflict? }` |

A **delivery record** (made on the phone, may be sent hours later):
```json
{ "clientId": "VEH022-1727600000000-ab12", "runId": "RUN-VEH022", "stopSeq": 3, "orderId": "ORD41803",
  "outletId": "OUT083", "status": "delivered", "signedBy": "Sunil Perera", "recordedAt": "2026-09-29T08:52:00+05:30" }
```
`clientId` is made on the phone and makes sending twice safe (the second time is a `duplicate`).

## Sync [Backend B] {#sync}

| | Method and path | Body / query | Returns |
|---|---|---|---|
| ✅ | `POST /sync` | `{ deviceId, records:[delivery records] }` | `{ accepted:[clientId], duplicates:[clientId], conflicts:[conflict] }` |
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
| `delivery.recorded` | `{ orderId, outletName, runId, status, recordedAt }` | DP1, DR1, SM1 |
| `sync.conflict` | `{ id, orderId, outletName }` | DP1, DR6 |
| `sync.resolved` | `{ conflictId, orderId, choice, by }` | DP1, DR6, SM5 |
| `vehicle.position` / `vehicle.offline` / `vehicle.online` | position | DP5 |
| `demo.reset` | `{}` | every `useApi` reloads |

## Requested endpoints (frontend writes here, backend builds)

| Requested by | Method and path | Body | Response | Owner | Status |
|---|---|---|---|---|---|
| Store FE | `POST /issues` | `{ outletId, deliveryId, sku, problem, note }` | the issue (201), publishes `issue.reported` | Backend A | ⬜ |
