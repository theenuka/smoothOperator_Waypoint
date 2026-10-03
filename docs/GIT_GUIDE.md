# Git guide (GitHub Flow, for beginners)

We use **GitHub Flow**, the standard way most teams work on GitHub:

1. `main` always works and is what we deploy and demo. Nobody pushes to it directly.
2. For every task you make a **short-lived branch** from the newest `main`.
3. You push the branch and open a **pull request (PR)**. CI runs the tests automatically.
4. The Lead reviews and **squash-merges** it into `main`. GitHub deletes the branch.
5. You start the next task from the newest `main` again.

If you use Antigravity, the prompt in `docs/ANTIGRAVITY_PROMPTS.md` makes the agent do these steps for you. Still read this page once so you know what it is doing.

## Words you need

| Word | Meaning |
|---|---|
| **repo** | The project on GitHub |
| **clone** | Download the repo to your computer (once) |
| **branch** | A separate line of work. One branch = one task |
| **commit** | A saved snapshot with a message |
| **push** | Upload your commits to GitHub |
| **pull** | Download new commits |
| **pull request (PR)** | "Please merge my branch into main" |
| **CI** | GitHub Actions: installs, checks formatting, runs tests and builds on every PR. Green tick = OK |
| **squash merge** | All commits of a PR become one tidy commit on `main` |

## Naming

**Branches:** `<role>/<task-in-a-few-words>`, lowercase with dashes.

```
driver/dr4-issue-at-stop      loader/ld3-item-check      backend-a/cutoff-rule
store/sm2-place-order         dispatcher/dp2-filters     lead/progress-bar-component
```

**Commits** (Conventional Commits): `<type>(<scope>): <what>`

| type | for | example |
|---|---|---|
| `feat` | new feature or screen | `feat(driver): DR4 issue screen saves offline` |
| `fix` | bug fix | `fix(loader): count can't go below zero` |
| `style` | look only, no logic | `style(store): match SM5 design spacing` |
| `test` | tests | `test(backend-a): cutoff after 16:00` |
| `docs` | documentation | `docs: add POST /issues to API contract` |
| `refactor` | same behaviour, cleaner code | `refactor(dispatcher): extract RunCard` |
| `chore` | setup, packages, config | `chore: add leaflet` |

Scope = your role. The PR title uses the same format (it becomes the commit on `main`).

**Issues:** every task in `docs/tasks/` is a GitHub issue, assigned to its owner. Put `Closes #<number>` in your PR description and the issue closes itself when merged.

## One-time setup

```bash
git config --global user.name "Your Name"
git config --global user.email "the-email-of-your-github-account@example.com"
git config --global pull.rebase false        # pull = merge (simplest for beginners)

git clone <repo-url>
cd waypoint
npm install
npm run dev                                   # open http://localhost:5173
```

## Every task (the loop)

```bash
# 1. start from the newest main
git checkout main
git pull

# 2. make a branch for this task
git checkout -b driver/dr4-issue-at-stop

# 3. work: edit ONLY your own files, check it in the browser, commit small steps
npm test
npm run format
git status                                    # every file listed must be yours
git add web/src/roles/driver                  # your folder or your exact files, never "git add ."
git commit -m "feat(driver): DR4 issue screen saves offline"

# 4. push and open the PR
git push -u origin driver/dr4-issue-at-stop
```

Then on GitHub: the yellow bar → **Compare & pull request** → title in commit format → fill the checklist → add `Closes #<issue>` → **Create pull request**. Post the link in the group chat.

If `main` moved while you were working (other PRs got merged), update your branch before asking for review:

```bash
git pull origin main          # merges new main into your branch
npm install && npm test
git push
```

After your PR is merged:

```bash
git checkout main
git pull
git branch -d driver/dr4-issue-at-stop
```

Keep PRs small: one screen or one endpoint. A PR that takes 30 to 90 minutes of work is perfect. Small PRs get merged fast and almost never conflict.

## For the Lead: reviewing and merging

1. Open the PR → **Files changed**. Every file must belong to the author (see `AGENTS.md`). If not, comment "please `git restore` <file>".
2. CI must be green. Red means it is not merged; the author fixes it on the same branch.
3. Quick look at the code: no secrets, no `console.log` spam, no huge copied files, no new packages without asking.
4. **Squash and merge**. GitHub deletes the branch (turned on in settings).
5. Post "Merged #<number>, please pull" in the chat.

## If something goes wrong

**"Your local changes would be overwritten"**: commit (or `git stash`) first, then pull again. `git stash pop` brings stashed changes back.

**Merge conflict** (Git prints `CONFLICT`): someone touched the same file.
1. `git status` shows the files under "both modified".
2. Open each in VS Code or Antigravity. Use **Accept Incoming** for files you don't own (keep main's version). For your own files, keep the right parts of both.
3. `git add <file>`, `git commit`, `git push`. Tell the chat which file it was so it doesn't happen again.

**`package-lock.json` conflict**: Accept Incoming, run `npm install`, `git add package-lock.json`, commit.

**I committed on main by mistake** (not pushed yet):
```bash
git branch driver/rescue          # keep your work on a new branch
git reset --hard origin/main      # put local main back
git checkout driver/rescue
```

**I want to throw away everything I changed in one file**: `git restore <file>`.

## Never

- `git push --force`, pushing to `main`, merging your own PR.
- `git add .` or `git add -A` (it grabs files you didn't mean to change).
- Committing `node_modules/`, `server/data/`, `.env`, passwords or API keys.
- Editing files you don't own "just a little".
