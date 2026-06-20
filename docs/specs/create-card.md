# POST /creator-cards

Create a creator card. Returns **HTTP 200** with the created card on success.

## Request body

| Field | Required | Rules | Layer |
|-------|----------|-------|-------|
| `title` | yes | 3–100 chars | VSL |
| `description` | no | ≤ 500 chars | VSL |
| `slug` | no | 5–50 chars; charset `[A-Za-z0-9_-]` | VSL (length) + business (charset) |
| `creator_reference` | yes | exactly 20 chars | VSL |
| `links[]` | no | each `title` 1–100, `url` ≤ 200 starting `http(s)://` | VSL |
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

**200** — message `"Creator Card Created Successfully."`, `data` is the full card including `id`, `created`, `updated`, `deleted: null`, and **`access_code`** (`null` for public, the value for private — create *does* return it; only GET omits it).

| Error | HTTP | Code | Message |
|-------|------|------|---------|
| field validation | 400 | — (none) | framework validator message(s) |
| slug taken | 400 | `SL02` | "Slug is already taken" |
| access_code required | 400 | `AC01` | "access_code is required when access_type is private" |
| access_code on public | 400 | `AC05` | "access_code can only be set on private cards" |

Business errors return `{ status: "error", message, code }` (code at the top level — see [ADR 0005](../adr/0005-top-level-error-code.md)). Field-validation errors come from the VSL validator with no custom code.
