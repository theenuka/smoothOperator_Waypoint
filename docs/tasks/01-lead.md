# 01 · Lead / integrator

**You keep `main` working.** You set up the repo, merge everyone's pull requests at checkpoints, own the shared code, deploy, and run the demo. Code less, check more.

## You own

`package.json` (all three), `package-lock.json`, `server/src/index.js`, `db.js`, `events.js`, `seed.json`, `routes/_util.js`, `routes/meta.js`, `web/index.html`, `web/vite.config.js`, `web/src/main.jsx`, `App.jsx`, `web/src/shared/*`, `docs/*`, `.github/*`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agent/*`, `README.md`, `CONTRIBUTING.md`, `render.yaml`, `scripts/*`.

## Hour 0: set up GitHub (one script, about 5 minutes)

Everything is automated in `scripts/setup-github.mjs` (repo settings as code). It creates the public repo `theenuka/waypoint`, pushes `main`, turns on squash-merge only and auto-delete of merged branches, protects `main` (PR required, CI must be green, no force push, no deleting), creates labels, 3 milestones (Must / Should / Nice), **one issue per task** (56) and a project board.

1. Install the GitHub CLI: https://cli.github.com, then log in:
   ```bash
   gh auth login                 # GitHub.com, HTTPS, login with a web browser
   gh auth refresh -s project    # lets the script make the project board
   ```
2. Unzip the starter, open a terminal in the `waypoint` folder (on Windows use **Git Bash**) and run:
   ```bash
   npm install
   node scripts/setup-github.mjs
   ```
   It is safe to run again; it skips what already exists.
3. Collect everyone's **GitHub username** (not email) and their role. Put them in `scripts/team.json`, then:
   ```bash
   node scripts/setup-github.mjs --team    # invites them and assigns their issues
   ```
   Each member must accept the invite email (or github.com/notifications). Run `--team` once more after they accept, so issues that failed to assign get assigned. If someone only gives an email, invite them by email in **Settings → Collaborators → Add people**, then add their username to `team.json` later.
4. Commit the filled `team.json` on a branch `lead/team-config` and merge it as the first PR, so everyone sees the flow once.
5. Send in the group chat: the repo link, "read docs/START_HERE_SI.md", each person's role, and "paste your block from docs/ANTIGRAVITY_PROMPTS.md into Antigravity".
6. Make sure all 6 can run `npm run dev` and see the app.

Doing it by hand instead: create a public repo, push `main`, then in **Settings → General → Pull Requests** allow only squash merging and tick "Automatically delete head branches", and in **Settings → Branches** add a rule for `main`: require a pull request, require status check `check`, block force pushes.

## Must

- [ ] Every member runs the app in Antigravity with their prompt block within the first hour.
- [ ] Checkpoints at H4, H8 and freeze (see `TEAM_PLAN.md`): merge ready PRs, then `git checkout main && git pull && npm install && npm test && npm run dev`, click through `DEMO_SCRIPT.md`, post "Merged, please pull".
- [ ] Review every PR's **Files changed**: only files the author owns, CI green, title in Conventional Commits format, `Closes #<issue>` in the description. Then **Squash and merge**.
- [ ] Deploy to Render after checkpoint 2 (`DEPLOY.md`) and after the freeze.
- [ ] Rehearse the demo three times with the team. Record a backup video (OBS or the Windows Game Bar `Win+G`, or QuickTime on Mac).

## Should

- [ ] Handle requests for shared code: a new component in `shared/ui.jsx`, a new CSS class in `tokens.css`, an npm package. Make the change on a `lead/<task>` branch, PR, merge, tell everyone to pull.
- [ ] Keep `docs/API_CONTRACT.md` "Requested endpoints" table up to date.
- [ ] Make slides (5 or 6): problem, the three problems, solution and the four roles, live demo, architecture (reuse the Designathon architecture PNG), what's next.

## Nice

- [ ] A small "Demo controls" panel on the home page (reset, open all four roles in new tabs).
- [ ] Polish `shared/tokens.css` once all screens exist, so the whole app feels consistent.

## When something breaks after a merge

1. Look at which PR was merged last. `git log --oneline -5`.
2. Revert it on GitHub: open the PR → **Revert** → merge the revert PR. `main` works again in two minutes.
3. Tell the author what broke so they can fix it on their branch.

## AI prompt (paste into Claude / Gemini / Antigravity)

```
You are helping me, the LEAD of a 7-person beginner hackathon team building "Waypoint".
First read AGENTS.md, README.md, docs/TEAM_PLAN.md and docs/tasks/01-lead.md in this repo.
I own the shared files listed in 01-lead.md. Other members own their own folders; never edit those.
My job: keep main working, merge pull requests, deploy, and maintain web/src/shared and server core.
Task right now: <describe the task, e.g. "add a ProgressBar component to web/src/shared/ui.jsx that the dispatcher asked for">.
Keep code simple for beginners. After changes tell me exactly which files changed and how to test.
```
