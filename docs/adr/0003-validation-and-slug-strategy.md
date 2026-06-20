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
   - `slug` charset (letters/numbers/`-`/`_`) and `access_code` alphanumeric — **without regex** (see below);
   - conditional `access_code` presence → `AC01` (missing on private) / `AC05` (present on public);
   - slug uniqueness → `SL02` for a duplicate **client-supplied** slug.

### No regex (template rule)

The template's assessment guide (`README.md` → "String Manipulation (No Regex Allowed)") **forbids regex** — no `.match()`, no regex `.replace()`, no `.test()`. Only basic string methods are allowed (`.split`, `.indexOf`, `.substring`, `.slice`, `.trim`, `.toLowerCase`, `.toUpperCase`, `.replace('old','new')`, `.startsWith`, `.endsWith`, `.includes`).

So charset checks are done by **iterating characters against an allowed set**, e.g.:

```js
const SLUG_CHARS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split(''));
const isValidSlug = (s) => s.length > 0 && [...s].every((c) => SLUG_CHARS.has(c));
// access_code: same idea with an alphanumeric set and a length===6 check
```

**Slug auto-generation** (when `slug` omitted), also regex-free:
1. `title.toLowerCase()`
2. replace whitespace with `-` (e.g. `.split(' ').join('-')`, after collapsing/trimming)
3. drop disallowed characters by building the string from chars in `SLUG_CHARS` (filter loop, not `.replace(/.../)`)
4. if result `< 5` chars **or** already taken → append `-` + 6-char random alphanumeric suffix (regenerate until unique).

A *client-supplied* duplicate is an error (`SL02`); an *auto-generated* collision is re-suffixed silently.

## Consequences

- **Positive:** Each rule lives where it can actually be enforced; field errors and business errors get the response shapes the spec wants. Charset/generation helpers are pure and unit-testable in isolation.
- **Negative:** Hand-rolled char checks are more verbose than a regex, and slug normalization needs care (Unicode whitespace, repeated separators). Keep these in small helper functions under `services/creator-cards/helpers/` with focused tests.
- **Negative:** Validation for a single field is split across two layers — must be read together. Mitigated by keeping both in the service file, field-validation immediately followed by business-rule checks.
- Uniqueness relies on a **unique index on `slug`** (see `docs/specs/data-model.md`); the service still pre-checks to return `SL02` cleanly, and should treat a duplicate-key write error as the same condition to avoid a race.
