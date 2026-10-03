// One-time GitHub setup for the Waypoint team repo. Owner: LEAD.
// Infrastructure as code for the repo: creates it, pushes main, sets merge rules, protects main,
// creates labels, milestones and one issue per task, invites members and assigns their issues.
// Safe to run again: it skips things that already exist.
//
// Needs: Git, Node 20+, GitHub CLI (https://cli.github.com) logged in:  gh auth login
// For the project board also:  gh auth refresh -s project
//
// Run from the repo root:
//   node scripts/setup-github.mjs          full setup
//   node scripts/setup-github.mjs --team   only invite members + assign issues (after filling scripts/team.json)
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const team = JSON.parse(fs.readFileSync("scripts/team.json", "utf8"));
const issues = JSON.parse(fs.readFileSync("scripts/issues.json", "utf8"));
const REPO = team.repo;
const [OWNER] = REPO.split("/");
const onlyTeam = process.argv.includes("--team");

const gh = (args, opts = {}) => execFileSync("gh", args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts }).trim();
const git = (args) => execFileSync("git", args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ok = (m) => console.log("  ✔ " + m);
const warn = (m) => console.log("  ! " + m);
function tryRun(label, fn) {
  try { fn(); } catch (e) { warn(`${label}: ${(e.stderr || e.message || "").toString().split("\n")[0]}`); }
}
function api(method, path, body) {
  return gh(["api", "-X", method, path, "--input", "-"], { input: JSON.stringify(body || {}) });
}

console.log(`\nWaypoint GitHub setup for ${REPO}\n`);
try { gh(["auth", "status"]); } catch { console.error("Run `gh auth login` first."); process.exit(1); }

if (!onlyTeam) {
  // 0. first commit, made by YOU (your git name and email), so the repo history is yours
  console.log("0. Local git");
  let name = "", email = "";
  try { name = git(["config", "user.name"]); email = git(["config", "user.email"]); } catch {}
  if (!name || !email) {
    console.error('Set your git identity first (use the email of your GitHub account):\n  git config --global user.name "Your Name"\n  git config --global user.email "you@example.com"');
    process.exit(1);
  }
  if (!fs.existsSync(".git")) {
    git(["init", "-b", "main"]);
    git(["add", "-A"]);
    git(["commit", "-m", "feat: Waypoint hackathon starter"]);
    ok(`first commit as ${name} <${email}>`);
  } else ok(`git repo already exists (commits by ${name} <${email}>)`);

  // 1. repo + push
  console.log("1. Repository");
  let exists = true;
  try { gh(["repo", "view", REPO, "--json", "name"]); } catch { exists = false; }
  if (!exists) {
    gh(["repo", "create", REPO, "--public", "--description", "Waypoint: delivery planning for a retail chain. Team smoothOperator, Rootcode Tech-Triathlon 2026"]);
    ok("created " + REPO);
  } else ok("exists");
  const remotes = git(["remote"]).split("\n");
  if (!remotes.includes("origin")) git(["remote", "add", "origin", `https://github.com/${REPO}.git`]);
  tryRun("push main", () => { git(["push", "-u", "origin", "main"]); ok("main pushed"); });

  // 2. merge settings: squash only, delete branches after merge, PR title becomes the commit
  console.log("2. Merge settings");
  tryRun("settings", () => {
    api("PATCH", `repos/${REPO}`, {
      allow_squash_merge: true, allow_merge_commit: false, allow_rebase_merge: false,
      delete_branch_on_merge: true, allow_update_branch: true,
      squash_merge_commit_title: "PR_TITLE", squash_merge_commit_message: "PR_BODY",
      has_issues: true, has_projects: true, has_wiki: false,
    });
    ok("squash merge only, auto-delete branches, 'Update branch' button on");
  });

  // 3. protect main: PR required, CI must pass, no force pushes, no deletion
  console.log("3. Protect main");
  tryRun("branch protection", () => {
    api("PUT", `repos/${REPO}/branches/main/protection`, {
      required_status_checks: { strict: false, contexts: ["check"] },
      enforce_admins: false, // the Lead can still fix an emergency
      required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: false },
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false,
      required_linear_history: true,
    });
    ok("main needs a PR with green CI; no force push, no delete");
  });

  // 4. labels
  console.log("4. Labels");
  const labels = [
    ["role:lead", "1B1A17", "Lead / integrator"], ["role:backend-a", "5319E7", "Orders, planning, deferrals, notices"],
    ["role:backend-b", "0E8A16", "Runs, dock, deliveries, sync, tracking"], ["role:dispatcher", "1D76DB", "DP1-DP6"],
    ["role:loader", "434343", "LD1-LD6"], ["role:driver", "FBCA04", "DR1-DR7"], ["role:store", "C2E0C6", "SM1-SM7"],
    ["priority:must", "B60205", "Needed for the demo"], ["priority:should", "D93F0B", "Makes it match the design"],
    ["priority:nice", "C5DEF5", "Only if time is left"], ["frontend", "BFD4F2", ""], ["backend", "D4C5F9", ""],
    ["lead", "EDEDED", ""], ["task", "EDEDED", "One piece of work"], ["bug", "D73A4A", "Something is broken"],
    ["blocked", "000000", "Waiting on someone else"],
  ];
  for (const [name, color, description] of labels)
    tryRun(name, () => gh(["label", "create", name, "--repo", REPO, "--color", color, "--description", description, "--force"]));
  ok(`${labels.length} labels`);

  // 5. milestones
  console.log("5. Milestones");
  const existingMs = JSON.parse(gh(["api", `repos/${REPO}/milestones?state=all&per_page=100`])).map((m) => m.title);
  for (const [title, description] of [
    ["1 · Must (Checkpoint 1)", "Merged by H4. Needed for the demo."],
    ["2 · Should (Checkpoint 2)", "Merged by H8. Screens match the designs."],
    ["3 · Nice (before freeze)", "Only if time is left. Freeze at deadline minus 4 hours."],
  ])
    if (!existingMs.includes(title)) tryRun(title, () => api("POST", `repos/${REPO}/milestones`, { title, description }));
  ok("3 milestones");

  // 6. issues
  console.log("6. Issues");
  const existing = new Set(JSON.parse(gh(["issue", "list", "--repo", REPO, "--state", "all", "--limit", "500", "--json", "title"])).map((i) => i.title));
  let made = 0;
  for (const it of issues) {
    if (existing.has(it.title)) continue;
    const args = ["issue", "create", "--repo", REPO, "--title", it.title, "--body", it.body, "--milestone", it.milestone];
    for (const l of [...it.labels, "task"]) args.push("--label", l);
    // GitHub limits how fast issues can be created, so go slowly and retry when it says "rate limit"
    for (let attempt = 1; attempt <= 4; attempt++) {
      try { gh(args); made++; process.stdout.write("."); break; }
      catch (e) {
        const msg = (e.stderr || e.message || "").toString();
        if (/rate limit|abuse|secondary/i.test(msg) && attempt < 4) { console.log(`\n  … GitHub rate limit, waiting 60 s (attempt ${attempt})`); sleep(60000); continue; }
        warn(`${it.title}: ${msg.split("\n")[0]}`); break;
      }
    }
    sleep(2500);
  }
  console.log("");
  ok(`${made} new issues (${issues.length} in total)`);

  // 7. project board (optional, needs: gh auth refresh -s project)
  console.log("7. Project board");
  tryRun("project board (run `gh auth refresh -s project` and re-run to add it)", () => {
    const list = JSON.parse(gh(["project", "list", "--owner", OWNER, "--format", "json"]));
    let p = list.projects.find((x) => x.title === "Waypoint hackathon");
    if (!p) p = JSON.parse(gh(["project", "create", "--owner", OWNER, "--title", "Waypoint hackathon", "--format", "json"]));
    tryRun("link project", () => gh(["project", "link", String(p.number), "--owner", OWNER, "--repo", REPO]));
    const urls = JSON.parse(gh(["issue", "list", "--repo", REPO, "--state", "open", "--limit", "500", "--json", "url"])).map((i) => i.url);
    for (const url of urls) tryRun("add " + url, () => gh(["project", "item-add", String(p.number), "--owner", OWNER, "--url", url]));
    ok(`board "Waypoint hackathon" with ${urls.length} issues: ${p.url}`);
  });
}

// 8. members: invite + assign their issues
console.log("8. Members");
const all = JSON.parse(gh(["issue", "list", "--repo", REPO, "--state", "open", "--limit", "500", "--json", "number,title,assignees"]));
for (const [role, user] of Object.entries(team.members)) {
  if (!user) { warn(`${role}: no username in scripts/team.json yet`); continue; }
  if (user.toLowerCase() !== OWNER.toLowerCase())
    tryRun(`invite ${user}`, () => { api("PUT", `repos/${REPO}/collaborators/${user}`, { permission: "push" }); ok(`invited ${user} (${role})`); });
  const mine = all.filter((i) => i.title.startsWith(`[${role}]`) && !i.assignees.some((a) => a.login === user));
  for (const i of mine) tryRun(`assign #${i.number}`, () => gh(["issue", "edit", String(i.number), "--repo", REPO, "--add-assignee", user]));
  ok(`${role}: ${mine.length} issues assigned to ${user}`);
}

console.log(`\nDone. Open https://github.com/${REPO}\n`);
