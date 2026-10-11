"""Packing for a trip: the days someone's away somewhere else, day by day, and what snug would wear on each.

Jev dresses snug for each day, the same questions it answers for today (how warmly, rain gear, bottoms, sunglasses),
a week of days to a call, all at once. Rain gear only ever goes in for real rain, whatever Jev says. If Jev can't be
reached, the days are dressed by the warmth bands it chooses between, read off each day's feels-like high and low.
Inside Open-Meteo's 16-day forecast it's the forecast; past that, the same days last year there, as a stand-in for
what it's usually like.
"""

import asyncio
import logging
import time
from datetime import date, timedelta

import httpx
from pydantic import BaseModel

from . import jev
from .forecast import BOTTOMS, WARMTH
from .models import Condition, Location, Outfit
from .weather import condition_from_wmo

DAILY = ('weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,'
         'precipitation_sum,snowfall_sum,wind_speed_10m_max,sunshine_duration,daylight_duration')
UNITS = {'temperature_unit': 'fahrenheit', 'wind_speed_unit': 'mph', 'precipitation_unit': 'inch', 'timezone': 'auto'}
FORECAST_DAYS = 16
MAX_DAYS = 14
# the warmth band's lower edge for each level of WARMTH (feels-like °F while out)
BANDS = [88, 74, 67, 61, 54, 48, 42, 30, 15, -999]
# a rain jacket and umbrella only for a day with a proper chance of rain and some actually falling, or a soaking
WET_POP, WET_IN, SOAKED_IN = 50, 0.05, 0.2
CHUNK = 7  # days per Jev call
log = logging.getLogger('snug')


class TripDay(BaseModel):
    date: str
    hi: float
    lo: float
    feelsHi: float
    feelsLo: float
    condition: Condition
    rain: float  # inches of rain (snow not counted)
    snow: float  # inches of snow
    pop: float  # chance of rain, %
    sun: float  # % of the daylight the sun was out
    wind: float = 0  # strongest wind, mph
    outfit: Outfit
    typical: bool  # past the forecast: last year's weather on that date, not a forecast


class Trip(BaseModel):
    place: str
    days: list[TripDay]


def outfit_for(feels_hi: float, feels_lo: float, rain: float, snow: float, pop: float, wind: float, sun: float) -> Outfit:
    """What snug wears on a day away, by how it feels while they're out (mostly the afternoon, some of the evening)."""
    feel = 0.65 * feels_hi + 0.35 * feels_lo
    _, top, layer = WARMTH[next(i for i, b in enumerate(BANDS) if feel >= b)]
    wet = rain >= SOAKED_IN or (pop >= WET_POP and rain >= WET_IN)
    if wet and layer != 'coat' and feel < 85:
        layer = 'rain'
    elif layer == 'layer':  # a hoodie on a dry, calm day; a jacket when it's windy or damp
        layer = 'hoodie' if pop < 30 and wind < 15 else 'light'
    acc = [k for k, on in (('sunglasses', sun >= 65), ('umbrella', wet and rain > snow), ('beanie', feel < 45), ('scarf', feel < 40)) if on]
    return Outfit(top=top, outer=layer, bottom='shorts' if feel >= 72 and feels_lo >= 60 else 'pants', acc=acc, boots=rain >= 0.4)


def _days(r: dict, want: set[str], typical: bool, shift: timedelta = timedelta(0)) -> dict[str, TripDay]:
    d, out = r['daily'], {}
    for i, t in enumerate(d['time']):
        day = str(date.fromisoformat(t) + shift)
        if day not in want or d['temperature_2m_max'][i] is None:
            continue
        snow, precip = d['snowfall_sum'][i] or 0, d['precipitation_sum'][i] or 0
        rain = max(0.0, precip - snow / 10)  # snowfall is depth; about a tenth of it is water
        # last year has no chance-of-rain: it either rained or it didn't
        pop = d['precipitation_probability_max'][i] if 'precipitation_probability_max' in d else (85 if rain >= 0.08 else 10)
        sun = 100 * (d['sunshine_duration'][i] or 0) / max(1, d['daylight_duration'][i] or 1)
        fh, fl, wind = d['apparent_temperature_max'][i], d['apparent_temperature_min'][i], d['wind_speed_10m_max'][i] or 0
        out[day] = TripDay(date=day, hi=round(d['temperature_2m_max'][i]), lo=round(d['temperature_2m_min'][i]), feelsHi=round(fh), feelsLo=round(fl),
                           condition=condition_from_wmo(d['weather_code'][i] or 0, wind, fh, 50), rain=round(rain, 2), snow=round(snow, 1), pop=pop or 0,
                           sun=round(sun), wind=round(wind), outfit=outfit_for(fh, fl, rain, snow, pop or 0, wind, sun), typical=typical)
    return out


def _state(place: str, days: list[TripDay]) -> str:
    rows = '\n'.join(f"{d.date} {date.fromisoformat(d.date):%a}{' (last year, as a guide)' if d.typical else ''} {d.condition} {round(d.hi)} {round(d.lo)} "
                     f"{round(d.feelsHi)} {round(d.feelsLo)} {round(d.pop)} {d.rain:g} {d.snow:g} {round(d.wind)} {round(d.sun)}" for d in days)
    return (f'A trip to {place}: what to wear each day, out and about from morning to evening.\n'
            f'date day sky high°F low°F feels_high°F feels_low°F rain_chance% rain_in snow_in wind_mph sunny%\n{rows}')


async def _dress(client: httpx.AsyncClient, place: str, days: list[TripDay]) -> None:
    """Jev's outfit for each of these days, in place (one call)."""
    qs: dict[str, dict] = {}
    for i, d in enumerate(days):
        on = f'{date.fromisoformat(d.date):%A %b %-d}'
        qs[f'w{i}'] = jev.score_q(f'How warmly should they dress on {on}, for the hours they are out?', [lv for lv, _, _ in WARMTH])
        qs[f'r{i}'] = jev.noul_q(f'Will they want a rain jacket and umbrella on {on}?', "yes, rain is likely while they're out", 'no, it stays dry, or only a passing drop')
        qs[f'b{i}'] = jev.choice_q(f'Bottoms on {on}', BOTTOMS)
        qs[f's{i}'] = jev.noul_q(f'Will they want sunglasses on {on}?', "yes, it's sunny and bright", 'no, not much sun')
    _, a = await jev.decide(client, _state(place, days), qs)
    for i, d in enumerate(days):
        level = max(0, min(len(WARMTH) - 1, round(jev.score(a.get(f'w{i}')))))
        _, top, layer = WARMTH[level]
        wet = d.rain >= SOAKED_IN or (d.pop >= WET_POP and d.rain >= WET_IN and jev.yes(a.get(f'r{i}')))
        if wet and layer != 'coat':
            layer = 'rain'
        elif layer == 'layer':
            layer = 'hoodie' if d.pop < 30 and d.wind < 15 else 'light'
        acc = [k for k, on in (('sunglasses', jev.yes(a.get(f's{i}')) and d.sun >= 40), ('umbrella', wet and d.rain > d.snow / 10),
                               ('beanie', level >= 7), ('scarf', level >= 7)) if on]
        d.outfit = Outfit(top=top, outer=layer, bottom=jev.choice(a.get(f'b{i}'), BOTTOMS, d.outfit.bottom), acc=acc, boots=d.rain >= 0.4)


_cache: dict[tuple, tuple[float, Trip]] = {}


async def trip(client: httpx.AsyncClient, loc: Location, start: date, end: date) -> Trip:
    """Each day from start to end (inclusive) at loc. Raises ValueError for a bad range."""
    if end < start or (end - start).days >= MAX_DAYS:
        raise ValueError(f'a trip is 1 to {MAX_DAYS} days')
    key = (round(loc.lat, 2), round(loc.lon, 2), start, end)
    if (hit := _cache.get(key)) and time.time() - hit[0] < 3 * 3600:
        return hit[1]
    want = {str(start + timedelta(days=i)) for i in range((end - start).days + 1)}
    got: dict[str, TripDay] = {}
    last = date.today() + timedelta(days=FORECAST_DAYS - 2)  # the forecast's last whole day, give or take the time zone
    if start <= last:
        res = await client.get('https://api.open-meteo.com/v1/forecast', params={
            'latitude': loc.lat, 'longitude': loc.lon, 'daily': DAILY + ',precipitation_probability_max', 'forecast_days': FORECAST_DAYS, **UNITS}, timeout=10)
        res.raise_for_status()
        got |= _days(res.json(), want, False)
    if missing := sorted(want - got.keys()):
        # 364 days back: the same weekday, and never a Feb 29 that isn't there
        ago = timedelta(days=364)
        res = await client.get('https://archive-api.open-meteo.com/v1/archive', params={
            'latitude': loc.lat, 'longitude': loc.lon, 'daily': DAILY, **UNITS,
            'start_date': str(date.fromisoformat(missing[0]) - ago), 'end_date': str(date.fromisoformat(missing[-1]) - ago)}, timeout=15)
        res.raise_for_status()
        got |= _days(res.json(), set(missing), True, ago)
    t = Trip(place=loc.name, days=[got[d] for d in sorted(want) if d in got])
    try:
        await asyncio.gather(*(_dress(client, loc.name, t.days[i:i + CHUNK]) for i in range(0, len(t.days), CHUNK)))
    except (jev.JevError, httpx.HTTPError) as e:  # the warmth bands' outfits stand
        log.error('jev failed for a trip: %s', e)
    _cache[key] = (time.time(), t)
    return t
