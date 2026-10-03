# 07 · Store frontend (Nadeeka, store manager, desktop)

**Nadeeka orders stock for Dehiwala and wants to know what is coming, and why when it changes.** Your SM5 notice is where the judges see that Waypoint explains decisions instead of just changing dates.

## You own

Everything in `web/src/roles/store/`. You may add files there (for example `store.css`, `ProductPicker.jsx`).

| Screen | File | Route | State now |
|---|---|---|---|
| SM1 Today | `SM1Dashboard.jsx` | `/store/today` | ✅ works |
| SM2 Place order | `SM2PlaceOrder.jsx` | `/store/order` | ⬜ TODO |
| SM3 Orders | `SM3OrderQueue.jsx` | `/store/orders` | 🟡 table + TODO |
| SM4 Order detail | `SM4OrderDetail.jsx` | `/store/orders/ORD41903` | ⬜ TODO |
| SM5 Notices | `SM5DeferralNotice.jsx` | `/store/notices` | ✅ works, live |
| SM6 Check what arrived | `SM6ConfirmReceipt.jsx` | `/store/receive` | ⬜ TODO |
| SM7 Report a problem | `SM7ReportIssue.jsx` | `/store/issue` | ⬜ TODO |

The dropdown at the top switches outlet (OUT014 Dehiwala, OUT083 Kegalle, OUT072 Kandy City, OUT022 Borella) so you can demo every store's view. Each screen gets `outletId` as a prop.

Designs: `web/public/design/SM1-Dashboard.jpg` … `SM7-ReportIssue.jpg`.

## Must

- [ ] **SM2 Place order**: product list with − / + steppers, chilled toggle, delivery date, the 16:00 cutoff shown clearly, `POST /api/orders`. Show the new order and go to SM3. Remove the `<Todo/>`.
- [ ] **SM5** matches its design: the new date big, the "why" block, a line saying the store is protected next time.
- [ ] **SM4 Order detail**: a timeline (placed → planned → loaded → on the road → delivered, or moved with the reason), shortfalls and deferrals from `GET /api/orders/:id`. Remove the `<Todo/>`.

## Should

- [ ] **SM3**: tabs Coming / Delivered / Moved. Remove the `<Todo/>`.
- [ ] **SM1** matches its design: the next delivery as the hero card (date, ETA, chilled or dry), unread notices on top.
- [ ] **SM6 Check what arrived**: list today's delivered lines, tick or correct the counts.

## Nice

- [ ] **SM7 Report a problem** using `POST /api/issues` (ask Backend A; it's in the "Requested endpoints" table). Until it exists, show the form and a toast.
- [ ] Unread notice count as a red badge on the "Notices" menu item (ask the Lead: the menu is in `shared/shells.jsx`).

## Data you use

`/orders?outletId=...`, `/orders/:id`, `POST /orders`, `/notices?outletId=...`, `POST /notices/:id/read`, `/deliveries?outletId=...`. Events: `deferral.decided`, `load.shortfall`, `delivery.recorded`, `sync.resolved`, `order.placed`.

Product list for SM2: use the SKUs that appear in `server/src/seed.json` (rice, coconut oil, crackers, detergent, tea; milk, yoghurt and the other chilled items). Put them in a constant in your own file, for example `roles/store/products.js`.

## AI prompt (paste into Claude / Gemini / Antigravity, attach the design image)

```
You are helping me, the STORE FRONTEND developer, in a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md and docs/tasks/07-store-frontend.md.
I ONLY own web/src/roles/store/. Never edit files outside that folder (no App.jsx, no shared/, no package.json).
Desktop UI for a store manager. React 18 + React Router 6, plain JS. Each screen receives the prop outletId.
Use useApi from ../../shared/live.js, api from ../../shared/api.js, Card/Badge/Stat/PageHead/StatusBadge/useToast
from ../../shared/ui.jsx, and the CSS classes and var(--...) colours from web/src/shared/tokens.css.
Extra CSS goes in roles/store/store.css. Write UI text in plain, calm English.
Task: build <SCREEN CODE AND NAME> so it matches the attached design image.
Use real API data. Remove the <Todo/> when done. Tell me which files changed and what to click to test it.
```
