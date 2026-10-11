"""Weather for a place: the National Weather Service in the US, Open-Meteo everywhere else (or if NWS is down)."""

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone

import httpx

from . import nws, sun
from .models import Condition, HourWeather, Location, Weather

log = logging.getLogger('snug')

CURRENT = 'temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation,is_day'
HOURLY = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,cloud_cover,weather_code,precipitation,precipitation_probability'
LAYERS = 'cloud_cover_low,cloud_cover_mid,cloud_cover_high,sunshine_duration,is_day'
SKY = ('clear', 'partly', 'cloudy', 'overcast')
DAY_START = 8  # a whole day's forecast (for tomorrow's outfit) runs from 8am, 12 hours
CIRRUS = 0.4  # how much the cloud the sun shines through counts toward how cloudy the sky is called

INTENSITY_BY_CODE = {51: 0.2, 53: 0.4, 55: 0.6, 61: 0.3, 63: 0.55, 65: 0.85, 80: 0.4, 81: 0.6, 82: 0.9, 71: 0.3, 73: 0.55, 75: 0.85, 77: 0.25,
                     85: 0.5, 86: 0.9, 66: 0.4, 67: 0.8, 56: 0.3, 57: 0.6, 95: 0.7, 96: 0.8, 99: 0.95}


def condition_from_wmo(code: int, wind: float = 0, feels: float = 60, humidity: float = 50) -> Condition:
    if code in (95, 96, 99):
        return 'storm' if code == 95 else 'hail'
    if code in (71, 73, 75, 77, 85, 86):
        return 'blizzard' if code in (75, 86) and wind >= 25 else 'snow'
    if code in (56, 57, 66, 67):
        return 'sleet'
    if code in (51, 53, 55):
        return 'drizzle'
    if code in (61, 63, 65, 80, 81, 82):
        return 'rain'
    if code in (45, 48):
        return 'fog'
    if wind >= 22:
        return 'windy'
    if feels >= 90:
        return 'humid' if humidity >= 60 else 'heat'
    return {3: 'overcast', 2: 'cloudy', 1: 'partly'}.get(code, 'clear')


def sun_cover(h: HourWeather) -> float:
    """% of the sky hiding the sun: low and mid cloud (thin high cirrus lets it through), never more than the total, and
    in daylight no more than the share of the hour the sun was blocked (models often call a thin veil 100% cloud)."""
    # layers that are all empty under a cloudy total are missing (another source's total), not clear: go by the total
    missing = h.cloudLow is None or h.cloudMid is None or (h.cloudLow + h.cloudMid + (h.cloudHigh or 0) == 0 and h.clouds >= 20)
    cover = h.clouds if missing else min(h.clouds, 100 * (1 - (1 - h.cloudLow / 100) * (1 - h.cloudMid / 100)))
    return cover if h.sunshine is None else min(cover, 100 - h.sunshine)


def sky_by_sun(h: HourWeather) -> None:
    """Name the sky by the cloud that hides the sun; thin cloud with the sun through it counts for a little."""
    if h.condition in SKY:
        cover = sun_cover(h)
        h.condition = nws.sky(cover + CIRRUS * (h.clouds - cover))


def _layers(h: dict, i: int) -> tuple:
    """(low, mid, high, sunshine %) for hour i of an Open-Meteo hourly block."""
    return (h['cloud_cover_low'][i], h['cloud_cover_mid'][i], h['cloud_cover_high'][i],
            round(h['sunshine_duration'][i] / 36) if h['is_day'][i] and h['sunshine_duration'][i] is not None else None)


def intensity_from(code: int, precip_in_per_hr: float = 0) -> float:
    return round(max(INTENSITY_BY_CODE.get(code, 0), min(1, precip_in_per_hr / 0.4)), 2)


def _hour(time: str, code: int, temp: float, feels: float, humidity: float, wind: float, gust: float, clouds: float, precip: float, pop: float = 0,
          layers: tuple = (None, None, None, None)) -> HourWeather:
    h = HourWeather(
        hour=int(time[11:13]), condition=condition_from_wmo(code, wind, feels, humidity), intensity=intensity_from(code, precip),
        temp=round(temp, 1), feels=round(feels, 1), humidity=humidity, wind=round(wind, 1), gust=round(gust, 1), clouds=clouds, precip=precip, pop=pop or 0,
        cloudLow=layers[0], cloudMid=layers[1], cloudHigh=layers[2], sunshine=layers[3],
    )
    sky_by_sun(h)
    return h


async def _nothing() -> None:
    return None


async def get_weather(client: httpx.AsyncClient, loc: Location, day: date | None = None) -> Weather:
    """Right now and the next 11 hours, or with `day` that local date from DAY_START (raises ValueError past the forecast)."""
    try:
        w = await nws.get_weather(client, loc, day, DAY_START)
    except nws.NwsUnavailable as e:
        log.info('nws unavailable for %s, using open-meteo: %s', loc.name, e)
        return await open_meteo(client, loc, day)
    # NWS gives only total cover; take the layers and sunshine from Open-Meteo's model, and the layers from the
    # station's METAR for right now
    layers, now = await asyncio.gather(cloud_layers(client, loc.lat, loc.lon), nws.current_layers(client, loc) if day is None else _nothing())
    start = datetime.fromisoformat(w.time).replace(minute=0)
    for k, h in enumerate(w.hourly):
        h.cloudLow, h.cloudMid, h.cloudHigh, h.sunshine = layers.get((start + timedelta(hours=k)).strftime('%Y-%m-%dT%H'), (None, None, None, None))
    if now:
        w.hourly[0].cloudLow, w.hourly[0].cloudMid, w.hourly[0].cloudHigh = now
    for h in w.hourly:
        sky_by_sun(h)
    h0 = w.hourly[0]
    w.condition, w.cloudLow, w.cloudMid, w.cloudHigh, w.sunshine = h0.condition, h0.cloudLow, h0.cloudMid, h0.cloudHigh, h0.sunshine
    return w


async def open_meteo(client: httpx.AsyncClient, loc: Location, day: date | None = None) -> Weather:
    res = await client.get('https://api.open-meteo.com/v1/forecast', params={
        'latitude': loc.lat, 'longitude': loc.lon, 'current': CURRENT, 'hourly': HOURLY + ',' + LAYERS, 'daily': 'temperature_2m_max,temperature_2m_min',
        'temperature_unit': 'fahrenheit', 'wind_speed_unit': 'mph', 'precipitation_unit': 'inch', 'forecast_days': 3, 'timezone': 'auto',
    }, timeout=10)
    res.raise_for_status()
    r = res.json()
    c, h = r['current'], r['hourly']
    # the current hour at the place by its clock; the 'current' reading is on a 15-minute step and can still be
    # from the previous hour just after it turns
    local_now = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=r.get('utc_offset_seconds', 0))
    hour_now = max(local_now.strftime('%Y-%m-%dT%H'), c['time'][:13])
    if day is not None:
        return _om_day(r, loc, day)
    i0 = next((i for i, t in enumerate(h['time']) if t >= hour_now), 0)
    hourly = [
        _hour(h['time'][i], h['weather_code'][i], h['temperature_2m'][i], h['apparent_temperature'][i], h['relative_humidity_2m'][i],
              h['wind_speed_10m'][i], h['wind_gusts_10m'][i], h['cloud_cover'][i], h['precipitation'][i], h['precipitation_probability'][i],
              _layers(h, i))
        for i in (min(i0 + k, len(h['time']) - 1) for k in range(12))
    ]
    # the first hourly slot is the top of the current hour; use the live reading for it
    now = _hour(c['time'], c['weather_code'], c['temperature_2m'], c['apparent_temperature'], c['relative_humidity_2m'],
                c['wind_speed_10m'], c['wind_gusts_10m'], c['cloud_cover'], c['precipitation'], 0,
                (c['cloud_cover_low'], c['cloud_cover_mid'], c['cloud_cover_high'], hourly[0].sunshine))
    # the live reading has no chance-of-rain (take the hour's), and its hour label may lag behind the clock
    now = now.model_copy(update={'pop': hourly[0].pop, 'hour': hourly[0].hour})
    hourly[0] = now
    temps = [x.temp for x in hourly]
    return Weather(
        **now.model_dump(), city=loc.name, lat=loc.lat, lon=loc.lon, time=max(c['time'], hour_now + ':00'), dir=c['wind_direction_10m'], **dict(zip(('night', 'golden'), sun.phase(loc.lat, loc.lon))), dark=sun.down(loc.lat, loc.lon),
        lo=round(min(r['daily']['temperature_2m_min'][0], *temps), 1), hi=round(max(r['daily']['temperature_2m_max'][0], *temps), 1),
        hourly=hourly, source='open-meteo',
    )


def _om_day(r: dict, loc: Location, day: date) -> Weather:
    """One local date from DAY_START, out of an Open-Meteo response."""
    h, d = r['hourly'], r['daily']
    i0, di = h['time'].index(f'{day}T{DAY_START:02d}:00'), d['time'].index(str(day))
    hourly = [
        _hour(h['time'][i], h['weather_code'][i], h['temperature_2m'][i], h['apparent_temperature'][i], h['relative_humidity_2m'][i],
              h['wind_speed_10m'][i], h['wind_gusts_10m'][i], h['cloud_cover'][i], h['precipitation'][i], h['precipitation_probability'][i],
              _layers(h, i))
        for i in (min(i0 + k, len(h['time']) - 1) for k in range(12))
    ]
    temps = [x.temp for x in hourly]
    return Weather(
        **hourly[0].model_dump(), city=loc.name, lat=loc.lat, lon=loc.lon, time=f'{day}T{DAY_START:02d}:00', dir=r['current']['wind_direction_10m'],
        night=False, day=True, lo=round(min(d['temperature_2m_min'][di], *temps), 1), hi=round(max(d['temperature_2m_max'][di], *temps), 1),
        hourly=hourly, source='open-meteo',
    )


async def cloud_layers(client: httpx.AsyncClient, lat: float, lon: float) -> dict[str, tuple]:
    """Low/mid/high cloud cover and sunshine by local hour ("YYYY-MM-DDTHH") from Open-Meteo, for sources that only give a
    total (NWS)."""
    try:
        res = await client.get('https://api.open-meteo.com/v1/forecast', params={
            'latitude': lat, 'longitude': lon, 'hourly': LAYERS, 'forecast_days': 3, 'timezone': 'auto'}, timeout=8)
        res.raise_for_status()
        h = res.json()['hourly']
        return {t[:13]: _layers(h, i) for i, t in enumerate(h['time'])}
    except (httpx.HTTPError, KeyError, ValueError):
        return {}
