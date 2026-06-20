# Creator Card Microservice — Assessment Spec

> Source: https://assessments.r17.tech/nodejsbackendengineer2026-assessment-2197791m0
> Submission deadline: **2026-06-24**. Submit (1) public GitHub repo link and (2) deployed base URL only (no path, no versioning).
>
> The repo's bundled `assessment.md` is the generic R17 job posting, **not** this spec. This file is the authoritative contract for the build.

## Primary grading rule

**Follow the spec to the letter.** A correct implementation that deviates from the spec will be rejected. Endpoints live at the **root** (`/creator-cards`, never `/v1/creator-cards`). **No auth** of any kind.

## Endpoints

### 1. `POST /creator-cards` — create
- Validate all fields with the template VSL validator (`@app-core/validator`).
- Business rules via `throwAppError` (see error table). Charset checks use **no regex** (template rule — see below).
- Auto-generate `slug` from `title` when omitted: lowercase → spaces to `-` → drop chars outside letters/numbers/`-`/`_` → if `< 5` chars **or** taken, append `-` + 6-char random alphanumeric suffix.
- Client-provided slug that is already taken → **400 `SL02`** (do not silently re-suffix a client slug).
- Success → **HTTP 200**, message `"Creator Card Created Successfully."`, `data` = created card **including `access_code`** (`null` for public, the value for private).

### 2. `GET /creator-cards/:slug` — public read
Enforce checks in **strict order**:
1. Not found (or soft-deleted) → **404 `NF01`**
2. Exists but `status === 'draft'` → **404 `NF02`**
3. `access_type === 'private'` and no `access_code` query param → **403 `AC03`**
4. private and wrong `access_code` → **403 `AC04`**
5. Otherwise → **HTTP 200**, message `"Creator Card Retrieved Successfully."`. **Omit `access_code` entirely** from the response (not even `null`).

Private access via query param: `GET /creator-cards/:slug?access_code=A1B2C3`.

### 3. `DELETE /creator-cards/:slug` — delete
- Requires `creator_reference` (exactly 20 chars) in the request body — validated for presence/length only; **the card is deleted by `slug`, not gated on a `creator_reference` match** (the spec defines no mismatch behaviour and has no test for it).
- Not found → **404 `NF01`**.
- Success → **HTTP 200**, message `"Creator Card Deleted Successfully."`, `data` = the card (same shape as create, including `access_code`) with `deleted` set.
- Soft delete (`deleted` = timestamp); deleted cards are unretrievable via GET (→ `NF01`).

## Response envelopes

- **Success:** `{ "status": "success", "message": "<exact message above>", "data": { ...card } }`.
- **Error:** `{ "status": "error", "message": "...", "code": "<CODE>" }` — `code` at the **top level**, as the spec requires (via a minimal documented edit to `core/express/server.js`; see [ADR 0005](adr/0005-top-level-error-code.md)). VSL field-validation errors return the validator's response (HTTP 400, no custom code).

## No regex (template rule)

`README.md` → "String Manipulation (No Regex Allowed)" forbids `.match()`, regex `.replace()/.split()`, `.test()`. Slug/charset/access_code checks and slug generation must use basic string methods + an allowed-character set. See [ADR 0003](adr/0003-validation-and-slug-strategy.md).

## Data model (Creator Card)

| field | rules |
|-------|-------|
| `id` | ULID, serialized from Mongo `_id`. **Always `id`, never `_id`** in responses. |
| `title` | string, 3–100 chars |
| `description` | string, ≤ 500 chars |
| `slug` | string, 5–50 chars, unique, letters/numbers/`-`/`_` only (charset checked without regex) |
| `creator_reference` | string, exactly 20 chars |
| `links[]` | each: `title` 1–100, `url` ≤ 200 and starts with `http://` or `https://` |
| `service_rates` | optional object; if present: `currency` ∈ {NGN,USD,GBP,GHS}, `rates[]` non-empty |
| `service_rates.rates[]` | each: `name` 3–100, `description` ≤ 250, `amount` positive integer (minor units) |
| `status` | enum `draft` \| `published` |
| `access_type` | enum `public` \| `private`; default `public` |
| `access_code` | exactly 6 alphanumeric chars; required if private, forbidden if public. Returned on create/delete; **omitted on GET** |
| `created` / `updated` | Unix milliseconds |
| `deleted` | Unix milliseconds \| null |

## Custom error codes

| Code | HTTP | Scenario | Exact message |
|------|------|----------|---------------|
| `SL02` | 400 | Slug already taken (client-provided) | "Slug is already taken" |
| `AC01` | 400 | `access_code` required on private card | "access_code is required when access_type is private" |
| `AC05` | 400 | `access_code` provided on public card | "access_code can only be set on private cards" |
| `NF01` | 404 | Card not found | "Creator card not found" |
| `NF02` | 404 | Card exists but is draft | "Creator card not found" |
| `AC03` | 403 | Private card, no `access_code` supplied | "This card is private. An access code is required" |
| `AC04` | 403 | Private card, wrong `access_code` | "Invalid access code" |

Field-level validation errors (type/length/enum/required) are handled by the VSL validator → **HTTP 400**, no custom code. Status mapping per code: 400 via `ERROR_CODE.INVLDDATA`, 404 via `ERROR_CODE.NOTFOUND`, 403 via `ERROR_CODE.INVLDREQ` (see [ADR 0002](adr/0002-error-codes-to-http-status.md)).

## Test matrix (all 16 must pass)

Valid: 1) full create → 200, `access_type` defaults public, `id` not `_id`; 2) create without slug → 200, slug auto-generated; 3) private create with valid `access_code` → 200, code returned; 4) GET public published → 200, no `access_code`; 5) GET private with correct code → 200, no `access_code`; 6) DELETE with `creator_reference` → 200, `deleted` set.

Invalid: 7) duplicate slug → 400 `SL02`; 8) private without `access_code` → 400 `AC01`; 9) public with `access_code` → 400 `AC05`; 10) invalid enum (`status:"archived"`) → 400 (framework, no code); 11) GET unknown slug → 404 `NF01`; 12) GET draft → 404 `NF02`; 13) GET private no code → 403 `AC03`; 14) GET private wrong code → 403 `AC04`; 15) DELETE unknown slug → 404 `NF01`; 16) GET previously deleted → 404 `NF01`.

## Deliverables checklist
- [ ] Public GitHub repo built on `the17thstudio/node-template` (structure preserved).
- [ ] Deployed on Heroku/Render/equivalent; all endpoints public, no auth.
- [ ] Submit base URL only + repo link via the assessment form before the deadline.
