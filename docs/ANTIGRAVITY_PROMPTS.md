# Antigravity prompts (one per member)

How to use:

1. Clone the repo and open the `waypoint` folder in Antigravity (**File → Open Folder**).
2. Open the **Agent Manager**, start a new agent conversation for this workspace.
3. Copy **only your own block** below and paste it as the first message. Fill in `<your-github-username>` if asked.
4. Find your issues on GitHub (**Issues** tab, filter by your name). Tell the agent which issue you are doing: "do issue #12".
5. After that: **"next task"** to start the next issue, **"merged"** when the Lead merged your PR, **"update"** when the Lead says main changed and your PR needs updating.

Antigravity also reads `GEMINI.md` and `.agent/rules/waypoint.md` automatically. The prompt makes the agent read your task file too.

If the agent ever wants to edit a file outside your list, say **no** and ask the owner in the group chat instead.

---

## Shared rules (already inside every prompt below, no need to paste separately)

- GitHub Flow: one short-lived branch per task (`<role>/<task>`), from the newest `main`. Never push to `main`, never merge, never `git push --force`.
- Conventional Commits for commits and PR titles: `feat(driver): DR4 issue screen saves offline`.
- Every PR fills the template and says `Closes #<issue>`.
- Commit only your own files (`git add <your paths>`, never `git add .` or `git add -A`).
- Before every commit: `npm test`, `npm run format`, then `git status`; any changed file you don't own gets `git restore <file>`.
- Start every task from the newest `main`.
- One task at a time, verified in the browser before committing.

---

## 1 · Lead

```
I am the LEAD of a 7-person hackathon team building "Waypoint". You are my coding agent in this repo.
Repo: https://github.com/theenuka/waypoint   My role: lead (one short-lived branch per task, named lead/<task>, e.g. lead/progress-bar)

Read first, in this order: AGENTS.md, README.md, docs/TEAM_PLAN.md, docs/GIT_GUIDE.md, docs/tasks/01-lead.md,
docs/API_CONTRACT.md, docs/DEMO_SCRIPT.md.

Setup (do it now, report the result):
1. `node -v` must be 20 or newer. `git status` must be clean.
2. `git checkout main && git pull`.
3. `npm install`, then start `npm run dev` and open http://localhost:5173 in the browser. Click all four roles and tell me if anything is broken.

My files: package.json, web/package.json, server/package.json, package-lock.json, server/src/index.js, db.js, events.js,
seed.json, server/src/routes/_util.js, routes/meta.js, web/index.html, web/vite.config.js, web/src/main.jsx, web/src/App.jsx,
web/src/shared/*, docs/*, .github/*, AGENTS.md, CLAUDE.md, GEMINI.md, .agent/*, README.md, render.yaml.
Never edit files inside web/src/roles/ or the Backend A / Backend B files unless I explicitly say so for an emergency fix.

My jobs, help me with them when I ask:
- "check PR <branch>": run `git fetch origin` and `git diff --name-only origin/main...origin/<branch>`. List every file and
  say whether it belongs to that member (ownership table in AGENTS.md). Then check out that branch in a temporary worktree
  (`git worktree add ../check-<branch> origin/<branch>`), run `npm ci && npm test && npm run build` there, and report.
  Remove the worktree afterwards. I merge on GitHub myself.
- "checkpoint": after I merged PRs, `git checkout main && git pull`, `npm install`, `npm test`, `npm run dev`, then walk
  through docs/DEMO_SCRIPT.md in the browser and list anything broken and whose file it is.
- "shared change: <what>": `git checkout main && git pull`, make a branch `lead/<few-words>`, change the shared code,
  keep existing exports and props working (other members already use them), `npm test`, `npm run format`,
  commit as `feat(shared): ...` or `fix(shared): ...`, push, and give me the PR link.
- Deploy help: docs/DEPLOY.md (Render).

Git rules: never push to main, never `git push --force`, commit only my own files by path, run `npm test` and
`npm run format` before every commit, and `git restore` any file I don't own that shows up in `git status`.
After every push give me this link: https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1
I review PRs on GitHub: CI must be green, every file must belong to the author, then "Squash and merge".
Start with the setup now.
```

---

## 2 · Backend A (orders, planning, deferrals, notices)

```
I am BACKEND A in a 7-person beginner hackathon team building "Waypoint". You are my coding agent in this repo.
Repo: https://github.com/theenuka/waypoint   My role: backend-a (one short-lived branch per task, named backend-a/<task>, e.g. backend-a/cutoff-rule)

Read first: AGENTS.md, docs/tasks/02-backend-a.md, docs/API_CONTRACT.md, docs/DATA_MODEL.md, docs/GIT_GUIDE.md,
then the files I own.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm test` (must pass), `npm run dev`.

I ONLY own these files (never edit anything else, not even "small fixes"):
server/src/logic/fairness.js, server/src/routes/orders.js, server/src/routes/planning.js, server/src/routes/deferrals.js,
server/src/routes/notices.js, server/test/fairness.test.js, NEW files I create in server/src/logic/ and server/test/,
and the Orders / Planning / Deferrals / Notices sections of docs/API_CONTRACT.md.
If I need anything else changed (db.js, index.js, package.json, frontend), STOP and write me the message to send the owner.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/02-backend-a.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b backend-a/<code>-<few-words>`.
   Tell me the branch name.
   Tell me the plan in 3 to 5 lines before coding.
3. Put logic in pure functions in server/src/logic/ with node:test tests in server/test/. Routes stay thin.
   Never change the shape of existing responses (adding fields is OK). Publish an event for changes other screens need.
4. Verify: `npm test` passes, and test the endpoint with curl against http://localhost:4000/api/... Show me the output.
5. `npm run format`, then `git status`. `git restore` any file not in my list. Then
   `git add <only my changed files>`, `git commit -m "feat(backend-a): <what works>"` (Conventional Commits: feat, fix, test,
   refactor, docs), `git push -u origin <branch>`.
6. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, add npm packages, rename existing routes or exports.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
`npm test`, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## 3 · Backend B (runs, dock, deliveries, sync, tracking)

```
I am BACKEND B in a 7-person beginner hackathon team building "Waypoint". You are my coding agent in this repo.
Repo: https://github.com/theenuka/waypoint   My role: backend-b (one short-lived branch per task, named backend-b/<task>, e.g. backend-b/backorder)

Read first: AGENTS.md, docs/tasks/03-backend-b.md, docs/API_CONTRACT.md, docs/DATA_MODEL.md, docs/GIT_GUIDE.md,
then the files I own.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm test` (must pass), `npm run dev`.

I ONLY own these files (never edit anything else, not even "small fixes"):
server/src/logic/conflict.js, server/src/routes/runs.js, server/src/routes/loads.js, server/src/routes/deliveries.js,
server/src/routes/sync.js, server/src/routes/tracking.js, server/test/conflict.test.js, NEW files I create in
server/src/logic/ and server/test/, and the Runs / Loads / Deliveries / Sync / Tracking sections of docs/API_CONTRACT.md.
If I need anything else changed (db.js, index.js, package.json, frontend), STOP and write me the message to send the owner.

The most important rule for my part: never lose or silently overwrite a delivery record. When unsure, keep the record
and raise a conflict.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/03-backend-b.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b backend-b/<code>-<few-words>`.
   Tell me the branch name.
   Tell me the plan in 3 to 5 lines before coding.
3. Logic in pure functions in server/src/logic/ with node:test tests. Never change existing response shapes
   (adding fields is OK). Publish events for changes other screens need.
4. Verify: `npm test` passes, and run curl against http://localhost:4000/api/... (show me the output). Also run the
   offline flow in the browser: http://localhost:5173/driver/route, switch "No signal", deliver, switch back, check /driver/sync.
5. `npm run format`, then `git status`. `git restore` any file not in my list. Then
   `git add <only my changed files>`, `git commit -m "feat(backend-b): <what works>"` (Conventional Commits: feat, fix, test,
   refactor, docs), `git push -u origin <branch>`.
6. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, add npm packages, rename existing routes or exports.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
`npm test`, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## 4 · Dispatcher frontend (Kavindi, desktop)

```
I am the DISPATCHER FRONTEND developer in a 7-person beginner hackathon team building "Waypoint".
You are my coding agent in this repo. Repo: https://github.com/theenuka/waypoint   My role: dispatcher (one short-lived branch per task, named dispatcher/<task>, e.g. dispatcher/dp2-filters)

Read first: AGENTS.md, docs/tasks/04-dispatcher-frontend.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md, docs/GIT_GUIDE.md,
web/src/shared/ui.jsx, web/src/shared/live.js, web/src/shared/tokens.css, then everything in web/src/roles/dispatcher/.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm run dev`, open http://localhost:5173/dispatcher/dashboard in the browser and take a screenshot.

I ONLY own web/src/roles/dispatcher/ (I may add new files there, e.g. dispatcher.css or RunCard.jsx).
Never edit anything outside it: not App.jsx, not web/src/shared/, not package.json, not the server.
If I need a shared component, a new CSS token, an npm package or a new API endpoint, STOP and write me the
message to send the Lead or the backend owner. Until then use fake data from a constant in my own folder.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/04-dispatcher-frontend.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b dispatcher/<code>-<few-words>`.
   Tell me the branch name.
3. Open the target design image web/public/design/<CODE>-<Name>.jpg (for example DP3-PlanAllocate.jpg), look at it
   carefully, and tell me in 3 to 5 lines what you will build.
4. Build it with React function components, the shared hooks (useApi, useEventFeed), the shared components
   (Card, Badge, Stat, PageHead, StatusBadge, useToast) and the CSS classes and var(--...) colours from tokens.css.
   Real API data only, kept live with the right event types. Delete the <Todo/> block when the screen is built.
5. Verify in the browser at desktop size: screenshot it next to the design image, fix differences, check there are no
   errors in the browser console, and check it still works after "Reset demo data" on the home page.
6. `npm run format`, then `git status`. `git restore` any file outside web/src/roles/dispatcher/. Then
   `git add web/src/roles/dispatcher`, `git commit -m "feat(dispatcher): <CODE> <what works>"` (Conventional Commits: feat, fix, style, test,
   refactor, docs), `git push -u origin <branch>`.
7. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, edit files outside my folder, install packages.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
re-test, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## 5 · Loader frontend (Ruwan, dark dock tablet)

```
I am the LOADER FRONTEND developer in a 7-person beginner hackathon team building "Waypoint".
You are my coding agent in this repo. Repo: https://github.com/theenuka/waypoint   My role: loader (one short-lived branch per task, named loader/<task>, e.g. loader/ld3-item-check)

Read first: AGENTS.md, docs/tasks/05-loader-frontend.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md, docs/GIT_GUIDE.md,
web/src/shared/ui.jsx, web/src/shared/live.js, web/src/shared/tokens.css (the .dock section), then everything in
web/src/roles/loader/.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm run dev`, open http://localhost:5173/loader/home in the browser at 1180x820 and take a screenshot.

I ONLY own web/src/roles/loader/ (I may add new files there, e.g. loader.css or Counter.jsx).
Never edit anything outside it: not App.jsx, not web/src/shared/, not package.json, not the server.
If I need a shared component, a new CSS token, an npm package or a new API endpoint, STOP and write me the
message to send the Lead or the backend owner.

This is a DARK tablet UI used at 04:30 with gloves: huge numbers, buttons at least 56px tall, very short text.
Link with absolute paths like /loader/run/RUN-VEH022.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/05-loader-frontend.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b loader/<code>-<few-words>`.
   Tell me the branch name.
3. Open the target design image web/public/design/<CODE>-<Name>.jpg (for example LD3-ItemCheck.jpg), look at it
   carefully, and tell me in 3 to 5 lines what you will build.
4. Build it with React function components, useApi, the shared components and the .dock CSS classes and var(--...) colours.
   Real API data only. Delete the <Todo/> block when the screen is built.
5. Verify in the browser at 1180x820: screenshot next to the design image, fix differences, no console errors,
   still works after "Reset demo data" on the home page.
6. `npm run format`, then `git status`. `git restore` any file outside web/src/roles/loader/. Then
   `git add web/src/roles/loader`, `git commit -m "feat(loader): <CODE> <what works>"` (Conventional Commits: feat, fix, style, test,
   refactor, docs), `git push -u origin <branch>`.
7. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, edit files outside my folder, install packages.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
re-test, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## 6 · Driver frontend (Chamara, phone, offline)

```
I am the DRIVER FRONTEND developer in a 7-person beginner hackathon team building "Waypoint".
You are my coding agent in this repo. Repo: https://github.com/theenuka/waypoint   My role: driver (one short-lived branch per task, named driver/<task>, e.g. driver/dr4-issue-at-stop)

Read first: AGENTS.md, docs/tasks/06-driver-frontend.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md, docs/GIT_GUIDE.md,
web/src/roles/driver/outbox.js (very important), web/src/shared/ui.jsx, web/src/shared/live.js, web/src/shared/tokens.css,
then everything in web/src/roles/driver/.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm run dev`, open http://localhost:5173/driver/route in the browser at 390x844 and take a screenshot.

I ONLY own web/src/roles/driver/ (I may add new files there, e.g. driver.css or SignaturePad.jsx).
Never edit anything outside it: not App.jsx, not web/src/shared/, not package.json, not the server.
If I need a shared component, a new CSS token, an npm package or a new API endpoint, STOP and write me the
message to send the Lead or the backend owner.

This is a PHONE UI used with one hand in a truck: one main action per screen, buttons at least 48px
("btn now big block"). Every record MUST go through addRecord() in outbox.js so it works with no signal.
Never call the API directly to save a delivery from a screen. The offline demo is our most important moment.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/06-driver-frontend.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b driver/<code>-<few-words>`.
   Tell me the branch name.
3. Open the target design image web/public/design/<CODE>-<Name>.jpg (for example DR4-IssueAtStop.jpg), look at it
   carefully, and tell me in 3 to 5 lines what you will build.
4. Build it with React function components, useApi, useDriver/addRecord from outbox.js, the shared components and the
   CSS classes and var(--...) colours. Delete the <Todo/> block when the screen is built.
5. Verify in the browser at 390x844: screenshot next to the design image, fix differences, no console errors.
   ALWAYS also run the offline flow: switch "No signal", record, reload the page (the record must still be there),
   switch back online, check it synced and /driver/sync works. Then "Reset demo data" on the home page and repeat once.
6. `npm run format`, then `git status`. `git restore` any file outside web/src/roles/driver/. Then
   `git add web/src/roles/driver`, `git commit -m "feat(driver): <CODE> <what works>"` (Conventional Commits: feat, fix, style, test,
   refactor, docs), `git push -u origin <branch>`.
7. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, edit files outside my folder, install packages.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
re-test, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## 7 · Store frontend (Nadeeka, store manager, desktop)

```
I am the STORE FRONTEND developer in a 7-person beginner hackathon team building "Waypoint".
You are my coding agent in this repo. Repo: https://github.com/theenuka/waypoint   My role: store (one short-lived branch per task, named store/<task>, e.g. store/sm2-place-order)

Read first: AGENTS.md, docs/tasks/07-store-frontend.md, docs/DESIGN_GUIDE.md, docs/API_CONTRACT.md, docs/GIT_GUIDE.md,
web/src/shared/ui.jsx, web/src/shared/live.js, web/src/shared/tokens.css, then everything in web/src/roles/store/.

Setup (do it now, report the result):
1. `node -v` must be 20+. `git fetch origin`, then run `git checkout main && git pull`.
2. `npm install`, `npm run dev`, open http://localhost:5173/store/today in the browser and take a screenshot.

I ONLY own web/src/roles/store/ (I may add new files there, e.g. store.css or products.js).
Never edit anything outside it: not App.jsx, not web/src/shared/, not package.json, not the server.
If I need a shared component, a new CSS token, an npm package or a new API endpoint (for example POST /api/issues),
STOP and write me the message to send the Lead or the backend owner. Until it exists, use fake data in my folder.

Every screen receives the prop outletId (the outlet dropdown at the top switches it). UI text: plain, calm English
that says what changed and why.

How to work, for every task:
1. The task is the GitHub issue I name ("do issue #12"). If I don't name one, take the next unchecked item from the
   Must list in docs/tasks/07-store-frontend.md (then Should, then Nice) and tell me which.
2. `git checkout main && git pull`, then make a branch for this task: `git checkout -b store/<code>-<few-words>`.
   Tell me the branch name.
3. Open the target design image web/public/design/<CODE>-<Name>.jpg (for example SM2-PlaceOrder.jpg), look at it
   carefully, and tell me in 3 to 5 lines what you will build.
4. Build it with React function components, useApi, api, the shared components and the CSS classes and
   var(--...) colours. Real API data only. Delete the <Todo/> block when the screen is built.
5. Verify in the browser at desktop size for at least two outlets (OUT014 and OUT083): screenshot next to the design
   image, fix differences, no console errors, still works after "Reset demo data" on the home page.
6. `npm run format`, then `git status`. `git restore` any file outside web/src/roles/store/. Then
   `git add web/src/roles/store`, `git commit -m "feat(store): <CODE> <what works>"` (Conventional Commits: feat, fix, style, test,
   refactor, docs), `git push -u origin <branch>`.
7. Give me the PR link https://github.com/theenuka/waypoint/compare/main...<branch>?expand=1, a PR title in the same
   Conventional Commits format, and a PR description that fills .github/pull_request_template.md and ends with
   `Closes #<issue number>` (I will tell you the issue number of this task).

Never: push to main, merge, `git push --force`, `git add .`, edit files outside my folder, install packages.
When I say "merged": `git checkout main && git pull && npm install`, then `git branch -d <old branch>`.
When I say "update" (main changed while my PR is open): on my task branch run `git pull origin main`, `npm install`,
re-test, `git push`. When I say "next task", repeat from step 1.
Start with the setup now.
```

---

## Short follow-up messages you can send the agent

| Say | When |
|---|---|
| `next task` | The last task is committed and pushed |
| `do issue #12` | Start a specific GitHub issue |
| `merged` | The Lead merged your PR |
| `update` | The Lead says main changed and your open PR needs updating |
| `make it look more like the design image, compare them side by side` | The screen works but looks different |
| `that file is not mine, undo it with git restore and do it inside my folder` | The agent touched someone else's file |
| `stop, explain the error in simple words, then fix only my files` | Something broke |
| `write the message I should send to <owner> asking for <thing>` | You need a change in someone else's file |
