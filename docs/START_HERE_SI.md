# මෙතනින් පටන් ගන්න (සිංහලෙන්)

ටීම් එකේ හැමෝම මුලින්ම මේක කියවන්න. විනාඩි 10යි.

## අපි හදන්නේ මොකක්ද?

Designathon එකේ අපි design කරපු **Waypoint** app එක දැන් ඇත්තටම වැඩ කරන විදියට හදනවා. App එකේ කොටස් 4ක් තියෙනවා, හැම කෙනාටම තමන්ගේම screen එකක්:

| කවුද | Device එක | මොකද කරන්නේ |
|---|---|---|
| Dispatcher (Kavindi) | Desktop | හෙට deliveries plan කරනවා. Chilled truck මදි වුණාම කවුද ඉන්න ඕනේ කියලා සාධාරණ rule එකකින් තීරණය කරලා, ඇයි කියලා store එකට කියනවා |
| Loader (Ruwan) | Tablet (dark) | Truck එකට බඩු පටවනවා. බඩු අඩු නම් "short" කියලා flag කරනවා, truck එක නවත්තන්නේ නෑ |
| Driver (Chamara) | Phone | Deliver කරලා proof දානවා. Signal නැති වුණත් වැඩ කරනවා, signal ආවම auto sync වෙනවා |
| Store manager (Nadeeka) | Desktop | Order දානවා. මොනවා එනවද, ඇයි වෙනස් වුණේ කියලා දැනගන්නවා |

**හොඳ ආරංචිය:** starter code එක දැනටමත් run වෙනවා. Degradation scenarios දෙකම (dock shortfall, no signal) දැනටමත් වැඩ. අපි කරන්නේ ඒක design එකට ගැලපෙන්න ලස්සන කරලා, ඉතුරු screens ටික හදන එක.

## Merge conflict එන්නේ නැති රහස

Merge conflict එන්නේ **දෙන්නෙක් එකම file එකේ එකම පේළිය** වෙනස් කළොත් විතරයි. ඒ නිසා:

> **හැම file එකකටම අයිතිකාරයෝ එක්කෙනයි. ඔයාගේ නොවන file එකක් කවදාවත් edit කරන්න එපා.**

ඔයාට වෙන කෙනෙක්ගේ file එකක වෙනසක් ඕනේ නම්, group chat එකේ ඒ කෙනාගෙන් ඉල්ලන්න. ඔයාගේ AI tool එකටත් මේ rule එක `AGENTS.md` file එකෙන් කියනවා.

## Roles 7 (කාටද මොකක්)

| # | Role | ඔයාගේ folder / files | Task file |
|---|---|---|---|
| 1 | Lead | shared code, merge, deploy, demo | `docs/tasks/01-lead.md` |
| 2 | Backend A | orders, planning, deferrals, notices | `docs/tasks/02-backend-a.md` |
| 3 | Backend B | runs, loads, deliveries, sync, tracking | `docs/tasks/03-backend-b.md` |
| 4 | Dispatcher FE | `web/src/roles/dispatcher/` | `docs/tasks/04-dispatcher-frontend.md` |
| 5 | Loader FE | `web/src/roles/loader/` | `docs/tasks/05-loader-frontend.md` |
| 6 | Driver FE | `web/src/roles/driver/` | `docs/tasks/06-driver-frontend.md` |
| 7 | Store FE | `web/src/roles/store/` | `docs/tasks/07-store-frontend.md` |

Claude Pro තියෙන අයට දෙන්න හොඳම roles: Lead, Backend B, Driver FE (මේවා තමයි අමාරුම). අනිත් අයට Gemini Pro / Antigravity ඇති.

## පළවෙනි පැය (හැමෝම)

1. **Node.js 20+** install කරන්න (nodejs.org, LTS). Terminal එකේ `node -v` ගැහුවම `v20` හරි ඊට වැඩි හරි පේන්න ඕනේ.
2. **Git** install කරන්න (git-scm.com). අමාරු නම් **GitHub Desktop** එකත් දාගන්න.
3. **VS Code** (හරි Antigravity) install කරන්න.
4. Lead එවන GitHub invite එක email එකෙන් accept කරන්න.
5. Terminal එකේ:
   ```bash
   git clone <Lead එවන repo link එක>
   cd waypoint
   npm install
   npm run dev
   ```
6. Browser එකේ http://localhost:5173 open කරලා roles 4ම click කරලා බලන්න. **App එක run වෙනකම් code ලියන්න එපා.**
7. Folder එක **Antigravity** එකේ open කරලා, `docs/ANTIGRAVITY_PROMPTS.md` එකේ **ඔයාගේ block එක විතරක්** copy කරලා Agent Manager එකට paste කරන්න. ඊට පස්සේ agent එක setup එක කරයි.
8. ඔයාගේ task file එකයි, GitHub එකේ **Issues** tab එකේ ඔයාට assign කරලා තියෙන issues ටිකයි කියවන්න.

## හැම task එකකටම කරන loop එක (GitHub Flow)

**එක task එකකට එක branch එකයි, එක PR එකයි.** Antigravity agent එක මේක ඔයා වෙනුවෙන් කරනවා, ඒත් මොකද වෙන්නේ කියලා දැනගෙන ඉන්න:

```bash
git checkout main && git pull                      # 1. අලුත්ම main එකෙන් පටන් ගන්න
git checkout -b driver/dr4-issue-at-stop           # 2. මේ task එකට අලුත් branch එකක්
# 3. ඔයාගේ files විතරක් edit කරන්න, browser එකේ check කරන්න
npm test && npm run format                         # 4. tests + format
git status                                         # 5. ඔයාගේ files විතරද කියලා බලන්න
git add web/src/roles/driver                       # 6. ඔයාගේ folder එක විතරක් (git add . එපා)
git commit -m "feat(driver): DR4 issue screen saves offline"
git push -u origin driver/dr4-issue-at-stop        # 7. upload
```

ඊට පස්සේ GitHub එකේ **Pull Request** එකක් open කරලා description එකේ `Closes #<issue number>` දාන්න, group chat එකට link එක දාන්න. CI (automatic tests) green වුණාම Lead **Squash and merge** කරනවා. Merge වුණාම agent ට **"merged"** කියන්න, ඊළඟ task එකට **"next task"**.

Commit message format එක (Conventional Commits): `feat(role): ...` අලුත් දෙයක්, `fix(role): ...` bug එකක්, `style(role): ...` look එක විතරක්. විස්තර: `docs/GIT_GUIDE.md`, `CONTRIBUTING.md`.

## AI tool එක පාවිච්චි කරන විදිය

- **Antigravity / Gemini CLI / Claude Code:** repo folder එක open කළාම ඒවා `AGENTS.md`, `GEMINI.md`, `CLAUDE.md` file එක auto කියවනවා. ඒකේ තියෙනවා rules ඔක්කොම.
- **Gemini / Claude website එකේ chat කරනවා නම්:** ඔයාගේ task file එකේ අන්තිමට තියෙන **AI prompt** එක copy කරලා paste කරන්න, ඒ එක්කම `AGENTS.md`, task file එක, ඔයා හදන file එක, design image එක (`web/public/design/...jpg`) attach කරන්න.
- **එක පාරට එක task එකයි** දෙන්න. "මුළු app එකම හදන්න" කියන්න එපා.
- AI එක ඔයාගේ නොවන file එකක් වෙනස් කළොත් ඒක undo කරන්න: `git restore <file>`.
- AI එක දුන්න code එක run කරලා බලලා විතරක් commit කරන්න.

## Timeline (සාරාංශය)

| කවද්ද | මොකද |
|---|---|
| H0 සිට H1 | Setup. හැමෝගෙම app එක run වෙන්න ඕනේ |
| H1 සිට H4 | Round 1: task file එකේ "Must" items |
| **H4** | Checkpoint 1: Lead merge කරනවා, හැමෝම `git pull origin main` |
| H4 සිට H8 | Round 2: "Should" items, design එකට ගැලපෙන්න |
| **H8** | Checkpoint 2: merge, Render එකට deploy |
| රෑ | **අඩුම පැය 4ක් නිදාගන්න.** මහන්සියෙන් code කරාම දේවල් කැඩෙනවා |
| උදේ | Round 3: polish, bugs |
| **Deadline ට පැය 4කට කලින්** | **Feature freeze.** අලුත් features නෑ, bug fixes විතරයි |
| Deadline ට පැය 3කට කලින් | Final deploy, demo එක 3 පාරක් practice, backup video එක record කරන්න |

## Win කරන්න

1. **Demo එක fail වෙන්න බෑ.** `docs/DEMO_SCRIPT.md` එක කම්මැලි වෙනකම් practice කරන්න.
2. Dispatcher එකයි Driver එකයි එක පාර screen එකේ පෙන්නන්න. එකක වෙනස් කළාම අනිත් එකේ refresh නැතුව එනවා. ඒක තමයි අපේ "one fact, every screen" කතාව.
3. Fairness rule එක පෙන්නලා (DP3), store එකට ඇයි කියලා යන message එක පෙන්නන්න (SM5).
4. Live URL එකක් දෙන්න (Render).
5. ඇත්ත කියන්න: මොනවද වැඩ කරන්නේ, මොනවද ඊළඟට.

## හිරවුණොත්

විනාඩි 20කට වඩා හිරවුණොත් group chat එකේ **"Blocked: ..."** කියලා දාන්න. තනියම පැයක් නාස්ති කරන්න එපා.
