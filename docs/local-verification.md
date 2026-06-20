# Running & verifying locally

## Automated tests

```bash
npm test     # 36 tests: helper units + e2e for all 16 assessment cases (mock models)
npm run lint
```

`npm test` runs against the template's stub models (`USE_MOCK_MODEL=1`, set via `cross-env`), so no database is required. The e2e suite (`test/creator-cards/endpoints.e2e.test.js`) drives the real router + VSL + services + serialization and covers every assessment scenario.

## Manual verification against a real MongoDB

```bash
make infra-up                 # start local Mongo (docker-compose) on :27017
npm run dev                   # start the API on :3000 (uses .env)
```

Then exercise the endpoints (this exact flow was used to verify persistence, slug
uniqueness, private access, and soft-delete):

```bash
B=http://localhost:3000

# create (public) -> 200, returns id (ULID, never _id), access_code: null
curl -s -X POST $B/creator-cards -H 'Content-Type: application/json' -d '{
  "title":"George Cooks","slug":"george-cooks","creator_reference":"crt_8f2k1m9x4p7w3q5z",
  "links":[{"title":"YouTube","url":"https://youtube.com/@georgecooks"}],
  "service_rates":{"currency":"NGN","rates":[{"name":"IG Story","description":"one","amount":5000000}]},
  "status":"published","access_type":"public"}'

# create without slug -> auto-generated (suffix appended if taken)
curl -s -X POST $B/creator-cards -H 'Content-Type: application/json' \
  -d '{"title":"George Cooks","creator_reference":"crt_8f2k1m9x4p7w3q5z","status":"published"}'

# duplicate client slug -> 400 { ... data.code: "SL02" }
# retrieve (public) -> 200, access_code omitted
curl -s $B/creator-cards/george-cooks

# private access -> 403 AC03 (no code) / 403 AC04 (wrong) / 200 (correct)
curl -s "$B/creator-cards/secret-card?access_code=A1B2C3"

# delete -> 200, returns card with deleted timestamp
curl -s -X DELETE $B/creator-cards/george-cooks -H 'Content-Type: application/json' \
  -d '{"creator_reference":"crt_8f2k1m9x4p7w3q5z"}'

# get deleted -> 404 NF01 ; the slug is freed and can be re-created
```

```bash
make infra-down               # stop local Mongo
```

## Notes

- Error responses are `{ status:"error", message, data:{ code } }` — the assessment
  code is under `data.code` (see [ADR 0002](adr/0002-error-codes-to-http-status.md)).
- `_id` is always serialized as `id`; `access_code` is returned on create/delete and
  omitted on GET.
- Deployment runs `node bootstrap.js` (`Procfile`); set `MONGODB_URI` (+ `PORT`) in the host env.
