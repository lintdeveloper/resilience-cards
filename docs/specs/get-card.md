# GET /creator-cards/:slug

Public retrieval. Private cards pass the code as a query param:
`GET /creator-cards/:slug?access_code=A1B2C3`.

## Access checks — strict order

Evaluate in this exact order; return on the first failure:

1. Card does not exist (or is soft-deleted) → **404 `NF01`**
2. `status === 'draft'` → **404 `NF02`** (exists but not public — distinct code on purpose)
3. `access_type === 'private'` and no `access_code` query param → **403 `AC03`**
4. `access_type === 'private'` and wrong `access_code` → **403 `AC04`**
5. Otherwise → **200** with the card

## Parameters

| Location | Field | Rules |
|----------|-------|-------|
| path | `slug` | 5–50 chars |
| query | `access_code` | required only for private cards; 6 chars |

## Responses

**200** — `{ status, message, data }` where `data` is the card. **`access_code` is never included.**

| Error | HTTP | When |
|-------|------|------|
| `NF01` | 404 | not found / deleted |
| `NF02` | 404 | exists but draft |
| `AC03` | 403 | private, no `access_code` |
| `AC04` | 403 | private, wrong `access_code` |
