"""snug backend.

  GET  /health           -> {"ok": true, "model": ...}
  GET  /weather          -> weather for a place: NWS in the US, Open-Meteo elsewhere. ?lat=&lon=(&name=) or ?q=<place or postal code>;
                            nothing means Philadelphia, PA.
  POST /forecast         -> send that weather back; one Jev call returns the 12-hour comfort curve, outfit and descriptor,
                            personalized with the signed-in person's check-ins.
  GET  /auth/config      -> which sign-in methods are on
  POST /auth/google      -> sign in with a Google ID token          POST /auth/dev -> email-only sign-in (local dev)
  POST /auth/logout
  GET  /me, PUT /me/prefs, GET|POST /checkins
  GET  /places?q=        -> location suggestions for the place picker;  GET /places/reverse?lat=&lon= -> a name for coordinates
"""

from . import config  # noqa: F401  (loads .env first)

import logging
import os
from datetime import timedelta

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import account, auth, jev, tuning
from .db import Database, Row, get_db, utcnow
from .descriptors import band_of
from .forecast import forecast
from .location import Location, LocationNotFound, resolve, reverse, search
from .models import Forecast, Outfit, TodayCheckin, Weather
from .net import http
from .weather import get_weather

logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
log = logging.getLogger('snug')
logging.getLogger('httpx').setLevel(logging.WARNING)  # its request lines include query strings, e.g. access tokens


app = FastAPI(title='snug')
# the browser talks to us through the Next.js proxy (same origin); this only matters for direct calls in dev
app.add_middleware(CORSMiddleware, allow_origin_regex=r'http://(localhost|127\.0\.0\.1)(:\d+)?', allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(tuning.router)


@app.get('/health')
async def health():
    return {'ok': True, 'model': jev.model(), 'key_set': bool(os.environ.get('OPENROUTER_KEY'))}


@app.get('/weather', response_model=Weather)
async def weather(
    q: str | None = Query(None, description='place name or postal code, e.g. "Philadelphia, PA" or "19104"'),
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
    name: str | None = Query(None, description='display name for lat/lon'),
):
    if (lat is None) != (lon is None):
        raise HTTPException(422, 'pass both lat and lon')
    try:
        loc = await resolve(http(), q, lat, lon, name)
        return await get_weather(http(), loc)
    except LocationNotFound as e:
        raise HTTPException(404, str(e)) from e
    except httpx.HTTPError as e:
        log.exception('weather failed')
        raise HTTPException(502, f'weather unavailable: {e!r}') from e


@app.get('/places', response_model=list[Location])
async def places(q: str = Query(..., max_length=100)):
    try:
        return await search(http(), q)
    except httpx.HTTPError as e:
        raise HTTPException(502, f'place search unavailable: {e!r}') from e


@app.get('/places/reverse', response_model=Location)
async def places_reverse(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    return await reverse(http(), lat, lon)


async def _today_checkin(db: Database, user: Row | None, w: Weather) -> TodayCheckin | None:
    """Tonight's check-in at this place, so the page shows it as done until the place's date rolls over."""
    if not user:
        return None
    c = await db.first('SELECT felt, fit FROM checkins WHERE user_id = ? AND city = ? AND local_date = ?', user.id, w.city, w.time[:10])
    return TodayCheckin(felt=c.felt, fit=c.fit) if c else None


async def _cached_forecast(db: Database, user: Row, w: Weather) -> Forecast | None:
    """This hour's forecast for this person and place, unless they've checked in since (that changes the answer)."""
    row = await db.first('SELECT * FROM forecasts WHERE user_id = ? AND city = ? AND local_date = ? AND start_hour = ? AND created_at > ? '
                         'ORDER BY id DESC LIMIT 1', user.id, w.city, w.time[:10], w.hour, utcnow() - timedelta(hours=1))
    if not row:
        return None
    newer = await db.first('SELECT id FROM checkins WHERE user_id = ? AND updated_at > ? LIMIT 1', user.id, row.created_at)
    tuned = await db.first('SELECT id FROM tune_picks WHERE user_id = ? AND created_at > ? LIMIT 1', user.id, row.created_at)
    if newer or tuned:  # they told us something new since; ask again
        return None
    return Forecast(score=row.score, curve=row.curve, startHour=row.start_hour, label=row.label, band=band_of(row.score), factor=row.factor,
                    outfit=Outfit(**row.outfit), model=row.model, ms=0, forecastId=row.id, personalized=True, cached=True)


@app.post('/forecast', response_model=Forecast)
async def post_forecast(w: Weather, user: Row | None = Depends(auth.current_user), db: Database = Depends(get_db)):
    if user and (hit := await _cached_forecast(db, user, w)):
        hit.checkin = await _today_checkin(db, user, w)
        return hit
    history = await account.recent_checkins(db, user.id) if user else []
    prefs = account.prefs_of(await account.get_prefs(db, user.id)) if user else None
    picks = await tuning.recent_picks(db, user.id) if user else []
    try:
        f = await forecast(http(), w, history, prefs.tuning.model_dump() if prefs and prefs.tuning else None, tuning.section(picks))
    except jev.JevError as e:
        log.error('jev failed: %s', e)
        raise HTTPException(500 if e.status == 500 else 502, str(e)) from e
    row = await db.first('INSERT INTO forecasts (user_id, city, local_date, start_hour, score, label, factor, curve, outfit, weather, model, created_at) '
                         'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
                         user.id if user else None, w.city, w.time[:10], f.startHour, f.score, f.label, f.factor, f.curve, f.outfit.model_dump(),
                         {k: getattr(w, k) for k in ('condition', 'temp', 'feels', 'wind', 'gust', 'humidity', 'clouds', 'pop', 'lo', 'hi', 'hour')},
                         f.model, utcnow())
    f.forecastId = row.id
    f.checkin = await _today_checkin(db, user, w)
    log.info('jev %s · %s · %s %s · %dms%s', f.model, w.city, f.score, f.label, f.ms, f' · {len(history)} check-ins' if history else '')
    return f
