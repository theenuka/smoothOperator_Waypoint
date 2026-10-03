# 06 · Driver frontend (Chamara, own phone)

**Chamara drives the A1 to Kandy and loses signal in the hills.** Your screens are **degradation scenario 2**: deliveries keep working offline, sync by themselves, and real disagreements get one clear decision. This is the most important demo moment, so it must never fail.

## You own

Everything in `web/src/roles/driver/` including `outbox.js` (the offline queue). You may add files there (for example `driver.css`, `SignaturePad.jsx`).

| Screen | File | Route | State now |
|---|---|---|---|
| DR1 Today's route | `DR1TodaysRoute.jsx` | `/driver/route` | ✅ works |
| DR2 Active stop | `DR2ActiveStop.jsx` | `/driver/stop/3` | ✅ works, shows the shortfall |
| DR3 Proof of delivery | `DR3ProofOfDelivery.jsx` | `/driver/stop/3/deliver` | ✅ works (name + checkbox), saves offline |
| DR4 Issue at stop | `DR4IssueAtStop.jsx` | `/driver/stop/3/issue` | ⬜ TODO |
| DR5 Offline mode | `DR5OfflineMode.jsx` | `/driver/outbox` | ✅ works: outbox list, signal switch |
| DR6 Sync and reconcile | `DR6SyncReconcile.jsx` | `/driver/sync` | ✅ works: two choices |
| DR7 Trip summary | `DR7TripSummary.jsx` | `/driver/summary` | ⬜ TODO |

Designs: `web/public/design/DR1-TodaysRoute.jpg` … `DR7-TripSummary.jpg`. Test in Chrome DevTools device mode, iPhone 12 Pro (390 × 844).

## How offline works (read `outbox.js`, it's short)

`addRecord({...})` saves to `localStorage` first, then tries `POST /api/sync`. With **No signal** on (the switch at the top), nothing is sent; the record waits. Switching back to **Online** sends everything. The server answers `accepted`, `duplicates` and `conflicts`. Conflicts appear on DR6 from `GET /api/sync/conflicts`.

## Must

- [ ] **DR4 Issue at stop**: big buttons for the problem (store closed, refused items, damaged, can't reach dock), optional note, save with `addRecord({ ..., status: "failed", issue, note })`. Works offline. Remove the `<Todo/>`.
- [ ] **DR3** matches its design: a simple signature pad (HTML `<canvas>` with pointer events; save `canvas.toDataURL()` as `signature` in the record), item checklist from `stop.order.lines`, the shortfall shown.
- [ ] **DR1, DR2, DR5, DR6** match their designs. DR5 must make it obvious that nothing is lost.
- [ ] Test the full offline flow from `DEMO_SCRIPT.md` section 3 at least five times, including a page reload while offline (the outbox must survive it).

## Should

- [ ] **DR7 Trip summary**: delivered / failed / deferred counts, shortfalls handed over, anything still on the phone. Remove the `<Todo/>`.
- [ ] Real offline too: listen to `window` `online`/`offline` events and call `setOnline` (keep the demo switch).
- [ ] After a sync, show a small toast: "2 deliveries sent".

## Nice

- [ ] Photo proof: `<input type="file" accept="image/*" capture="environment">`, shrink it with a canvas to about 800 px, store as a data URL.
- [ ] Make it installable on the phone (ask the Lead about a `manifest.json`).

## Data you use

`/runs/RUN-VEH022`, `POST /sync`, `GET /sync/conflicts?runId=RUN-VEH022&status=open`, `POST /sync/resolve`, `/deliveries?runId=RUN-VEH022`. Events: `delivery.recorded`, `sync.conflict`, `sync.resolved`, `deferral.decided`, `load.shortfall`.

## AI prompt (paste into Claude / Gemini / Antigravity, attach the design image)

```
You are helping me, the DRIVER FRONTEND developer, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md, docs/tasks/06-driver-frontend.md
and web/src/roles/driver/outbox.js.
I ONLY own web/src/roles/driver/. Never edit files outside that folder (no App.jsx, no shared/, no package.json).
This is a PHONE UI (390px wide), one hand, in a truck: one main action per screen, buttons at least 48px
(className "btn now big block"). Every record must go through addRecord() in outbox.js so it works with no signal.
Never send directly to the API from a screen. React 18 + React Router 6, plain JS.
Use useApi from ../../shared/live.js and Card/Badge/useToast from ../../shared/ui.jsx; extra CSS in roles/driver/driver.css.
Task: build <SCREEN CODE AND NAME> so it matches the attached design image.
Remove the <Todo/> when done. Tell me which files changed and how to test it, including with "No signal" switched on.
```
