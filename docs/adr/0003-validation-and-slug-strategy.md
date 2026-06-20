# 0003 — Split validation: VSL for field shape, service rules for slug & access_code

- **Status:** Accepted
- **Date:** 2026-06-19

## Context

The spec mixes two kinds of validation:

- **Field shape** — types, lengths, enums, required/optional (e.g. `title` 3–100 chars, `status ∈ {draft, published}`, `currency ∈ {NGN,USD,GBP,GHS}`). These map cleanly to the template's VSL validator.
- **Format & business rules** — `slug` must match `[A-Za-z0-9-_]`, `access_code` must be exactly 6 **alphanumeric** chars, `access_code` is required iff `access_type === 'private'` and forbidden when `public`, slug uniqueness, and slug auto-generation.

Reading `core/validator-vsl/validator-contraints.js`, the available string constraints are: `trim`, `lowercase`, `uppercase`, `minLength`, `maxLength`, `length`, `lengthBetween`, `startsWith`, `endsWith`, `isAnyOf`, `isEmail` (numbers: `min`, `max`, `between`). **There is no regex / pattern / alphanumeric constraint, and no cross-field conditional.** So character-class and conditional rules cannot be expressed in VSL alone.

## Decision

Two layers, in this order, inside each service (after the template pattern *validate-first*):

1. **VSL field validation** (parsed once at module load) for everything VSL can express:
   - lengths via `minLength`/`maxLength`/`length` (e.g. `creator_reference string<length:20>`, `access_code string<length:6>`),
   - enums via shorthand (`status string(draft|published)`),
   - `url string<maxLength:200|startsWith:http>` (covers both `http://` and `https://`).
   VSL failures throw `SPCL_VALIDATION` → HTTP 400 with no custom code (matches spec).
2. **Service-level business rules** raised with `throwAppError` + the assessment code (per ADR 0002) for what VSL can't do:
   - `slug` charset regex `^[A-Za-z0-9_-]+$`; `access_code` alphanumeric `^[A-Za-z0-9]{6}$`;
   - conditional `access_code` presence → `AC01` (missing on private) / `AC05` (present on public);
   - slug uniqueness → `SL02` for a duplicate **client-supplied** slug.

**Slug auto-generation** (when `slug` omitted): lowercase `title` → spaces to `-` → strip chars outside `[a-z0-9-_]` → if result `< 5` chars **or** already taken, append `-` + 6-char random alphanumeric suffix (regenerate until unique). A *client-supplied* duplicate is an error (`SL02`); an *auto-generated* collision is re-suffixed silently.

## Consequences

- **Positive:** Each rule lives where it can actually be enforced; field errors and business errors get the response shapes the spec wants. Charset rules are unit-testable in isolation.
- **Negative:** Validation for a single field is split across two layers — must be read together. Mitigated by keeping both in the service file, field-validation immediately followed by business-rule checks, and documenting in `CLAUDE.md`.
- Uniqueness relies on a **unique index on `slug`** (see `docs/specs/data-model.md`); the service still pre-checks to return `SL02` cleanly, and should treat a duplicate-key write error as the same condition to avoid a race.
