# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **Creator Card Microservice API** built for the R17 "Node.js Backend Engineer 2026" assessment. It is scaffolded from the official **`the17thstudio/node-template`** and that structure is **mandatory** — the assessment grades instruction adherence and template compliance above all. The full contract is in `docs/creator-card-spec.md`. Read it before implementing.

> The grading rule: *a correct implementation that deviates from the spec or template conventions will be rejected.* Do not introduce TypeScript, a different framework, a different validator, or your own error utilities.

## Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install deps (resolves local `file:` core packages; wires husky hooks via `prepare`). |
| `npm run dev` | Run API with auto-reload (nodemon → `app.js`). |
| `npm start` | Production entrypoint (`node bootstrap.js`) — also how Heroku/Render run it (`Procfile`). |
| `npm test` | Mocha suite (`USE_MOCK_MODEL=1`, recursive, `--require dotenv/config`). Tests are colocated as `test.js` files. |
| `npm run lint` / `lint:fix` | ESLint (airbnb-base + prettier). |
| `npm run format` | Prettier write. |
| `npm run sync-envs` | Regenerate `.env.example` from `.env` (strips values). **`.env` is the source of truth.** |
| `make infra-up` / `infra-down` | Local MongoDB via docker-compose (`mongodb://localhost:27017/resilience_cards`). |

Run a single test file: `npx mocha path/to/file.test.js --require dotenv/config` (set `USE_MOCK_MODEL=1` to use the in-memory mock factory instead of a real DB).

Node version is pinned in `.nvmrc` (v20.19.6).

## Package management — important

This is **not** a pnpm workspace. The template is a single npm app whose `core/*` and top-level packages (`messages`, `services`, etc.) are wired as **local `file:` dependencies** in `package.json`, exposed as path aliases:

- `@app-core/*` → `core/*` (e.g. `@app-core/server` → `core/express`, `@app-core/validator` → `core/validator-vsl`).
- `@app/*` → top-level dirs (`@app/services`, `@app/messages`, `@app/middlewares`, `@app/models`, `@app/repository`, `@app/workers`).

Use **npm**, and use these aliases — never relative `../../core` paths.

## Request lifecycle

`bootstrap.js` (optional AWS Secrets load) → `app.js` (connect Mongo, create Bull queue, build server, register endpoint dirs) → per request: **Endpoint → Middleware(s) → Service → Repository → MongoDB**.

- **Endpoints** (`endpoints/<group>/<name>.js`): thin. Built with `createHandler({ path, method, middlewares, handler, onResponseEnd })` from `@app-core/server`. The handler `(rc, helpers)` reads `rc.body | rc.query | rc.params | rc.headers | rc.meta` and returns `{ status: helpers.http_statuses.HTTP_200_OK, data }`. No business logic here.
- **Services** (`services/<group>/<name>.js`): all business logic. Signature `(serviceData, options?)`. **Validate first** with a pre-parsed VSL spec, then talk to repositories, then `return` a single response object. Throw business errors with `throwAppError`.
- **Repositories** (`repository/<resource>/index.js`): `createRepositoryFactory('ModelName')` from `@app-core/repository-factory` gives `{ create, createMany, findOne, findMany, updateOne, updateMany, deleteOne, raw }`.
- **Models** (`models/<name>.js`, registered in `models/index.js`): `createModel('Name', (types) => schema)` from `@app-core/mongoose`.
- **Messages** (`messages/<resource>.js`, registered in `messages/index.js`): plain `{ KEY: 'human text' }` objects for error/response copy.

### Registering a new endpoint group

`app.js` loads every file in each `ENDPOINT_CONFIGS[].path` and calls `server.addHandler`. To add the creator-cards routes, create `endpoints/creator-cards/` with handler files, then add `{ path: './endpoints/creator-cards/' }` to `ENDPOINT_CONFIGS`. **Only add the config once real `.js` handlers exist** — `app.js` does `require()` on *every* file in the directory, so a stray non-JS file (or an empty, git-untracked dir) will break boot. Endpoints have no path prefix, so a handler with `path: '/creator-cards'` is served at the root (the spec forbids `/v1` versioning).

## Errors → HTTP status (the part that trips people up)

There is **no custom-code-to-status table for the assessment codes**. In `core/express/server.js` the mapping is:

```js
statusCode = !error.isApplicationError ? 500 : ERROR_STATUS_CODE_MAPPING[error.errorCode] || 400;
```

`throwAppError(message, errorCode, { context, details })` (`@app-core/errors`). The HTTP status is derived from `errorCode` via `ERROR_STATUS_CODE_MAPPING` (keyed by the *value* strings in `ERROR_CODE`), **defaulting to 400** when unmapped. So:

- **400** (SL02, AC01, AC05): throw with `ERROR_CODE.INVLDDATA` (`'INVALID_REQUEST_DATA'`, unmapped → defaults to 400). Not `DUPLRCRD` (→409). VSL field errors throw `SPCL_VALIDATION` → 400 automatically.
- **404** (NF01, NF02): throw with `ERROR_CODE.NOTFOUND` (`'RESOURCE_NOT_FOUND'`).
- **403** (AC03, AC04): throw with `ERROR_CODE.INVLDREQ` (`'INVALID_REQUEST'`).

**The error body does NOT include a top-level `code`.** Verified empirically: the server emits `{ status:'error', message, errors: error.details, data: error.context }`. We surface the assessment code via `context` so it lands at **`data.code`**: `throwAppError(msg, ERROR_CODE.NOTFOUND, { context: { code: 'NF02' } })` → HTTP 404 `{ status:'error', message, data:{ code:'NF02' } }`.

> ⚠️ The assessment *documents* a top-level `code`. We keep `core/` pristine (decision), so our code is nested under `data`. Producing a top-level `code` would require a one-line edit to `core/express/server.js` (`body.code = error.errorCode`) — out of scope unless grading proves it checks `body.code` strictly. See `docs/adr/0002-error-codes-to-http-status.md`. Centralise raising in one app helper so this stays a one-place change.

Success envelope: `{ status:'success', message, data }`. Use the **exact** messages: `"Creator Card Created Successfully."`, `"Creator Card Retrieved Successfully."`, `"Creator Card Deleted Successfully."` (keep these in `messages/`, never hardcoded).

**`access_code` in responses:** included on **create** and **delete** (`null` for public, the value for private); **omitted entirely on GET**.

## Validation (VSL)

`@app-core/validator` (= `core/validator-vsl`) exposes `parse(spec)` and `validate(data, parsedSpec, options?)`. **Parse the spec once at module load**, validate per call:

```js
const validator = require('@app-core/validator');
const spec = `root {
  title string<minLength:3|maxLength:100>
  slug? string<minLength:5|maxLength:50>
  links[] {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200>
  }
  status string(draft|published)
}`;
const parsedSpec = validator.parse(spec);
// inside service: const data = validator.validate(serviceData, parsedSpec);
```

VSL syntax (verified against `core/validator-vsl/tests/*.js`):
- Required space in `root {`.
- Constraints go in **angle brackets, pipe-separated**: `string<trim|minLength:3|maxLength:100>`.
- Strings: `minLength`/`maxLength`/`length`, `trim`, `lowercase`, `uppercase`, `isEmail`, `isAnyOf:a,b,c`. Numbers: `min`/`max`/`between`.
- Enums (shorthand): `status string(draft|published)`. Optional fields: `slug? string<...>`. Arrays: `links[] { ... }` or `tags[] string<...>`.
- `NO_SINGLE_ERRORS=1` collects all field errors instead of throwing on the first.

**VSL has no regex / pattern / alphanumeric constraint, and no cross-field conditional.** So rules like `slug` charset (letters/numbers/`-`/`_`), `access_code` "6 alphanumeric chars", and "access_code required iff private" are **business rules in the service** (raised with `throwAppError` + the assessment code), not VSL field constraints. Use VSL only for type/length/enum/`startsWith`. See `docs/adr/0003-validation-and-slug-strategy.md`.

**🚫 No regex anywhere (template assessment rule, README "String Manipulation").** Forbidden: `.match()`, regex `.replace(/…/)`, `.test()`, regex `.split(/…/)`. Allowed: `.split('x')`, `.indexOf`, `.substring`, `.slice`, `.trim`, `.toLowerCase`/`.toUpperCase`, `.replace('old','new')`, `.startsWith`/`.endsWith`/`.includes`. Implement charset checks with an allowed-character `Set` and slug generation with plain string ops.

## Conventions

- **`id` vs `_id`**: API responses must expose the Mongo `_id` as `id` (a 26-char ULID string, not an ObjectId). Never leak `_id`. Generate ids with `ulid()` from `@app-core/randomness`; set `_id` explicitly on create.
- **Template code-quality rules** (from `documentation.md` "Code Quality Rules" — graded): **single `return`** per function (declare `response` at top, return once); **one exported function per file**; services take **one object param** `(serviceData, options)`; **validate first**, before any logic; **error messages from `messages/` files**, never hardcoded.
- **Logging**: use `appLogger` from `@app-core/logger` (`.info/.warn/.error/.errorX`). Never `console.log` in services/endpoints.
- **Commits**: husky + commitlint enforce **conventional commits** (`feat:`, `fix:`, `chore:`…). `lint-staged` runs prettier + eslint on staged `*.{js,ts}` pre-commit.
- **Style**: 2-space indent, single quotes, semicolons, `printWidth` 100 (`.prettierrc`).

## Reference docs in this repo

- `docs/creator-card-spec.md` — the authoritative assessment contract.
- `docs/adr/` — architecture decision records (template-vs-monorepo, error-code→HTTP, validation/slug strategy). Read these for the *why*.
- `docs/specs/` — detailed markdown specs: `data-model.md` (every field rule + which layer enforces it) and one file per endpoint with request/response shapes and error codes.
- `README.md` and `documentation.md` — upstream template's own architecture/usage guides (detailed VSL + core API reference). Keep for reference.
- `specs/examples/` — the template's own VSL spec examples (`.go` extension = syntax highlighting only). We document our own specs in `docs/` as markdown instead; field rules still live inline in the service code as VSL.
