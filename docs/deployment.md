# Deployment (Render + MongoDB Atlas)

The app deploys from `main`. It runs `node bootstrap.js` (the `Procfile`/`render.yaml` start command), reads `PORT` from the environment (Render injects it), and connects to `MONGODB_URI`.

## 1. MongoDB Atlas (free M0)

1. Create an account at <https://www.mongodb.com/cloud/atlas> → new **Project** → **Build a Database** → **M0 (free)**, pick a cloud/region.
2. **Database Access** → Add New Database User → username + password, role **Read and write to any database**. Save the credentials.
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). Render's free egress IPs aren't fixed, so this is required.
4. **Connect** → **Drivers** → copy the connection string and insert the password and a database name:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/resilience_cards?retryWrites=true&w=majority
   ```
   URL-encode any special characters in the password (e.g. `@` → `%40`).

## 2. Render web service

**Option A — Blueprint (uses `render.yaml`):** render.com → **New +** → **Blueprint** → connect the GitHub repo → it reads `render.yaml`. Then set `MONGODB_URI` (Environment tab) and deploy.

**Option B — Manual:** render.com → **New +** → **Web Service** → connect `lintdeveloper/resilience-cards`:
- **Branch:** `main`
- **Runtime:** Node (Render reads `.nvmrc` → 20.19.6)
- **Build command:** `npm install`
- **Start command:** `node bootstrap.js`
- **Instance type:** Free
- **Environment variables:**
  - `MONGODB_URI` = the Atlas string from step 1
  - `PINO_LOG_LEVEL` = `info`
  - leave `USE_MOCK_MODEL` **unset** (must be empty to use the real DB)
- Leave the health check path blank (Render uses port-open detection; the app has no `200` root route).

Click **Create Web Service** and wait for the first deploy.

## 3. Smoke-test the live URL

Render gives a base URL like `https://resilience-cards.onrender.com`. The free tier cold-starts (~50s) after inactivity — the first request may be slow.

```bash
B=https://<your-service>.onrender.com
# create
curl -s -X POST $B/creator-cards -H 'Content-Type: application/json' -d '{
  "title":"George Cooks","creator_reference":"crt_8f2k1m9x4p7w3q5z",
  "links":[{"title":"YouTube","url":"https://youtube.com/@georgecooks"}],
  "status":"published"}'
# retrieve (use the slug from the create response)
curl -s $B/creator-cards/george-cooks
# delete
curl -s -X DELETE $B/creator-cards/george-cooks -H 'Content-Type: application/json' \
  -d '{"creator_reference":"crt_8f2k1m9x4p7w3q5z"}'
```

Expect `200` with `id` (not `_id`), `access_code` omitted on GET, and the deleted card returned with a `deleted` timestamp.

## 4. Submit

Submit the **base URL only** (no path, no versioning) + the public repo link in the assessment Google form before **2026-06-24**.
