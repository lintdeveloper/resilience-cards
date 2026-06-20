# Contributing

Workflow for this repo. Branching model rationale is in
[`docs/adr/0004-adopt-gitflow.md`](docs/adr/0004-adopt-gitflow.md).

## Prerequisites

- Node `20.19.6` (`nvm use` reads `.nvmrc`).
- `npm install` once — this also wires husky hooks (`prepare`).

## Branching model (GitFlow)

```
main      ●────────────────────────●──────  tagged, always submission-ready
           \                       /
develop     ●────●────●────●──────●─────────  integration
                  \        /
feature/...        ●──────●                   one unit of work
```

| Prefix | From | Into | Example |
|--------|------|------|---------|
| `feature/*` | `develop` | `develop` | `feature/messages-model-helpers` |
| `release/*` | `develop` | `main` + `develop` | `release/1.0.0` |
| `hotfix/*` | `main` | `main` + `develop` | `hotfix/slug-collision` |
| `bugfix/*` | `develop` | `develop` | `bugfix/draft-check-order` |

**Never commit directly to `main` or `develop`** — always go through a branch and a `--no-ff` merge.

## Feature workflow

```bash
git checkout develop
git pull                       # once a remote exists
git checkout -b feature/<kebab-name>

# ... work, committing in conventional-commit style ...
npm run lint && npm test       # must pass (CI gates this)

# integrate
git checkout develop
git merge --no-ff feature/<kebab-name>
git branch -d feature/<kebab-name>
```

Keep one feature branch focused on one unit of work. Rebase onto `develop` if it has moved on and you want a linear feature history before merging.

## Commit messages (Conventional Commits — enforced)

`commitlint` (via the husky `commit-msg` hook) rejects non-conforming messages. `lint-staged` runs prettier + eslint on staged JS in `pre-commit`.

```
<type>(<optional scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.

```
feat(creator-cards): add create endpoint
fix(slug): regenerate suffix on auto-gen collision
docs(adr): record gitflow decision
```

## Release workflow

```bash
git checkout -b release/<x.y.z> develop
# bump version in package.json, finalize CHANGELOG, last fixes only
git checkout main && git merge --no-ff release/<x.y.z>
git tag -a v<x.y.z> -m "v<x.y.z>"
git checkout develop && git merge --no-ff release/<x.y.z>
git branch -d release/<x.y.z>
```

`main` is what gets deployed (Heroku/Render) and submitted. Tag the commit you submit.

## Hotfix workflow

```bash
git checkout -b hotfix/<desc> main
# fix + bump patch version
git checkout main && git merge --no-ff hotfix/<desc> && git tag -a v<x.y.z+1> -m "..."
git checkout develop && git merge --no-ff hotfix/<desc>
git branch -d hotfix/<desc>
```

## Definition of done (per branch)

- [ ] `npm run lint` and `npm test` pass.
- [ ] Conventional commit messages.
- [ ] Spec/ADR/`CLAUDE.md` updated if behaviour or decisions changed.
- [ ] No changes under `core/` (vendored template) unless explicitly justified in the PR.

## Remote (not set up yet)

The project is **local-only for now** (decision in ADR 0004). When a public GitHub repo is added:

```bash
git remote add origin <url>
git push -u origin main develop
# set develop as the default branch; protect main + develop (require CI + 1 review)
```

After that, replace local `--no-ff` merges with GitHub PRs targeting `develop`; CI (`.github/workflows/ci.yml`) runs on every PR and on pushes to `main`/`develop`.
