# Architecture Decision Records

Short records of the consequential decisions on this project — the *why* behind choices that aren't obvious from the code.

Format: lightweight [MADR](https://adr.github.io/madr/) — **Status · Context · Decision · Consequences**. One file per decision, numbered, immutable once `Accepted` (supersede with a new ADR rather than editing).

| # | Title | Status |
|---|-------|--------|
| [0001](0001-use-r17-template-single-app.md) | Use the R17 node-template as a single app (not a monorepo) | Accepted |
| [0002](0002-error-codes-to-http-status.md) | Map assessment error codes to HTTP status via the template error utility | Accepted |
| [0003](0003-validation-and-slug-strategy.md) | Split validation: VSL for field shape, service rules for slug & access_code | Accepted |
| [0004](0004-adopt-gitflow.md) | Adopt the GitFlow branching model | Accepted |
