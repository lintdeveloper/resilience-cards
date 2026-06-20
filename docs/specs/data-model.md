# Data model — Creator Card

The Mongo `_id` is a **ULID** and is serialized as **`id`** in every API response (never `_id`). `access_code` is **never** returned in any response.

## Fields

| Field | Type | Rules | Layer | Notes |
|-------|------|-------|-------|-------|
| `id` | string | ULID, 26 chars | auto | serialized from `_id` |
| `title` | string | 3–100 chars | VSL | |
| `description` | string | ≤ 500 chars | VSL | optional |
| `slug` | string | 5–50 chars; charset `[A-Za-z0-9_-]`; unique | VSL (length) + business (charset, uniqueness) | auto-generated from `title` when omitted |
| `creator_reference` | string | exactly 20 chars | VSL (`length:20`) | owner secret; required to delete |
| `links[]` | array | non-empty | VSL | |
| `links[].title` | string | 1–100 chars | VSL | |
| `links[].url` | string | ≤ 200 chars; starts with `http://` or `https://` | VSL (`maxLength`, `startsWith:http`) | |
| `service_rates` | object | optional | VSL | when present, fields below required |
| `service_rates.currency` | string | enum `NGN \| USD \| GBP \| GHS` | VSL | |
| `service_rates.rates[]` | array | non-empty | VSL | |
| `service_rates.rates[].name` | string | 3–100 chars | VSL | |
| `service_rates.rates[].description` | string | ≤ 250 chars | VSL | optional |
| `service_rates.rates[].amount` | number | positive integer, minor units | VSL (`min:1`) + business (integer) | e.g. kobo/cents |
| `status` | string | enum `draft \| published` | VSL | |
| `access_type` | string | enum `public \| private`; default `public` | VSL | |
| `access_code` | string | exactly 6 alphanumeric chars | VSL (`length:6`) + business (alphanumeric + conditional) | required iff private, forbidden iff public; never returned |
| `created` | number | Unix ms | auto | set on create |
| `updated` | number | Unix ms | auto | set on create + every update |
| `deleted` | number \| null | Unix ms | auto | set on soft delete; null while live |

## Persistence notes

- Unique index on `slug` backs uniqueness; the service also pre-checks to return `SL02` cleanly and should treat a duplicate-key write error as the same condition (race safety).
- Index `creator_reference` and `status` (used by delete and the draft check).
- Soft delete only: set `deleted` to a timestamp; deleted cards must be unretrievable via `GET`.
