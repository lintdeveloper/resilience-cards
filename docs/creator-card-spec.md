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
- Business rules via `throwAppError` (see error table).
- Auto-generate `slug` from `title` when omitted: lowercase → spaces to `-` → strip chars outside `[a-z0-9-_]` → if `< 5` chars **or** taken, append `-` + 6-char random alphanumeric suffix.
- Client-provided slug that is already taken → **400 `SL02`** (do not silently re-suffix a client slug).
- Success → **HTTP 200** with the created card.

### 2. `GET /creator-cards/:slug` — public read
Enforce checks in **strict order**:
1. Not found → **404 `NF01`**
2. Exists but `status === 'draft'` → **404 `NF02`**
3. `access_type === 'private'` and no `access_code` query param → **403 `AC03`**
4. private and wrong `access_code` → **403 `AC04`**
5. Otherwise → **HTTP 200** with card data. **Never** expose `access_code`.

Private access via query param: `GET /creator-cards/:slug?access_code=A1B2C3`.

### 3. `DELETE /creator-cards/:slug` — delete
- Requires `creator_reference` (exactly 20 chars) in the request body.
- Not found → **404 `NF01`**.
- Success → **HTTP 200** with the deleted card (including `deleted` timestamp).
- Soft delete (`deleted` = timestamp); deleted cards are unretrievable via GET.

## Data model (Creator Card)

| field | rules |
|-------|-------|
| `id` | ULID, serialized from Mongo `_id`. **Always `id`, never `_id`** in responses. |
| `title` | string, 3–100 chars |
| `description` | string, ≤ 500 chars |
| `slug` | string, 5–50 chars, unique, `[A-Za-z0-9-_]` only |
| `creator_reference` | string, exactly 20 chars |
| `links[]` | each: `title` 1–100, `url` ≤ 200 and starts with `http://` or `https://` |
| `service_rates` | optional object; if present: `currency` ∈ {NGN,USD,GBP,GHS}, `rates[]` non-empty |
| `service_rates.rates[]` | each: `name` 3–100, `description` ≤ 250, `amount` positive integer (minor units) |
| `status` | enum `draft` \| `published` |
| `access_type` | enum `public` \| `private`; default `public` |
| `access_code` | exactly 6 alphanumeric chars; required if private, forbidden if public |
| `created` / `updated` | Unix milliseconds |
| `deleted` | Unix milliseconds \| null |

## Custom error codes

| Code | HTTP | Scenario |
|------|------|----------|
| `SL02` | 400 | Slug already taken (client-provided) |
| `AC01` | 400 | `access_code` required on private card |
| `AC05` | 400 | `access_code` provided on public card |
| `NF01` | 404 | Card not found |
| `NF02` | 404 | Card exists but is draft |
| `AC03` | 403 | Private card, no `access_code` supplied |
| `AC04` | 403 | Private card, wrong `access_code` |

Field-level validation errors (type/length/enum/required) are handled by the VSL validator → **HTTP 400**, no custom code.

## Deliverables checklist
- [ ] Public GitHub repo built on `the17thstudio/node-template` (structure preserved).
- [ ] Deployed on Heroku/Render/equivalent; all endpoints public, no auth.
- [ ] Submit base URL only + repo link via the assessment form before the deadline.
