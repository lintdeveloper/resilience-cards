# Creator Card — detailed specs

Markdown specs for the service. Pairs with the high-level contract in
[`../creator-card-spec.md`](../creator-card-spec.md) and the decisions in [`../adr/`](../adr/).

- [`data-model.md`](data-model.md) — the Creator Card entity, every field rule, and which layer enforces it.
- [`create-card.md`](create-card.md) — `POST /creator-cards`
- [`get-card.md`](get-card.md) — `GET /creator-cards/:slug`
- [`delete-card.md`](delete-card.md) — `DELETE /creator-cards/:slug`

## Validation layers

Each field rule is enforced in one of three places (see [ADR 0003](../adr/0003-validation-and-slug-strategy.md)):

| Layer | Enforces | Mechanism |
|-------|----------|-----------|
| **VSL** | type, length, enum, `startsWith` | `@app-core/validator` spec, parsed once per service |
| **Business rule** | charset (regex), cross-field conditionals, uniqueness | explicit checks → `throwAppError(msg, code, { context:{ code } })` |
| **Auto** | slug generation, timestamps, id | set by the service before persisting |

VSL failures → HTTP 400 with no custom code. Business-rule failures → the HTTP status + assessment code listed per endpoint.
