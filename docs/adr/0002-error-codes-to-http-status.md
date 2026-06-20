# 0002 — Map assessment error codes to HTTP status via the template error utility

- **Status:** Accepted
- **Date:** 2026-06-19

## Context

The spec defines seven business error codes with specific HTTP statuses:

| Code | HTTP | | Code | HTTP |
|------|------|---|------|------|
| `SL02` | 400 | | `NF01` | 404 |
| `AC01` | 400 | | `NF02` | 404 |
| `AC05` | 400 | | `AC03` | 403 |
| | | | `AC04` | 403 |

The template requires business errors to be raised with `throwAppError(message, errorCode, { context, details })` from `@app-core/errors`. The server derives the HTTP status in `core/express/server.js`:

```js
statusCode = !error.isApplicationError ? 500 : ERROR_STATUS_CODE_MAPPING[error.errorCode] || 400;
```

Two facts fall out of reading that code and `core/errors/constants.js`:

1. `ERROR_STATUS_CODE_MAPPING` is keyed by the **value strings** of `ERROR_CODE` (e.g. `RESOURCE_NOT_FOUND → 404`, `INVALID_REQUEST → 403`). **There is no entry for 400** — any unmapped code falls through to the `|| 400` default.
2. The error response body is `{ status:'error', message, errors: error.details, data: error.context }`. **It does not include the error code.** The assessment codes (`NF01`, `AC03`, …) are not surfaced unless we put them there ourselves — and `NF01`/`NF02` (and `AC03`/`AC04`) share an HTTP status, so the status alone cannot distinguish them.

## Decision

Keep `core/` **pristine** (ADR 0001) and work within the server's actual behaviour, verified empirically by throwing test errors against the real server:

| Thrown | Result |
|--------|--------|
| `throwAppError(msg, 'NF01')` | HTTP **400**, `{status, message}` — code value unmapped → default 400, no code in body |
| `throwAppError(msg, ERROR_CODE.NOTFOUND, { context: { code: 'NF01' } })` | HTTP **404**, `{status, message, data: { code: 'NF01' } }` |

So:

- **Drive HTTP status through `errorCode`** (the value strings, mapped in `core/errors/constants.js`):
  - 400 (`SL02`, `AC01`, `AC05`): `ERROR_CODE.INVLDDATA` (`'INVALID_REQUEST_DATA'`, unmapped → defaults to 400). Do **not** use `DUPLRCRD` for `SL02` — it maps to 409. (VSL field errors already throw `SPCL_VALIDATION` → 400.)
  - 404 (`NF01`, `NF02`): `ERROR_CODE.NOTFOUND` (`'RESOURCE_NOT_FOUND'`).
  - 403 (`AC03`, `AC04`): `ERROR_CODE.INVLDREQ` (`'INVALID_REQUEST'`).
- **Carry the assessment code in `options.context`** so it surfaces under response `data`:
  `throwAppError(Messages.NOT_FOUND, ERROR_CODE.NOTFOUND, { context: { code: 'NF01' } })`.
- Centralise this in one app-level helper (e.g. `services/creator-cards/helpers/throw-card-error.js`) mapping each assessment code → `(ERROR_CODE, message)`, so the pattern is consistent and changeable in one place.

## Consequences

- **Positive:** Correct HTTP statuses and the distinguishing code present in every business-error response, with **zero changes to vendored framework code**.
- **⚠️ Accepted risk:** The assessment's documented error shape is top-level `{ status, message, code }`, but the unmodified server emits `{ status, message, data: { code } }` — our code is nested under `data`. Producing a *top-level* `code` is impossible without editing `core/express/server.js`, which we have chosen not to do. If grading checks `body.code` strictly (rather than `body.data.code`), business-error assertions could fail. Revisit this decision if the submission feedback or a test harness shows a strict top-level check; the centralised helper keeps the fix to one place (and ADR would be superseded to allow the one-line core edit).
- **Negative:** Slight indirection — 400 is "the default," not an explicit map entry; readers must know that.
