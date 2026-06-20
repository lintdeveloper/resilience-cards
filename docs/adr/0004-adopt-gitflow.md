# 0004 — Adopt the GitFlow branching model

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

The project is a graded assessment but is treated with production discipline (ADRs, specs, CI). We want a clean, always-deployable mainline for submission, an integration branch for in-progress work, and a history that demonstrates process maturity. Conventional commits are already enforced by husky + commitlint, which pairs naturally with a structured branching model.

Options considered: trunk-based (simplest, but no integration buffer), simplified `main`+`develop`+`feature`, and full GitFlow.

## Decision

Adopt **full GitFlow**:

| Branch | Role | Branches from | Merges into |
|--------|------|---------------|-------------|
| `main` | always submission-ready / deployable; tagged releases | — | — |
| `develop` | integration of completed features | `main` | — |
| `feature/*` | one unit of work | `develop` | `develop` (via `--no-ff`) |
| `release/*` | release stabilisation (version bump, final fixes) | `develop` | `main` (tagged) + back into `develop` |
| `hotfix/*` | urgent fix to a released state | `main` | `main` (tagged) + `develop` |

Rules:
- **`--no-ff` merges** into `develop`/`main` so each feature/release is a visible merge commit (topology is preserved).
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`…) — enforced by commitlint.
- **SemVer tags** on `main` (`vMAJOR.MINOR.PATCH`).
- The vendored `core/` stays pristine (ADR 0001) — a PR that touches `core/` must say why.
- **Deployment tracks `main`** (Heroku/Render); `develop` is for integration/CI only.

Practical commands and the full workflow live in [`CONTRIBUTING.md`](../../CONTRIBUTING.md). The `git-flow` AVH extension is **not** required (it isn't installed); we use plain git.

## Consequences

- **Positive:** Clean, demonstrable history; `main` is always in a submittable state; features are isolated and reviewable; CI can gate `develop` and PRs.
- **Negative:** Ceremony overhead for a solo developer — `release/*` and `hotfix/*` will be used lightly (often a single release branch near submission). Accepted as the cost of the model the team chose.
- **Deferred:** The public GitHub remote and branch protection are **not** set up yet (decision: keep local for now). Until then, "PRs" are local `--no-ff` merges; once a remote exists, the same flow runs through GitHub PRs with required CI checks. See `CONTRIBUTING.md` § Remote.
