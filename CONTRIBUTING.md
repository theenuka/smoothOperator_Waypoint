# Contributing to Waypoint

Short version of how this team works. Details: [docs/GIT_GUIDE.md](docs/GIT_GUIDE.md).

## Workflow (GitHub Flow)

1. Pick your GitHub issue (Issues tab, assigned to you).
2. `git checkout main && git pull`, then `git checkout -b <role>/<task>` (for example `driver/dr4-issue-at-stop`).
3. Change **only files you own** (ownership table in [AGENTS.md](AGENTS.md)).
4. `npm test` and `npm run format` pass, the screen works in the browser and after **Reset demo data**.
5. Commit with Conventional Commits: `feat(driver): DR4 issue screen saves offline`. Add files by path, never `git add .`.
6. Push, open a PR (template fills itself), put `Closes #<issue>` in the description.
7. CI must be green. The Lead reviews and **squash-merges**. The branch is deleted automatically.

## Rules

- `main` is protected: no direct pushes, no force pushes. Every change goes through a PR with green CI.
- One task per branch, one branch per PR. Small PRs (30 to 90 minutes of work).
- Don't change other people's files, existing API response shapes, or exported names. Ask the owner.
- New API endpoints go into [docs/API_CONTRACT.md](docs/API_CONTRACT.md) first.
- New npm packages only through the Lead.
- No secrets, passwords or API keys in the repo. Config goes in environment variables.
- **Commits and PRs are made by team members only.** No `Co-authored-by: Claude/Gemini/Copilot`, no "Generated with ..." lines, no session links. CI fails if it finds one. The repo's `.claude/settings.json` already turns this off for Claude Code.
- Keep code simple: plain React function components, plain JS, the shared components and CSS tokens.
- Formatting is automatic (Prettier, settings in `.prettierrc`); CI fails if `npm run format` wasn't run.

## Definition of done

- Matches the design image in `web/public/design/` closely enough that a judge recognises it.
- No errors in the terminal or browser console.
- Works on its device size (phone 390 px, tablet 1180 px, desktop).
- Uses real API data, updates live, survives **Reset demo data**.
- Tests added for new backend logic.
- PR checklist ticked, `Closes #<issue>` included.

## Remove AI attribution (if CI fails on it)

On your task branch (not main):

```bash
git fetch origin
git reset --soft origin/main          # keeps all your changes, removes your branch's commits
git commit -m "feat(driver): <what works>"
git push --force-with-lease           # allowed on YOUR OWN task branch only, never on main
```

If only the PR description has it, edit the description on GitHub, delete the line, then click **Re-run jobs** on the failed check.
