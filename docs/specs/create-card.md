# POST /creator-cards

Create a creator card. Returns **HTTP 200** with the created card on success.

## Request body

| Field | Required | Rules | Layer |
|-------|----------|-------|-------|
| `title` | yes | 3–100 chars | VSL |
| `description` | no | ≤ 500 chars | VSL |
| `slug` | no | 5–50 chars; charset `[A-Za-z0-9_-]` | VSL (length) + business (charset) |
| `creator_reference` | yes | exactly 20 chars | VSL |
| `links[]` | yes | non-empty; each `title` 1–100, `url` ≤ 200 starting `http(s)://` | VSL |
| `service_rates` | no | if present: `currency` enum, `rates[]` non-empty (`name` 3–100, `description` ≤ 250, `amount` positive int) | VSL + business (int) |
| `status` | yes | enum `draft \| published` | VSL |
| `access_type` | no | enum `public \| private` (default `public`) | VSL |
| `access_code` | conditional | exactly 6 alphanumeric chars | VSL (length) + business (charset + conditional) |

### Slug handling
- **Omitted:** auto-generate — lowercase `title` → spaces to `-` → strip chars outside `[a-z0-9-_]` → if `< 5` chars **or** taken, append `-` + 6-char random alphanumeric suffix (regenerate until unique).
- **Provided & already taken:** reject with `SL02` (do not silently re-suffix a client slug).

### access_code rule
- `access_type: private` and no `access_code` → `AC01`.
- `access_type: public` (or default) and `access_code` present → `AC05`.

## Example request

```json
{
  "title": "Jane's Studio",
  "description": "Booking and links",
  "creator_reference": "abcdefghij1234567890",
  "links": [{ "title": "Portfolio", "url": "https://jane.example" }],
  "service_rates": {
    "currency": "USD",
    "rates": [{ "name": "Consult", "description": "30 min", "amount": 5000 }]
  },
  "status": "published",
  "access_type": "public"
}
```

## Responses

**200** — `{ status, message, data }` where `data` is the card (with `id`, `created`, `updated`, `deleted: null`; **no `access_code`**).

| Error | HTTP | When |
|-------|------|------|
| field validation | 400 | type/length/enum/required failures (no custom code) |
| `SL02` | 400 | client-supplied slug already taken |
| `AC01` | 400 | `access_code` required on a private card |
| `AC05` | 400 | `access_code` provided on a public card |
