"""National Weather Service forecast (api.weather.gov) -> snug's weather shape. US only, no key.

points/{lat},{lon} gives the forecast grid for a place; the raw gridpoint data has hourly sky cover, chance of
precipitation, temps, wind and gusts, which is what we need (the text forecasts round all of that away).
"""

import math
import os
import re
import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx

from .models import Condition, HourWeather, Location, Weather


class NwsUnavailable(Exception):
    """Outside NWS coverage or the service is down; the caller falls back to Open-Meteo."""


def _headers() -> dict:
    # NWS asks every client to identify itself; set NWS_USER_AGENT to include a contact
    return {'User-Agent': os.environ.get('NWS_USER_AGENT') or 'snug-dev (local)', 'Accept': 'application/geo+json'}


_points: dict[tuple[float, float], dict] = {}  # grid lookups never change
_grids: dict[str, tuple[float, dict]] = {}  # gridpoint data, refreshed every 10 minutes
GRID_TTL = 600

C_TO_F = lambda c: c * 9 / 5 + 32  # noqa: E731
KMH_TO_MPH = 0.621371

# precip that is actually expected, not just possible
LIKELY = {'likely', 'definite', 'numerous', 'widespread', 'occasional', 'periods', 'frequent'}
INTENSITY = {'very_light': 0.15, 'light': 0.3, 'moderate': 0.55, 'heavy': 0.85}
PRECIP: dict[str, Condition] = {
    'rain': 'rain', 'rain_showers': 'rain', 'drizzle': 'drizzle', 'thunderstorms': 'storm', 'hail': 'hail',
    'snow': 'snow', 'snow_showers': 'snow', 'blowing_snow': 'snow', 'sleet': 'sleet', 'ice_pellets': 'sleet',
    'freezing_rain': 'sleet', 'freezing_drizzle': 'sleet',
}
OBSCURED: dict[str, Condition] = {'fog': 'fog', 'freezing_fog': 'fog', 'smoke': 'smoke', 'haze': 'smoke', 'dust': 'smoke'}


async def _get(client: httpx.AsyncClient, url: str) -> dict:
    try:
        res = await client.get(url, headers=_headers(), timeout=10)
    except httpx.HTTPError as e:
        raise NwsUnavailable(f'nws unreachable: {e!r}') from e
    if res.status_code != 200:
        raise NwsUnavailable(f'nws {res.status_code} for {url}: {res.text[:160]}')
    return res.json()['properties']


def _duration(s: str) -> timedelta:
    m = re.fullmatch(r'P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?', s)
    if not m:
        raise NwsUnavailable(f'bad duration {s!r}')
    return timedelta(days=int(m[1] or 0), hours=int(m[2] or 0), minutes=int(m[3] or 0))


def _series(grid: dict, key: str) -> list[tuple[datetime, datetime, object]]:
    out = []
    for v in grid.get(key, {}).get('values', []):
        start, dur = v['validTime'].split('/')
        s = datetime.fromisoformat(start)
        out.append((s, s + _duration(dur), v['value']))
    return out


def _at(series: list, t: datetime, default=None):
    return next((v for s, e, v in series if s <= t < e and v is not None), default)


def _is_day(lat: float, lon: float, t: datetime) -> bool:
    """Sun above the horizon (NOAA solar position approximation)."""
    u = t.astimezone(timezone.utc)
    g = 2 * math.pi / 365 * (u.timetuple().tm_yday - 1 + (u.hour - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    ha = math.radians((u.hour * 60 + u.minute + eqt + 4 * lon) / 4 - 180)
    la = math.radians(lat)
    cos_zen = math.sin(la) * math.sin(decl) + math.cos(la) * math.cos(decl) * math.cos(ha)
    return 90 - math.degrees(math.acos(max(-1, min(1, cos_zen)))) > -0.833


def _sky(cover: float) -> Condition:
    # NWS sky categories: mostly clear <= 25%, partly cloudy <= 62%, mostly cloudy <= 87%, cloudy above
    return 'clear' if cover <= 25 else 'partly' if cover <= 62 else 'cloudy' if cover <= 87 else 'overcast'


async def get_weather(client: httpx.AsyncClient, loc: Location) -> Weather:
    key = (round(loc.lat, 4), round(loc.lon, 4))
    if key not in _points:
        _points[key] = await _get(client, f'https://api.weather.gov/points/{key[0]},{key[1]}')
    pt = _points[key]
    url = pt['forecastGridData']
    cached = _grids.get(url)
    if not cached or time.monotonic() - cached[0] > GRID_TTL:
        cached = (time.monotonic(), await _get(client, url))
        _grids[url] = cached
    grid = cached[1]

    S = {k: _series(grid, k) for k in ('temperature', 'apparentTemperature', 'relativeHumidity', 'skyCover', 'windSpeed', 'windGust',
                                       'windDirection', 'probabilityOfPrecipitation', 'quantitativePrecipitation', 'weather',
                                       'maxTemperature', 'minTemperature')}
    tz = ZoneInfo(pt['timeZone'])
    now = datetime.now(tz)
    start = now.replace(minute=0, second=0, microsecond=0)

    def hour(t: datetime) -> HourWeather:
        temp = _at(S['temperature'], t)
        if temp is None:
            raise NwsUnavailable(f'no nws forecast for {t.isoformat()}')
        feels = _at(S['apparentTemperature'], t, temp)
        wind = _at(S['windSpeed'], t, 0) * KMH_TO_MPH
        gust = max(wind, _at(S['windGust'], t, 0) * KMH_TO_MPH)
        cover = _at(S['skyCover'], t, 50)
        pop = _at(S['probabilityOfPrecipitation'], t, 0)
        humidity = _at(S['relativeHumidity'], t, 50)
        qpf_in = next(((v or 0) / 25.4 / max(1, (e - s).total_seconds() / 3600) for s, e, v in S['quantitativePrecipitation'] if s <= t < e), 0)
        # what the sky is doing: expected precip first, then fog/smoke, then wind/heat, then cloud cover
        cond: Condition | None = None
        intensity = 0.0
        for w in _at(S['weather'], t, []) or []:
            kind, cov = w.get('weather'), w.get('coverage')
            # a 'chance' of storms isn't a stormy hour; the chance itself goes to Jev as rain_chance%
            if kind in PRECIP and (cov in LIKELY or pop >= 60 or qpf_in >= 0.02):
                c = PRECIP[kind]
                if c == 'snow' and wind >= 25 and w.get('intensity') == 'heavy':
                    c = 'blizzard'
                cond = cond if cond == 'storm' else c
                intensity = max(intensity, INTENSITY.get(w.get('intensity') or '', 0.4), min(1, qpf_in / 0.4))
            elif kind in OBSCURED and cond is None and cov not in ('slight_chance', 'chance'):
                cond = OBSCURED[kind]
        if cond is None:
            cond = 'windy' if wind >= 22 else ('humid' if humidity >= 60 else 'heat') if C_TO_F(feels) >= 90 else _sky(cover)
        return HourWeather(
            hour=t.hour, condition=cond, intensity=round(intensity, 2), temp=round(C_TO_F(temp), 1), feels=round(C_TO_F(feels), 1),
            humidity=humidity, wind=round(wind, 1), gust=round(gust, 1), clouds=cover, precip=round(qpf_in, 3), pop=pop,
        )

    hourly = [hour(start + timedelta(hours=k)) for k in range(12)]
    now_h = hourly[0]
    temps = [h.temp for h in hourly]
    hi, lo = _at(S['maxTemperature'], now), _at(S['minTemperature'], now)
    return Weather(
        **now_h.model_dump(), city=loc.name, lat=loc.lat, lon=loc.lon, time=now.strftime('%Y-%m-%dT%H:%M'),
        dir=_at(S['windDirection'], start, 0), night=not _is_day(loc.lat, loc.lon, now),
        lo=round(min(temps + ([C_TO_F(lo)] if lo is not None else [])), 1), hi=round(max(temps + ([C_TO_F(hi)] if hi is not None else [])), 1),
        hourly=hourly, source='nws',
    )


# METAR layer amounts -> % of sky, and the heights (m) that split low / mid / high clouds
OKTAS = {'FEW': 20, 'SCT': 45, 'BKN': 75, 'OVC': 100, 'VV': 100, 'CLR': 0, 'SKC': 0, 'NCD': 0, 'NSC': 0}
LOW_TOP, MID_TOP = 2000, 6000
_stations: dict[tuple[float, float], str | None] = {}


async def current_layers(client: httpx.AsyncClient, loc: Location) -> tuple | None:
    """Low/mid/high cover right now from the nearest station's latest METAR, if it reported in the last 90 minutes."""
    key = (round(loc.lat, 4), round(loc.lon, 4))
    try:
        if key not in _stations:
            pt = _points.get(key) or await _get(client, f'https://api.weather.gov/points/{key[0]},{key[1]}')
            res = await client.get(pt['observationStations'], headers=_headers(), params={'limit': 1}, timeout=8)
            feats = res.json().get('features') or [] if res.status_code == 200 else []
            _stations[key] = feats[0]['properties']['stationIdentifier'] if feats else None
        station = _stations[key]
        if not station:
            return None
        obs = await _get(client, f'https://api.weather.gov/stations/{station}/observations/latest')
    except (NwsUnavailable, httpx.HTTPError, KeyError, ValueError):
        return None
    if datetime.now(timezone.utc) - datetime.fromisoformat(obs['timestamp']) > timedelta(minutes=90):
        return None
    layers = obs.get('cloudLayers') or []
    if not layers:
        return None
    low = mid = high = 0.0
    for c in layers:
        pct, base = OKTAS.get(c.get('amount'), 0), (c.get('base') or {}).get('value')
        if base is None or base < LOW_TOP:
            low = max(low, pct)
        elif base < MID_TOP:
            mid = max(mid, pct)
        else:
            high = max(high, pct)
    return (low, mid, high)
