# Team plan: 7 people, 1 repo, no merge conflicts

## The idea in one paragraph

The app is already split into seven parts, and **every file belongs to exactly one person**. Git only produces a merge conflict when two people change the same lines of the same file. If nobody edits a file they don't own, conflicts can't happen. We use GitHub Flow: one short-lived branch per task, a pull request with automatic tests (CI), and the Lead squash-merges into `main`. Merges happen all day as PRs turn green, plus full checks at fixed checkpoints. The starter already runs end to end (both degradation scenarios work), so at every moment you have something to demo. You are making a working app better, not building from nothing.

## The seven roles

| # | Role | Owns | Hardest part | Best fit |
|---|---|---|---|---|
| 1 | **Lead / integrator** | repo setup, `shared/`, `App.jsx`, merges, deploy, demo | Merging, deploying, keeping `main` green | Most confident person, Claude Pro |
| 2 | **Backend A** | orders, planning, deferrals, notices, fairness rule | Cutoff rule, fairness edge cases, tests | Likes logic |
| 3 | **Backend B** | runs, loads, deliveries, sync, tracking, conflicts | Back-orders, sync edge cases | Careful thinker, Claude Pro if possible |
| 4 | **Dispatcher FE** | DP1 to DP6 | Most screens, tables, the fairness story | Likes UI |
| 5 | **Loader FE** | LD1 to LD6 (dark tablet) | Big, glove-friendly controls | Likes UI |
| 6 | **Driver FE** | DR1 to DR7, offline outbox | Offline demo must be flawless | Strong frontend, Claude Pro if possible |
| 7 | **Store FE** | SM1 to SM7 | Place order form, notice screen | Likes UI and writing |

Each person's full instructions, file list, checklist and a ready-to-paste AI prompt are in `docs/tasks/`:
`01-lead.md`, `02-backend-a.md`, `03-backend-b.md`, `04-dispatcher-frontend.md`, `05-loader-frontend.md`, `06-driver-frontend.md`, `07-store-frontend.md`.

## Timeline

Hour 0 is when the team starts together. Adjust the clock times to your real deadline, but keep the order and the checkpoints.

| When | Who | What |
|---|---|---|
| **H0 to H1** | Lead | Creates the GitHub repo, pushes this starter to `main`, adds all 6 members as collaborators, turns on branch protection (see `01-lead.md`). |
| | Everyone | Installs Node 20+, Git and Antigravity, clones, opens the folder in Antigravity, pastes their block from `docs/ANTIGRAVITY_PROMPTS.md`. The agent runs `npm install` and `npm run dev`. Everyone clicks through all four roles and reads their task file and their GitHub issues. **Nobody writes code until their app runs.** |
| **H1 to H4** | Everyone | Build round 1: the "Must" issues. One branch and one PR per issue. Commit small steps, open the PR as soon as the screen or endpoint works. The Lead merges green PRs as they come in. |
| **H4** | Lead | **Checkpoint 1.** Merge all ready pull requests into `main`. Run `npm test` and click through the demo. Everyone then pulls `main` into their branch. |
| **H4 to H8** | Everyone | Build round 2: "Should" items, and match the design images closely. |
| **H8** | Lead | **Checkpoint 2.** Merge, test, deploy to Render (see `DEPLOY.md`) so you have a live URL early. |
| **Night** | Everyone | Sleep at least 4 hours. Tired beginners break things. Leave the last checkpoint green. |
| **Morning, until deadline minus 4 h** | Everyone | Round 3: "Nice" items, polish, fix bugs the Lead lists in the group chat. |
| **Deadline minus 4 h** | Lead | **Checkpoint 3 and FEATURE FREEZE.** No new features after this, only bug fixes the Lead approves. |
| **Deadline minus 3 h** | Lead + 2 | Final deploy. Rehearse `DEMO_SCRIPT.md` three times. Record a backup demo video in case the live demo fails. |
| **Deadline minus 1 h** | Lead | Submit: repo link, live URL, video, slides. Do not push anything after submitting. |

## Communication rules

- Work is tracked as GitHub issues (one per task, assigned, labelled by role) on the repo's Project board: Todo, In progress, In review, Done.
- One group chat. Post three things only: "**PR ready:** <link>", "**Blocked:** <what you need, from whom>", "**Merged #12, please pull**".
- If you need a change in a file you don't own, ask its owner in the chat. They make it in their next commit.
- If you need a new API endpoint, the frontend person writes what they need (method, path, body, response) in the chat; the backend owner adds it to `docs/API_CONTRACT.md` first, then builds it. The frontend can show fake data from a local constant until it is ready.
- Stuck for more than 20 minutes? Say so. Don't lose an hour alone.

## Definition of done (for every task)

1. It matches the design image well enough that a judge recognises the screen.
2. `npm run dev` starts with no red errors in the terminal or the browser console.
3. `npm test` passes.
4. It still works after **Reset demo data** on the home page.
5. It works on the right device size: phone (390 px wide) for driver, tablet (1180 px) for loader, desktop for dispatcher and store.
6. You ran `npm run format`, committed only your own files on a task branch, opened a PR with `Closes #<issue>`, and CI is green.

## How to win (what judges look for)

1. **A demo that never fails.** Practise the two degradation scenarios until they are boring. Always reset data before demoing.
2. **The story, not the feature list.** "Kegalle gets 6 of 10, and everybody knows why before the truck leaves" beats "we have a shortfall form".
3. **Live, multi-screen.** Put the dispatcher and the driver side by side on the projector. A change on one appears on the other with no refresh. That is Waypoint's core promise: one fact, every screen.
4. **Fairness explained.** Show DP3: who waits and the rule that decided it, then SM5: the store reads the reason.
5. **Honest scope.** Say what is real (live sync, offline outbox, fairness rule with tests) and what is next (AWS deployment from the design doc, route optimisation).
6. **Deployed.** A live URL the judges can open themselves.
