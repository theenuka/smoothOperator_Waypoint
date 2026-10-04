# Contributing

## Workflow

We use GitHub Flow.

1. Every change starts from an issue.
2. Branch from the latest `main`: `git checkout main && git pull && git checkout -b <area>/<short-task>` (for example `driver/dr4-issue-at-stop`).
3. Keep each branch to one task and one area of the code base (`server/src/...` or one `web/src/roles/<role>/` folder).
4. Before pushing: `npm test`, `npm run format`, and check the screen in the browser on its target device size.
5. Open a pull request that fills the template and links the issue with `Closes #<number>`.
6. CI (formatting, tests, build) must pass. The change is reviewed, then **squash-merged**; the branch is deleted automatically.

`main` is protected: no direct pushes, no force pushes, and every change goes through a pull request with green CI.

## Conventions

- **Commits and PR titles** follow [Conventional Commits](https://www.conventionalcommits.org): `feat(driver): DR4 issue screen saves offline`, `fix(loader): count can't go below zero`. Types: `feat`, `fix`, `style`, `test`, `refactor`, `docs`, `chore`.
- **Domain rules** go in `server/src/logic/` as pure functions with unit tests in `server/test/`. Routes only parse the request, call the logic, save and respond.
- **API changes** are made in [docs/API_CONTRACT.md](docs/API_CONTRACT.md) in the same pull request. Existing response shapes are only extended, never broken.
- **Every state change** that other screens need publishes an event (`publish(type, payload)`).
- **UI** uses the shared components and design tokens in `web/src/shared/` (see [docs/DESIGN_GUIDE.md](docs/DESIGN_GUIDE.md)). Screen-specific styles stay in the role folder with a role prefix.
- **Formatting** is enforced by Prettier (`.prettierrc`).
- **No secrets** in the repository. Configuration comes from environment variables.

## Definition of done

- Matches the reference design in `docs/design/` and works on its target device.
- Uses live API data and survives **Reset demo data**.
- No errors in the terminal or browser console.
- New backend logic has tests.
- CI is green and the PR links its issue.
