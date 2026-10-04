# Demo script (about 5 minutes)

Two presenters: one talks, one clicks. Before every run press **Reset demo data** on the home page and reload all tabs.

## Setup

Open four browser windows, arranged so the judges see them:

1. Dispatcher: `/dispatcher/dashboard` (big, left)
2. Driver: `/driver/route` (phone size on the right; the app draws a phone frame on wide screens)
3. Loader: `/loader/home`
4. Store: `/store/today` (switch the outlet with the dropdown when told)

## 0. The problem (30 s)

"Retail chains in Sri Lanka lose the truth between the depot office, the dock, the truck and the store. Three problems: chilled trucks are always short, so someone waits and nobody knows why; the dock is short of stock, so trucks leave late or stores get surprises; and drivers lose signal on roads like the A1, so records get lost or overwritten. Waypoint gives every role one live truth."

## 1. Dock shortfall: degradation scenario 1 (60 s)

1. **Loader:** open VEH022 → load plan. "It's 04:30, Ruwan is loading the Kandy truck."
2. Press **Short** on Rice for Kandy City → set 4 of 5 → reason **Damaged** → **Flag 1 short and keep loading**.
3. Say: "The truck is not blocked."
4. **Dispatcher** (point at it): the live feed already shows "Short at the dock: 4 of 5 Rice, 5 kg bag for Kandy City" and Dock shortfalls went up. No refresh.
5. **Store:** switch to `OUT072 Kandy City` → Notices: "1 Rice, 5 kg bag arrive on the next delivery", with the reason.
6. **Driver:** the Kandy City stop shows "Short: 4/5 Rice".

## 2. Fair chilled planning (75 s)

1. **Dispatcher:** **Plan Wednesday**. "8 chilled orders, 5 reefer slots, because VEH031 is in the workshop."
2. Point at the rule and the table: "Negombo and Nugegoda waited yesterday, Dehiwala waited twice in two weeks, so they are protected. Kelaniya has the longest gap. Three stores that got chilled goods yesterday wait."
3. **Review 3 deferrals** → read the message → **Confirm and tell 3 stores**.
4. **Store:** switch to `OUT022 Borella` → the notice explains why, and says they are protected next time.
5. DP6 log: "Every decision is recorded with who made it and why."

## 3. No signal: degradation scenario 2 (90 s)

1. **Driver:** tap **Online** at the top to switch to **No signal**. "Chamara is in the Kadugannawa pass. No signal."
2. **Dispatcher:** the feed shows "VEH022 lost signal". (DP5 Live shows it too.)
3. **Driver:** Kegalle → **Deliver here** → "Received by Sunil Perera" → **Complete delivery**. It says "saved on phone". Do the same for Peradeniya.
4. **Dispatcher** meanwhile: on the Runs card press **Move Kandy City to tomorrow** → **Confirm**. "Dispatch thinks Kandy City can't be reached today."
5. **Driver:** Kandy City → deliver it anyway (he got there in time) → saved on phone.
6. **Driver:** Saved tab → **Demo: signal is back**. Two records sync silently. "Clean records just go through. No pop-ups."
7. **Driver:** Sync tab: "1 needs a decision. The phone says delivered, the office moved it to tomorrow." Tap **It was delivered. Keep my record**.
8. **Dispatcher:** feed shows "Resolved ... kept the driver's delivery", the run is 5 of 5, and DP6 shows the deferral as reversed with the reason.

## 4. Close (30 s)

"What's real today: live updates across every role, an offline outbox that never loses a delivery, conflict detection with a human decision, and a fairness rule covered by tests. Next: the AWS serverless deployment from our design document, route optimisation, and a real map. Waypoint: explain the decision, execute the run, never lose the truth in between."

## If something breaks on stage

- A screen looks wrong: press **Reset demo data** on the home page, reload the tabs, continue from the section you were in.
- The internet is down: run it locally (`npm start` on the laptop, open http://localhost:4000).
- Total failure: play the backup video (record one the night before).
