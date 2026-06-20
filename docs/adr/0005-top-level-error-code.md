# 0005 — Emit the assessment error code at the top level (minimal core edit)

- **Status:** Accepted (supersedes the placement decision in [ADR 0002](0002-error-codes-to-http-status.md))
- **Date:** 2026-06-20

## Context

A re-read of the assessment is explicit about the error response shape:

```json
{ "status": "error", "message": "...", "code": "SL02" }
```

> "Error codes live at the top level (not nested)."

ADR 0002 had placed the code under `data.code` to avoid editing the vendored `core/` (ADR 0001). But the template's server (`core/express/server.js`) emits `{ status, message, errors, data }` and has **no top-level `code`** — and there is **no app-level hook** to add one:

- the success path hard-codes `status: 'success'`,
- `onResponseEnd` runs after the response is already sent,
- middlewares run before the handler and cannot reshape a thrown error.

8 of the 16 graded test cases assert the error code, and "follow the spec to the letter" is the primary grading criterion. `data.code` is therefore an explicit, material violation.

## Decision

Make one localized, documented edit to the catch block of `core/express/server.js`: when a thrown application error carries an assessment code via `error.context.code`, surface it at the **top level** as `code`; otherwise keep the original behaviour (expose `context` as `data`).

```js
if (error.context && error.context.code) {
  responseComponents.body.code = error.context.code;
} else {
  responseComponents.body.data = error.context;
}
```

`throwCardError` is unchanged — it still passes `{ context: { code } }` and the template `ERROR_CODE` that drives the HTTP status. Result for business errors: exactly `{ status: 'error', message, code }`. VSL field-validation errors are unaffected (their `errors` array still flows; no custom code).

This is a **deliberate, minimal exception** to ADR 0001's "keep `core/` pristine" — accepted because the spec's documented contract cannot be met any other way. The edit is clearly commented (`resilience-cards:`) and confined to the error-response branch.

## Consequences

- **Positive:** Error responses now match the spec to the letter; all 16 cases assert correctly. One small, well-marked change; the rest of `core/` remains upstream-identical.
- **Negative:** `core/express/server.js` is no longer byte-identical to upstream — a reviewer comparing against the template will see this diff. Mitigated by the inline comment and this ADR.
- The e2e suite asserts the top-level `code`; `docs/specs/*` and `CLAUDE.md` updated accordingly.
