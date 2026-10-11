from typing import Literal

from pydantic import BaseModel, Field

Condition = Literal[
    'clear', 'partly', 'cloudy', 'overcast', 'fog', 'drizzle', 'rain', 'storm',
    'hail', 'sleet', 'snow', 'blizzard', 'windy', 'smoke', 'heat', 'humid',
]
Band = Literal['perfect', 'great', 'good', 'meh', 'rough', 'bad', 'awful']
Factor = Literal['none', 'cold', 'heat', 'humid', 'wind', 'wet', 'storm', 'snow', 'ice', 'fog', 'smoke', 'partly', 'mostly', 'gloom', 'dusk', 'night']


class Outfit(BaseModel):
    top: Literal['tank', 'tee', 'long', 'sweater']
    outer: Literal['none', 'light', 'hoodie', 'coat', 'rain']
    bottom: Literal['shorts', 'pants']
    acc: list[Literal['sunglasses', 'umbrella', 'beanie', 'scarf']]
    boots: bool = False  # rain boots: the ground is properly wet (not just a chance of a shower)


class HourWeather(BaseModel):
    """One forecast hour. °F, mph, %, inches."""
    hour: int = Field(ge=0, le=23)
    condition: Condition
    intensity: float = Field(ge=0, le=1)
    temp: float
    feels: float
    humidity: float
    wind: float
    gust: float
    clouds: float
    precip: float = 0
    pop: float = 0  # chance of precipitation, %
    # cloud cover by layer, % (null when unknown): low < ~6,500 ft, mid to ~20,000 ft, high above (thin cirrus)
    cloudLow: float | None = None
    cloudMid: float | None = None
    cloudHigh: float | None = None
    # % of the hour the sun was out (daylight only; null at night or unknown). Thin cloud lets it through
    sunshine: float | None = None


class Location(BaseModel):
    name: str  # display name, e.g. "Philadelphia, PA"
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    cc: str | None = None  # country code, e.g. "FR" (from the place search)


class Weather(HourWeather):
    """What GET /weather returns and POST /forecast takes. Same shape as the frontend's WeatherInput."""
    city: str
    lat: float
    lon: float
    time: str  # local ISO time of the reading, e.g. 2026-09-28T15:45
    lo: float
    hi: float
    dir: float  # degrees the wind comes from
    night: bool  # after civil dusk / before civil dawn (see sun.py)
    golden: bool = False  # the sun low on the horizon: sunset (or sunrise) light
    dark: bool = False  # the sun is down (after sunset, before sunrise); civil dusk (night) comes a little later
    day: bool = False  # a whole day's forecast from 8am (tomorrow's outfit), not right now
    hourly: list[HourWeather] = Field(min_length=1, max_length=12)  # starts with the current hour
    source: Literal['nws', 'open-meteo'] = 'open-meteo'


class Forecast(BaseModel):
    score: int  # comfort right now, 1-100
    curve: list[int]  # comfort for each of the next 12 hours, curve[0] == score
    startHour: int
    label: str
    band: Band
    factor: Factor
    outfit: Outfit
    model: str
    ms: int
    forecastId: int | None = None  # what a check-in refers back to
    personalized: bool = False  # the person's past check-ins were part of the question
    cached: bool = False  # reused this hour's forecast instead of asking Jev again
    checkin: 'TodayCheckin | None' = None  # tonight's check-in for this place, if they've done it


class TodayCheckin(BaseModel):
    felt: int
    fit: str | None


Forecast.model_rebuild()
