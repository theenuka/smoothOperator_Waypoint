# Demo script (about 5 minutes)

Two presenters: one talks, one clicks. Before every run press **Reset demo data** on the home page and reload all tabs.

## Setup

Open four browser windows, arranged so the judges see them:

1. Dispatcher: `/dispatcher/dashboard` (big, left)
2. Driver: `/driver/route` (phone size on the right; the app draws a phone frame on wide screens)
3. Loader: `/loader/home`
4. Store: `/store/today`, signed in as Nadeeka (OUT014 Dehiwala)

Optional: run `npm run sim` in another terminal so VEH022 moves along the A1 on the dispatcher's Live screen (DP5).

## 0. The problem (30 s)

"Retail chains in Sri Lanka lose the truth between the depot office, the dock, the truck and the store. Three problems: chilled trucks are always short, so someone waits and nobody knows why; the dock is short of stock, so trucks leave late or stores get surprises; and drivers lose signal on roads like the A1, so records get lost or overwritten. Waypoint gives every role one live truth."

## 1. Dock shortfall: degradation scenario 1 (60 s)

1. **Loader:** the dock home shows VEH037 waiting at bay 02. "Ruwan is loading the Colombo city run. The Kandy truck already left."
2. **Start loading.** It is loaded last stop first, so Kirulapone (stop 2) goes in against the cab. Tap **Rice, 5 kg bag**, count 3 of 4 → pick **Damaged** → **Flag 1 short and keep loading**.
3. Say: "The truck is not blocked." Load the remaining lines and **Finish loading**.
4. **Dispatcher** (point at it): the live feed already shows the shortfall for Kirulapone and the sealed truck, and Dock shortfalls went up. No refresh.
5. Say: "Kirulapone's manager gets a notice now, and the missing bag is already on their next order."
6. **Driver:** the Kandy run shows the earlier shortfall at Kegalle (6 of 10 detergent), known before he arrives.

## 2. Fair chilled planning (75 s)

1. **Dispatcher:** **Plan** tomorrow. "8 chilled orders, 5 reefer slots, because VEH031 is in the workshop."
2. Point at the rule and the table: "Negombo and Nugegoda waited yesterday, Dehiwala waited twice in two weeks, so they are protected. Kelaniya has the longest gap. Three stores that got chilled goods yesterday wait."
3. **Decide which 3 wait →** → read the live store preview → **Confirm 3 deferrals**.
4. **Store** (Dehiwala): Today says "You are protected on the next tight day", because Dehiwala already waited twice. The three stores that wait get a notice with the same reason the dispatcher read.
5. DP6 log: "Every decision is recorded with who made it and why."

## 3. No signal: degradation scenario 2 (90 s)

1. **Driver:** tap **Online** at the top to switch to **No signal**. "Chamara is in the Kadugannawa pass. No signal."
2. **Dispatcher:** the feed shows "VEH022 lost signal". (DP5 Live shows it too.)
3. **Driver:** Kegalle → **I've arrived · start handover** → the store manager signs on the screen, received by "Sunil Perera" → **Complete delivery**. It says "saved on phone". Do the same for Peradeniya.
4. **Dispatcher** meanwhile: on the Runs card press **Move Kandy City to tomorrow** → **Confirm**. "Dispatch thinks Kandy City can't be reached today."
5. **Driver:** Kandy City → hand it over anyway (he got there in time) → saved on phone.
6. **Driver:** tap **No signal** at the top to come back online. Two records sync silently. "Clean records just go through. No pop-ups."
7. **Driver:** Sync tab: "1 needs a decision. The phone says delivered, the office moved it to tomorrow." Tap **It was delivered, send my proof**.
8. **Dispatcher:** feed shows "Resolved ... kept the driver's delivery", the run is 5 of 5, and DP6 shows the deferral as reversed with the reason.

## 4. Close (30 s)

"What's real today: live updates across every role, an offline outbox that never loses a delivery, conflict detection with a human decision, and a fairness rule covered by tests. Next: real queries per route so it can run as several instances, route optimisation, and a PIN sign-in for the shared dock tablet. Waypoint: explain the decision, execute the run, never lose the truth in between."

## If something breaks on stage

- A screen looks wrong: in the dispatcher's top bar press **Reset to seed data**, reload the tabs, continue from the section you were in.
- The internet is down: run it locally with `docker compose up` (start it before the demo once, so the images are already downloaded) and open http://localhost:8080.
- Total failure: play the backup video (record one the night before).
