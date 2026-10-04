# API contract

The contract between the web app and the API. Any change to an endpoint is made in this file in the same pull request as the code.

- Base URL: `/api` (in the web app use `api.get("/runs")`, without `/api`).
- Request and response bodies are JSON. Errors always look like `{ "error": "message" }` with a 4xx or 5xx status.
- Times are ISO strings (`2026-09-29T08:52:00+05:30`). Dates are `YYYY-MM-DD`.
- Sign-in (off unless Supabase is set up, see `docs/AUTH.md`): every call sends `Authorization: Bearer <token>` (`api.js` does it). No or expired token: `401`. A role that may not use an endpoint: `403`. `GET /health` is always open.

## Meta

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /health` | | `{ ok, today }` |
| `GET /meta` | | `{ meta, depots, outlets, vehicles }`. `meta.today` is the real date in Sri Lanka and `meta.planDate` is tomorrow, from the server clock (`meta.demoDate` = `today`, kept for old screens). Web: `useDates()` from `shared/live.js` |
| `GET /meta/events` | `?limit=50` | events, newest first |
| `POST /meta/reset` | | `{ ok }`, publishes `demo.reset`. Puts the seed back, moved so its story happens today: every seed date shifts by the same number of days |

## Orders {#orders}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /orders` | `?date=2026-09-30&outletId=OUT014&status=placed` (all optional) | orders with `outletName` |
| `GET /orders/:id` | | order + `outletName`, `deferrals[]`, `deliveries[]`, `shortfalls[]` |
| `GET /orders/:id/timeline` | | `[{ step:"placed"\|"planned"\|"loaded"\|"out"\|"delivered"\|"failed"\|"deferred", label, at, done }]` in order. `at` is an ISO time or `null` when unknown. A deferred order stops at `deferred` |
| `POST /orders` | `{ outletId, deliveryDate, chilled, lines:[{ sku, name, qty, unit }] }` | the new order (201). Placed at or after the 16:00 cutoff (Sri Lanka time) for the next day: `deliveryDate` moves one day later and the response adds `"cutoffMoved": true`. Publishes `order.placed` |

`POST /orders` answers 400 `{ error }` with a plain message for an unknown `outletId`, no lines, a line without `sku`, or `qty <= 0`.

## Planning {#planning}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /plan` | `?date=2026-09-30` | `{ date, chilled:{ orders, slots, totalSlots, over }, reefers[], orders[], runs[] }` |
| `GET /plan/suggest` | `?date=2026-09-30` | `{ date, slots, rule:[3 strings], rows:[{ rank, orderId, outletId, outletName, kg, protected, gapHours, deferrals14d, lastChilled, suggestion:"serve"\|"wait", reason, waitsUntil? }] }`. `waitsUntil` (YYYY-MM-DD, the next day) is only on `wait` rows |

## Deferrals {#deferrals}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /deferrals` | `?outletId=OUT014` | deferral log, newest first, with `outletName` |
| `GET /deferrals/preview` | `?orderId=ORD41907&toDate=2026-10-01` | exactly what the store will be told if this order moves, saves nothing: `{ orderId, outletId, outletName, toDate, title, body, signedBy, tiles:[{ label, value, tone? }], footnote, suggestedReason }`. Tiles come from the data: lines and kg, the new date with the outlet dock window, the days it cannot wait again. DP4 shows it |
| `POST /deferrals` | `{ orderIds:[...], toDate, reason }` | created deferrals (201). `decidedBy` is the signed-in user. Sets order `status:"deferred"`, creates a store notice built like the preview (adds `signedBy`, `tiles`, `footnote`; names the previous wait), publishes `deferral.decided` per order. An unknown order id changes nothing (404) |
| `POST /deferrals/:id/reverse` | `{ by, note }` | the deferral. Publishes `deferral.reversed` |

## Notices and store issues {#notices}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /notices` | `?outletId=OUT014` | `[{ id, outletId, type:"deferral"\|"shortfall"\|"failed", title, body, at, read }]` newest first |
| `POST /notices/:id/read` | | the notice |
| `POST /issues` | `{ outletId, deliveryId, sku, problem:"short"\|"damaged"\|"wrong_item"\|"past_date", note, qty?, fix?:"fix"\|"credit", receivedBy? }` | the issue (201): `{ id, outletId, deliveryId, orderId, sku, problem, qty, fix, note, receivedBy, status:"open", at }`, stored in `db().issues`. 400 `{ error }` for unknown store, problem type or delivery. Publishes `issue.reported`. |

## Runs {#runs}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /runs` | `?date=2026-09-29&vehicleId=VEH022` | runs, expanded like below |
| `GET /runs/:id` | | `{ id, vehicleId, vehicle, date, driver, bay, status, stops:[{ seq, outletId, outletName, outlet, orderId, order, eta, status:"delivered"\|"next"\|"pending"\|"failed", shortfalls[] }] }` |
| `GET /runs/:id/summary` | | `{ runId, vehicleId, driver, stops, delivered, failed, deferred, pending, firstDeliveryAt, lastDeliveryAt, shortfallsHandedOver:[{ orderId, outletId, name, missing }], done }` |

## Loads (dock) {#loads}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /loads/:runId` | | `{ runId, status, lines:[{ orderId, stopSeq, sku, name, planned, loaded, checked }], shortfalls[] }` |
| `POST /loads/:runId/check` | `{ orderId, sku, loaded }` | the line |
| `POST /loads/:runId/shortfall` | `{ orderId, sku, loaded, reason:"short_on_dock"\|"damaged"\|"wrong_item"\|"never_arrived", by }` | the shortfall (201) with `backorder:{ orderId, deliveryDate, qty }`. The missing quantity is added to the outlet's next open order, or a new order for the next day is created (line marked `backorder:true, fromShortfall`). Creates a store notice, publishes `load.shortfall` |
| `POST /loads/:runId/complete` | | the load with `status:"sealed"`. Publishes `load.completed` |

## Deliveries {#deliveries}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /deliveries` | `?runId=RUN-VEH022&outletId=OUT083` | deliveries |
| `POST /deliveries` | one delivery record (below) | `{ status:"accepted"\|"duplicate"\|"conflict", delivery?, conflict? }`. `status` must be `delivered` or `failed` (400 otherwise). A failed record (DR4) marks the stop `failed`, moves "next" on, sends the store a notice with the reason, and with `goods:"return"` sets the order to `failed` for re-planning (`goods:"retry"` keeps it on the truck). When every stop is delivered or failed the run becomes `done` |

A **delivery record** (made on the phone, may be sent hours later):
```json
{ "clientId": "VEH022-1727600000000-ab12", "runId": "RUN-VEH022", "stopSeq": 3, "orderId": "ORD41803",
  "outletId": "OUT083", "status": "delivered", "signedBy": "Sunil Perera", "recordedAt": "2026-09-29T08:52:00+05:30" }
```
A failed record adds `"status": "failed", "issue": "store_closed"|"refused"|"damaged"|"cant_reach_dock"|"other", "note", "goods": "retry"|"return", "waitedMinutes"`.

`clientId` is made on the phone and makes sending twice safe (the second time is a `duplicate`).

## Sync {#sync}

| Method and path | Body / query | Returns |
|---|---|---|
| `POST /sync` | `{ deviceId, records:[delivery records] }` | `{ accepted:[clientId], duplicates:[clientId], conflicts:[conflict], errors:[{ clientId, error }] }`. Records are applied oldest first; the same `clientId` twice is saved once; a bad record (e.g. unknown order) only lands in `errors` and the rest still sync. Errored records stay on the phone |
| `GET /sync/conflicts` | `?runId=RUN-VEH022&status=open` | conflicts |
| `POST /sync/resolve` | `{ conflictId, choice:"phone"\|"server", by }` | the conflict. `phone` = the phone record wins: a delivered record reverses the office deferral; a failed record marks the stop failed, supersedes the office delivery and notifies the store. Publishes `sync.resolved` |

A **conflict**: `{ id, clientId, runId, orderId, outletId, outletName, phone:{record}, server:{ status, changedAt, changedBy, deferralId, reason, toDate }, why, status:"open"\|"resolved", choice, resolvedBy, at }`

## Tracking {#tracking}

| Method and path | Body / query | Returns |
|---|---|---|
| `GET /tracking` | | `[{ vehicleId, lat, lng, at, online, place, silentMinutes }]`. `silentMinutes` is the time since the vehicle's last ping, measured against the freshest ping in the fleet |
| `POST /tracking/ping` | `{ vehicleId, lat, lng }` | position. Publishes `vehicle.position` |
| `POST /tracking/signal` | `{ vehicleId, online, place }` | position. Publishes `vehicle.offline` / `vehicle.online` |

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
