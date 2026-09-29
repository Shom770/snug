"""Weather for a place: the National Weather Service in the US, Open-Meteo everywhere else (or if NWS is down)."""

import asyncio
import logging
from datetime import datetime, timedelta

import httpx

from . import nws
from .models import Condition, HourWeather, Location, Weather

log = logging.getLogger('snug')

CURRENT = 'temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation,is_day'
HOURLY = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,cloud_cover,weather_code,precipitation,precipitation_probability'
LAYERS = 'cloud_cover_low,cloud_cover_mid,cloud_cover_high'

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


def intensity_from(code: int, precip_in_per_hr: float = 0) -> float:
    return round(max(INTENSITY_BY_CODE.get(code, 0), min(1, precip_in_per_hr / 0.4)), 2)


def _hour(time: str, code: int, temp: float, feels: float, humidity: float, wind: float, gust: float, clouds: float, precip: float, pop: float = 0,
          layers: tuple = (None, None, None)) -> HourWeather:
    return HourWeather(
        hour=int(time[11:13]), condition=condition_from_wmo(code, wind, feels, humidity), intensity=intensity_from(code, precip),
        temp=round(temp, 1), feels=round(feels, 1), humidity=humidity, wind=round(wind, 1), gust=round(gust, 1), clouds=clouds, precip=precip, pop=pop or 0, cloudLow=layers[0], cloudMid=layers[1], cloudHigh=layers[2],
    )


async def get_weather(client: httpx.AsyncClient, loc: Location) -> Weather:
    try:
        w = await nws.get_weather(client, loc)
    except nws.NwsUnavailable as e:
        log.info('nws unavailable for %s, using open-meteo: %s', loc.name, e)
        return await open_meteo(client, loc)
    # NWS gives only total cover; take the layers from Open-Meteo's model, and from the station's METAR for right now
    layers, now = await asyncio.gather(cloud_layers(client, loc.lat, loc.lon), nws.current_layers(client, loc))
    start = datetime.fromisoformat(w.time).replace(minute=0)
    for k, h in enumerate(w.hourly):
        l, m, hi = layers.get((start + timedelta(hours=k)).strftime('%Y-%m-%dT%H'), (None, None, None))
        h.cloudLow, h.cloudMid, h.cloudHigh = l, m, hi
    if now:
        w.hourly[0].cloudLow, w.hourly[0].cloudMid, w.hourly[0].cloudHigh = now
    w.cloudLow, w.cloudMid, w.cloudHigh = w.hourly[0].cloudLow, w.hourly[0].cloudMid, w.hourly[0].cloudHigh
    return w


async def open_meteo(client: httpx.AsyncClient, loc: Location) -> Weather:
    res = await client.get('https://api.open-meteo.com/v1/forecast', params={
        'latitude': loc.lat, 'longitude': loc.lon, 'current': CURRENT, 'hourly': HOURLY + ',' + LAYERS, 'daily': 'temperature_2m_max,temperature_2m_min',
        'temperature_unit': 'fahrenheit', 'wind_speed_unit': 'mph', 'precipitation_unit': 'inch', 'forecast_days': 2, 'timezone': 'auto',
    }, timeout=10)
    res.raise_for_status()
    r = res.json()
    c, h = r['current'], r['hourly']
    i0 = next((i for i, t in enumerate(h['time']) if t >= c['time'][:13]), 0)
    hourly = [
        _hour(h['time'][i], h['weather_code'][i], h['temperature_2m'][i], h['apparent_temperature'][i], h['relative_humidity_2m'][i],
              h['wind_speed_10m'][i], h['wind_gusts_10m'][i], h['cloud_cover'][i], h['precipitation'][i], h['precipitation_probability'][i],
              (h['cloud_cover_low'][i], h['cloud_cover_mid'][i], h['cloud_cover_high'][i]))
        for i in (min(i0 + k, len(h['time']) - 1) for k in range(12))
    ]
    # the first hourly slot is the top of the current hour; use the live reading for it
    now = _hour(c['time'], c['weather_code'], c['temperature_2m'], c['apparent_temperature'], c['relative_humidity_2m'],
                c['wind_speed_10m'], c['wind_gusts_10m'], c['cloud_cover'], c['precipitation'], 0,
                (c['cloud_cover_low'], c['cloud_cover_mid'], c['cloud_cover_high']))
    now = now.model_copy(update={'pop': hourly[0].pop})  # the live reading has no chance-of-rain; take the hour's
    hourly[0] = now
    temps = [x.temp for x in hourly]
    return Weather(
        **now.model_dump(), city=loc.name, lat=loc.lat, lon=loc.lon, time=c['time'], dir=c['wind_direction_10m'], night=c['is_day'] == 0,
        lo=round(min(r['daily']['temperature_2m_min'][0], *temps), 1), hi=round(max(r['daily']['temperature_2m_max'][0], *temps), 1),
        hourly=hourly, source='open-meteo',
    )


async def cloud_layers(client: httpx.AsyncClient, lat: float, lon: float) -> dict[str, tuple]:
    """Low/mid/high cloud cover by local hour ("YYYY-MM-DDTHH") from Open-Meteo, for sources that only give a total (NWS)."""
    try:
        res = await client.get('https://api.open-meteo.com/v1/forecast', params={
            'latitude': lat, 'longitude': lon, 'hourly': LAYERS, 'forecast_days': 2, 'timezone': 'auto'}, timeout=8)
        res.raise_for_status()
        h = res.json()['hourly']
        return {t[:13]: (h['cloud_cover_low'][i], h['cloud_cover_mid'][i], h['cloud_cover_high'][i]) for i, t in enumerate(h['time'])}
    except (httpx.HTTPError, KeyError, ValueError):
        return {}
