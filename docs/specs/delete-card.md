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

**200** — `{ status, message, data }` where `data` is the card with `deleted` set to a Unix-ms timestamp.

| Error | HTTP | When |
|-------|------|------|
| field validation | 400 | `creator_reference` missing/wrong length (no custom code) |
| `NF01` | 404 | card does not exist (or already deleted) |

> The spec defines `NF01` for a missing card on delete. If you additionally gate deletion on a matching `creator_reference`, decide and document the response for a mismatch (the spec does not define one); the safe default is to treat it the same as not-found.
