# snug

know how today will feel before you step outside.

```
frontend/   Next.js app (the scene, snug, the loading world)
backend/    FastAPI: weather + Jev (OpenRouter) decide comfort, outfit and descriptor; SQLite locally, Cloudflare D1 in production
.env        OPENROUTER_KEY=...           Jev via OpenRouter
            GOOGLE_CLIENT_ID=...         Google sign-in (OAuth client id, "Web application" type). Until it's set, sign-in is email-only for local dev.
            optional: JEV_MODEL (default ~typesafe/jev-latest), NWS_USER_AGENT (a contact string NWS asks clients to send),
                      SNUG_ENV=production (turns off dev sign-in, secure cookies)
```

## run it

Needs Node 20+ and [uv](https://docs.astral.sh/uv/) (Python 3.11+).

```bash
npm install     # installs root, frontend/ and backend/ (npm + uv sync)
npm run dev     # starts both: api on :8787, web on :3000
```

The frontend proxies `/backend/*` to the API (`BACKEND_URL` overrides `http://127.0.0.1:8787`).

## deploy (Cloudflare)

One Worker serves everything: the Next.js site as static files (Workers Assets) and the FastAPI backend as a
Python Worker on `/backend/*`, with Cloudflare D1 as the database. Same origin, so the session cookie just works.

Needs **Node 22+** for wrangler (`brew install node@22`) and a Cloudflare account (the free plan is enough).

```bash
cd backend
npx wrangler login
npx wrangler d1 create snug        # paste the database_id it prints into backend/wrangler.jsonc
npm run db:migrate                 # create the tables in D1
npm run secrets                    # OPENROUTER_KEY, GOOGLE_CLIENT_ID, NWS_USER_AGENT from the root .env
npm run db:import                  # optional: copy people, preferences, tune picks and check-ins from snug.db
cd ..
npm run deploy                     # static export of frontend/ + pywrangler deploy
```

Then add the site's URL (e.g. `https://snug.<you>.workers.dev`, or your custom domain) to **Authorized JavaScript
origins** on the Google OAuth client, or the Google button won't open.

`npm --prefix backend run preview` runs the production build locally on Cloudflare's runtime (with a local D1:
run `npm --prefix backend run db:migrate:local` once first, after `npm run build`).

**Deploying from Git** (Cloudflare Workers Builds): root directory `/`, build command `npm run build`,
deploy command `npx wrangler deploy` (the default; the build leaves a config redirect pointing it at `backend/`). Commit `backend/wrangler.jsonc` with your real `database_id`.

## flow

1. **Sign in.** The welcome sign has Google's "Continue with Google" button once `GOOGLE_CLIENT_ID` is set (until then, an email-only dev sign-in). New people then pick **where they are** (type a city, town or postal code and choose a suggestion, or "use my location") and answer the 8 **"which day feels better"** cards, which boil down to an ideal temperature and how much wind and grey skies bother them. Returning people go straight to their forecast. In the app, the 📍 sign top-left changes the place or signs out.
2. `GET /backend/weather` fetches the forecast for the current hour plus the next 11. In the US it uses the National Weather Service gridpoint forecast (hourly sky cover, chance of rain, temps, wind, gusts). Elsewhere, or if NWS is down, it uses Open-Meteo.
3. `POST /backend/forecast` sends that weather to Jev in one Decisions API call and gets back the 12-hour comfort curve, the outfit and the day's word.
4. While that runs, snug potters about under "loading…": flies a kite, blows a dandelion, naps, meets a pigeon, gets a butterfly on his head, catches raindrops or snowflakes, watches a shooting star at night. The order is shuffled each visit, and sometimes a UFO or a little dance shows up. `?bit=ufo` (or `kite`, `pigeon`, `nap`, `dandelion`, `butterfly`, `dance`, `skycheck`, `puddle`, `snowflake`, `stars`) plays that one first. The loading screen stays up for at least 3.6s.
5. Then snug walks back and gets dressed in a poof. The hills grow into the comfort curve, the score climbs with them, and the signs and weather station rise into place.

## backend api

| | |
|---|---|
| `GET /health` | `{ ok, model, key_set }` |
| `GET /weather` | NWS in the US, Open-Meteo elsewhere (`source` says which). `?lat=&lon=(&name=)` or `?q=` with a place or postal code (`Philadelphia, PA`, `Portland, OR`, `19104`, `Tokyo`). No params = Philadelphia. 404 if the place isn't found. |
| `POST /forecast` | body = the `/weather` response. Returns `{ score, curve[12], startHour, label, band, factor, outfit, model, ms, forecastId, personalized }`. Every forecast is stored; with a session, the person's last 6 check-ins go into the Jev call. |
| `POST /checkins` | `{ forecast_id, felt: 1-100, fit?: "too cold" \| "just right" \| "too warm" }`. One per person, place and day; saving again edits it. `GET /checkins` lists them. |
| `GET /me`, `PUT /me/prefs` | the session's user and preferences: `place {name, lat, lon}`, `units`, `onboarded`, `tuning {ideal, windAvoid, cloudAvoid}` |
| `GET /places?q=` | location suggestions for the place picker (Open-Meteo geocoding; cities, towns, postal codes; "portland, me" narrows by state or country) |
| `GET /places/reverse?lat=&lon=` | a name for "use my location": NWS in the US, OpenStreetMap elsewhere |
| `GET /auth/config` | `{ google_client_id, dev_login }`, what the welcome screen offers |
| `POST /auth/google` | `{ credential }` (an ID token) or `{ access_token }` (our wooden button). Verified with Google (signature, expiry, audience = our client id, verified email), then a session starts |
| `POST /auth/dev` | `{ email }`, email-only sign-in. Only while Google isn't configured and `SNUG_ENV` isn't `production` |
| `POST /auth/logout` | ends the session |

### database

`backend/src/app/db.py`: plain SQL on SQLite. Locally that's `backend/snug.db` (gitignored); on Cloudflare it's the D1 database bound as `DB`. The schema lives in `backend/migrations/` (a fresh local file gets it automatically; D1 gets it with `npm --prefix backend run db:migrate`). A schema change is a new numbered migration file.

| table | what |
|---|---|
| `users` | email, name, picture, Google subject id |
| `sessions` | sha256 of the session cookie, expiry (30 days) |
| `preferences` | place (name, lat, lon), units, onboarded, tuning |
| `forecasts` | every forecast served: city, local date, score, curve, label, outfit, a weather snapshot |
| `checkins` | how the day felt (1-100) and how the outfit worked, pointing at the forecast they saw |

### check-ins → future forecasts

Onboarding's tuning adds one line to the Jev state ("they're happiest around 64°F; wind bothers them more than most"). With check-ins on file, the state also gets a small table of the last 6 (date, sky, feels, wind, humidity, our forecast, how it felt, outfit, fit) and a one-line nudge, e.g. "rate comfort about 12 higher for them; they ran warm in their outfit 2 of 3 times, so dress them lighter". About 20 extra input tokens per check-in. Spelling out the direction matters: from the table alone, Jev sometimes read "too warm" as "worse".

### how Jev is asked

Jev returns typed decisions, not text. It's served on OpenRouter's Decisions API (`POST https://openrouter.ai/api/alpha/decisions`), not the chat endpoint. Everything goes in **one call** to keep input tokens down (~2.4k in, about $0.0001 per forecast):

- **state**: a compact table: place, date, low/high, then one row per hour (sky, temp, feels, humidity, wind, gust, cloud %, chance of rain %, precip).
- 12 `score` questions (one per hour) on a 10-level scale from `dangerous` to `perfect`. The expected level becomes 1-100. `curve[0]` is the headline score.
- `choice`: top (tank/tee/long/sweater), outer (none/light/hoodie/coat/rain), bottom (shorts/pants).
- `noul`: sunglasses, umbrella, beanie, scarf (kept at ≥ 0.5). Each one spells out what yes and no mean ("yes, rain is likely" / "no, rain is unlikely"). A bare "bring an umbrella?" comes back as a coin flip around 0.5.
- `choice`: which factor stands out (cold, heat, humid, wind, wet, storm, snow, ice, fog, smoke, gloom, none). The word comes from that factor's cell in the descriptor table for the score's band, picked by date (`backend/src/app/descriptors.py`).
