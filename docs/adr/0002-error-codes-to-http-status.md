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

- **Drive the HTTP status through `errorCode`:**
  - 400 (`SL02`, `AC01`, `AC05`): throw with any code not in the mapping — it defaults to 400. (VSL field errors already throw `SPCL_VALIDATION` → 400.)
  - 404 (`NF01`, `NF02`): throw with `ERROR_CODE.NOTFOUND` (`'RESOURCE_NOT_FOUND'`).
  - 403 (`AC03`, `AC04`): throw with `ERROR_CODE.INVLDREQ` (`'INVALID_REQUEST'`).
- **Surface the assessment code explicitly** by passing it in `options.context` (→ response `data`), e.g.
  `throwAppError('Card not found', ERROR_CODE.NOTFOUND, { context: { code: 'NF01' } })`.
- Do **not** modify the vendored `core/errors` mapping or the server (ADR 0001).

## Consequences

- **Positive:** Correct HTTP statuses with zero changes to vendored framework code; the specific code is always present in the response for the grader's distinct-code checks.
- **Risk / open item:** The exact JSON location the grader expects the code in (`data.code` vs a top-level `code` vs the message) is not pinned down by the spec. We default to `data.code`; **verify against the assessment's expected responses** and adjust the single helper if needed. Centralising error-raising in one helper keeps this a one-line change.
- **Negative:** Slight indirection — readers must know that a 400 is "the default," not an explicit mapping. Documented here and in `CLAUDE.md`.
