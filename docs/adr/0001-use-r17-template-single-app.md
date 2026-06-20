# 0001 — Use the R17 node-template as a single app (not a monorepo)

- **Status:** Accepted
- **Date:** 2026-06-19

## Context

This repository implements the R17 "Node.js Backend Engineer 2026" assessment — a single Creator Card microservice with three endpoints (`docs/creator-card-spec.md`). The assessment makes two non-negotiable demands:

1. Build on the official [`the17thstudio/node-template`](https://github.com/the17thstudio/node-template) and **follow its structure** (services, endpoints, messages, middleware conventions).
2. Use the template's own VSL validator and error utilities.

Grading explicitly states that *a correct implementation that deviates from the spec or template conventions will be rejected*, and ranks instruction-adherence as the primary criterion.

The template is a **single vanilla-JS app** managed with npm, whose framework modules under `core/*` are wired as local `file:` dependencies and exposed via `@app-core/*` / `@app/*` path aliases. It is not a workspace.

We considered mirroring an internal reference project (`fnstack`), a TypeScript pnpm monorepo (`apps/*`, `libs/*`, `libs/modules/*`).

## Decision

Keep the template **as-is at the repository root as a single app.** Do not introduce a pnpm/npm workspace, `apps/*`/`libs/*` layout, or TypeScript. Layer only non-structural developer tooling on top (`.gitignore`, `.nvmrc`, `Makefile`, `docker-compose`, CI, `.eslintignore`/`.prettierignore`, `CLAUDE.md`, `docs/`). The vendored `core/` is kept byte-identical to upstream (enforced via `.prettierignore` + `.eslintignore`).

## Consequences

- **Positive:** Maximum template compliance — the dimension graded hardest. Simplest deployment (Heroku/Render run `node bootstrap.js` via the existing `Procfile` from root). The template's `file:` packages already provide framework/app separation, so we lose no modularity.
- **Negative:** No workspace ergonomics (single `package.json`, no per-package builds). Acceptable: there is exactly one deployable and nothing to share across packages.
- **Neutral:** If this service were ever grown into multiple services post-assessment, it could be migrated into a monorepo later. That is out of scope here.
- A monorepo restructure was rejected specifically because reshaping the template would read as a deviation from "follow the template structure."
