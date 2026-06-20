# DELETE /creator-cards/:slug

Soft-delete a card. Returns **HTTP 200** with the deleted card (including the `deleted` timestamp). Deleted cards become unretrievable via `GET`.

## Parameters

| Location | Field | Rules |
|----------|-------|-------|
| path | `slug` | 5–50 chars |
| body | `creator_reference` | required, exactly 20 chars |

## Example request

```json
{ "creator_reference": "abcdefghij1234567890" }
```

## Responses

**200** — message `"Creator Card Deleted Successfully."`, `data` is the full card (same shape as create, **including `access_code`**) with `deleted` set to a Unix-ms timestamp.

| Error | HTTP | Code | Message |
|-------|------|------|---------|
| field validation | 400 | — (none) | framework validator message (e.g. `creator_reference` not 20 chars) |
| not found | 404 | `NF01` | "Creator card not found" |

Errors return `{ status: "error", message, data: { code } }` (see [ADR 0002](../adr/0002-error-codes-to-http-status.md)).

> **`creator_reference` is validated for presence + exactly 20 chars (framework validation) and the card is deleted by `slug`.** The assessment defines no behaviour for a `creator_reference` that doesn't match the stored value and has no test for it — so do **not** gate deletion on a match (that would be undefined behaviour and risks failing the happy-path test). Existence is the only business check → `NF01`.
