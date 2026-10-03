# 02 · Backend A: orders, planning, deferrals, notices

**You own the "decision" side:** what stores order, who waits for chilled trucks, and the message each store reads.

## You own

`server/src/logic/fairness.js`, `server/src/routes/orders.js`, `planning.js`, `deferrals.js`, `notices.js`, `server/test/fairness.test.js`, and your sections of `docs/API_CONTRACT.md` (Orders, Planning, Deferrals, Notices). You may add new files in `server/src/logic/` and `server/test/` with names starting with your area (for example `logic/cutoff.js`, `test/cutoff.test.js`).

## Already working

All endpoints in your sections of the API contract. The fairness rule with 5 passing tests. Deferrals create store notices and publish live events.

## Must

- [ ] **Cutoff rule** in `POST /orders` (there is a TODO). Orders placed after 16:00 Sri Lanka time for the next day go to the day after. Return the real `deliveryDate` and add `"cutoffMoved": true` when you moved it. Put the logic in a pure function `logic/cutoff.js` and test it in `test/cutoff.test.js` (see how `fairness.test.js` works).
- [ ] **Validation:** `POST /orders` rejects unknown `outletId`, empty lines, `qty <= 0` with a 400 and a clear message.
- [ ] **Run the tests** after every change: `npm test`.

## Should

- [ ] `POST /issues` for the store "report a problem" screen (SM7). It's in the "Requested endpoints" table of the API contract. Store issues in `db().issues` (create the array if missing: `d.issues ||= []`), publish `issue.reported`, and tell the Lead to add the event text to `shared/format.js`.
- [ ] Fairness: add a test for a tie (same gap, different size: the smaller order waits) and for "no deferrals needed" (orders ≤ slots: everyone is served).
- [ ] `GET /plan/suggest`: add `"waitsUntil"` (the next day) to each `wait` row so DP3 can show it.

## Nice

- [ ] `GET /orders/:id/timeline`: a list of steps (placed, planned, loaded, out for delivery, delivered or deferred) with times, for SM4.
- [ ] Notice text: if a store waited before, say when ("You also waited on Thursday 24 September").

## How to test without a frontend

Use the VS Code extension **REST Client** or **Thunder Client**, or the terminal:

```bash
curl http://localhost:4000/api/plan/suggest
curl -X POST http://localhost:4000/api/orders -H "content-type: application/json" \
  -d '{"outletId":"OUT014","deliveryDate":"2026-09-30","chilled":true,"lines":[{"sku":"SKU-7001","name":"Fresh milk 1 L, crate of 12","qty":2,"unit":"crate"}]}'
```

## Rules for you

- Never change the shape of an existing response (others read it). Adding fields is fine.
- Every change that matters to other screens must `publish(...)` an event.
- Keep logic in pure functions (`logic/`) so it can be tested. Routes only read the request, call the logic, save and respond.

## AI prompt (paste into Claude / Gemini / Antigravity)

```
You are helping me, BACKEND A, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/API_CONTRACT.md, docs/DATA_MODEL.md and docs/tasks/02-backend-a.md.
I ONLY own: server/src/logic/fairness.js, server/src/routes/orders.js, planning.js, deferrals.js,
notices.js, server/test/fairness.test.js, and new files I create in server/src/logic and server/test.
Never edit any other file. Node.js 20, Express, ES modules, the JSON db from server/src/db.js
(db(), save(), newId(), nowIso()), events via publish() from server/src/events.js.
Task: <paste ONE item from the Must list>.
Write a pure function in server/src/logic if there is logic, plus node:test tests in server/test.
Do not change existing response shapes. Update my section of docs/API_CONTRACT.md if the API changes.
Finish by telling me the files you changed and the curl commands to test.
```
