"""The signed-in person: who they are, their preferences, and their evening check-ins."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, StringConstraints
from .auth import UserOut, current_user, require_user
from .db import Database, Row, get_db, placeholders, utcnow

router = APIRouter(tags=['account'])

Fit = Literal['too cold', 'just right', 'too warm']


class Place(BaseModel):
    name: str = Field(max_length=200)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Tuning(BaseModel):
    """From the onboarding "which day feels better" picks."""
    ideal: float  # °F they gravitate to
    windAvoid: float  # mph less wind in the days they picked (negative: they like wind)
    cloudAvoid: float  # % less cloud in the days they picked


class Piece(BaseModel):
    """One piece snug owns: a closet item (id) or, from before the closet, a style's version of it (s), in an optional
    colour. Names come from the frontend's catalog (lib/closet.ts)."""
    id: str | None = Field(None, max_length=32)
    s: str | None = Field(None, max_length=16)
    c: str | None = Field(None, max_length=16)


class Avatar(BaseModel):
    """How snug looks. Validated loosely; the frontend falls back to defaults for anything it doesn't know."""
    skin: str = Field('light', max_length=16)
    body: Literal['boy', 'girl'] = 'boy'
    hair: str = Field('short', max_length=16)
    hairColor: str = Field('darkbrown', max_length=16)
    style: str = Field('casual', max_length=16)  # the overall look, for any kind of piece not picked at the shop
    skirt: bool = False
    # kind -> the pieces snug owns of it (snug rotates through them day to day); a single piece from before still loads
    wardrobe: dict[Annotated[str, StringConstraints(max_length=16)], Annotated[list[Piece], Field(max_length=12)] | Piece] = Field(default_factory=dict, max_length=24)
    # the extras they've chosen to wear (bag, hat, glasses, chain, headphones): kind -> piece id, or none
    extras: dict[Annotated[str, StringConstraints(max_length=16)], Annotated[str, StringConstraints(max_length=32)] | None] = Field(default_factory=dict, max_length=8)


class Prefs(BaseModel):
    place: Place | None = None
    units: Literal['°F', '°C'] = '°F'
    onboarded: bool = False
    tuning: Tuning | None = None
    avatar: Avatar | None = None


def prefs_of(p: Row | None) -> Prefs:
    if not p:
        return Prefs()
    return Prefs(place=Place(name=p.place_name, lat=p.lat, lon=p.lon) if p.place_name and p.lat is not None and p.lon is not None else None,
                 units=p.units, onboarded=p.onboarded, tuning=Tuning(**p.tuning) if p.tuning else None,
                 avatar=Avatar(**p.avatar) if p.avatar else None)


class Me(BaseModel):
    user: UserOut | None
    prefs: Prefs | None


@router.get('/me', response_model=Me)
async def me(user: Row | None = Depends(current_user), db: Database = Depends(get_db)):
    """Always 200; user is null when signed out."""
    if not user:
        return Me(user=None, prefs=None)
    return Me(user=UserOut.model_validate(user, from_attributes=True), prefs=prefs_of(await get_prefs(db, user.id)))


class PrefsIn(BaseModel):
    """Only the fields that are sent change."""
    place: Place | None = None
    units: Literal['°F', '°C'] | None = None
    onboarded: bool | None = None
    tuning: Tuning | None = None
    avatar: Avatar | None = None


@router.put('/me/prefs', response_model=Prefs)
async def put_prefs(body: PrefsIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    sent, cols = body.model_fields_set, {}
    if 'place' in sent and body.place:
        cols.update(place_name=body.place.name, lat=body.place.lat, lon=body.place.lon)
    if 'units' in sent and body.units:
        cols['units'] = body.units
    if 'onboarded' in sent and body.onboarded is not None:
        cols['onboarded'] = body.onboarded
    if 'tuning' in sent:
        cols['tuning'] = body.tuning.model_dump() if body.tuning else None
    if 'avatar' in sent and body.avatar:
        cols['avatar'] = body.avatar.model_dump()
    cols['updated_at'] = utcnow()
    await db.run("INSERT OR IGNORE INTO preferences (user_id, units, onboarded, updated_at) VALUES (?, '°F', 0, ?)", user.id, utcnow())
    await db.run(f"UPDATE preferences SET {', '.join(f'{k} = ?' for k in cols)} WHERE user_id = ?", *cols.values(), user.id)
    return prefs_of(await get_prefs(db, user.id))


class CheckinIn(BaseModel):
    forecast_id: int
    felt: int = Field(ge=1, le=100)
    fit: Fit | None = None


class CheckinOut(BaseModel):
    id: int
    forecast_id: int
    city: str
    local_date: str
    felt: int
    fit: str | None
    forecast_score: int


@router.post('/checkins', response_model=CheckinOut)
async def post_checkin(body: CheckinIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    f = await db.first('SELECT * FROM forecasts WHERE id = ?', body.forecast_id)
    if not f or (f.user_id and f.user_id != user.id):
        raise HTTPException(404, 'no such forecast')
    await db.run('UPDATE forecasts SET user_id = ? WHERE id = ?', user.id, f.id)  # a forecast seen before signing in becomes theirs
    now = utcnow()
    # one check-in per day and place; saving again edits it
    c = await db.first('INSERT INTO checkins (user_id, forecast_id, city, local_date, felt, fit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) '
                       'ON CONFLICT (user_id, local_date, city) DO UPDATE SET forecast_id = excluded.forecast_id, felt = excluded.felt, '
                       'fit = excluded.fit, updated_at = excluded.updated_at RETURNING *',
                       user.id, f.id, f.city, f.local_date, body.felt, body.fit, now, now)
    return CheckinOut(id=c.id, forecast_id=f.id, city=c.city, local_date=c.local_date, felt=c.felt, fit=c.fit, forecast_score=f.score)


@router.get('/checkins', response_model=list[CheckinOut])
async def list_checkins(limit: int = 30, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    return [CheckinOut(id=c.id, forecast_id=f.id, city=c.city, local_date=c.local_date, felt=c.felt, fit=c.fit, forecast_score=f.score)
            for c, f in await recent_checkins(db, user.id, min(limit, 100))]


# limit matches forecast.QUEUE: the check-ins that make up someone's personal signal
async def recent_checkins(db: Database, user_id: str, limit: int = 6) -> list[tuple[Row, Row]]:
    cs = await db.all('SELECT * FROM checkins WHERE user_id = ? ORDER BY local_date DESC, id DESC LIMIT ?', user_id, limit)
    if not cs:
        return []
    ids = list({c.forecast_id for c in cs})
    fs = {f.id: f for f in await db.all(f'SELECT * FROM forecasts WHERE id IN ({placeholders(len(ids))})', *ids)}
    return [(c, fs[c.forecast_id]) for c in cs if c.forecast_id in fs]


async def get_prefs(db: Database, user_id: str) -> Row | None:
    return await db.first('SELECT * FROM preferences WHERE user_id = ?', user_id)


Day = Annotated[str, StringConstraints(pattern=r'^\d{4}-\d{2}-\d{2}$')]


class TripIn(BaseModel):
    place: Place
    start: Day
    end: Day


class TripTick(BaseModel):
    today: Day  # their local date


class TripMoved(BaseModel):
    changed: bool  # their place just switched (to the trip's city, or back)
    prefs: Prefs


@router.put('/me/trip', status_code=204)
async def book_trip(body: TripIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    """Booking at the airport. A new booking replaces the last; if they're away on that one, where they came from
    carries over, so they still go back there in the end."""
    if body.end < body.start:
        raise HTTPException(422, 'the trip ends before it starts')
    was = await db.first('SELECT * FROM trips WHERE user_id = ?', user.id)
    home = (was.home_name, was.home_lat, was.home_lon) if was and was.state == 'away' else (None, None, None)
    await db.run('INSERT INTO trips (user_id, place_name, lat, lon, start_date, end_date, home_name, home_lat, home_lon, state, created_at) '
                 "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?) ON CONFLICT (user_id) DO UPDATE SET place_name = excluded.place_name, "
                 'lat = excluded.lat, lon = excluded.lon, start_date = excluded.start_date, end_date = excluded.end_date, '
                 'home_name = excluded.home_name, home_lat = excluded.home_lat, home_lon = excluded.home_lon, state = excluded.state, '
                 'created_at = excluded.created_at',
                 user.id, body.place.name, body.place.lat, body.place.lon, body.start, body.end, *home, utcnow())


class TripOut(BaseModel):
    place: str
    lat: float
    lon: float
    start: str
    end: str
    away: bool  # they're there now


@router.get('/me/trip', response_model=TripOut | None)
async def next_trip(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    """The trip they've booked (or are on), for the airport to show; nothing once it's over."""
    t = await db.first("SELECT * FROM trips WHERE user_id = ? AND state IN ('booked', 'away')", user.id)
    return TripOut(place=t.place_name, lat=t.lat, lon=t.lon, start=t.start_date, end=t.end_date, away=t.state == 'away') if t else None


@router.delete('/me/trip', status_code=204)
async def cancel_trip(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    """Not going after all. Only a trip that hasn't started: once they're away, getting home is up to the trip."""
    await db.run("DELETE FROM trips WHERE user_id = ? AND state = 'booked'", user.id)


def _same_place(p: Row | None, name: str, lat: float, lon: float) -> bool:
    return bool(p and p.lat is not None and p.lon is not None and (p.place_name == name or (abs(p.lat - lat) < 0.05 and abs(p.lon - lon) < 0.05)))


async def _move(db: Database, user_id: str, name: str, lat: float, lon: float):
    await db.run("INSERT OR IGNORE INTO preferences (user_id, units, onboarded, updated_at) VALUES (?, '°F', 0, ?)", user_id, utcnow())
    await db.run('UPDATE preferences SET place_name = ?, lat = ?, lon = ?, updated_at = ? WHERE user_id = ?', name, lat, lon, utcnow(), user_id)


@router.post('/me/trip/tick', response_model=TripMoved)
async def trip_tick(body: TripTick, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    """Checked when the app opens (and now and then while it's open). Each switch happens once, never forced again:
    on the trip's first day their place becomes the trip's city; after its last day it goes back to where they were,
    unless they've already moved it somewhere else themselves."""
    t, changed = await db.first('SELECT * FROM trips WHERE user_id = ?', user.id), False
    if t and t.state in ('booked', 'away'):
        p = await get_prefs(db, user.id)
        if t.state == 'booked' and t.start_date <= body.today <= t.end_date:
            home = (t.home_name, t.home_lat, t.home_lon) if t.home_name else (p.place_name, p.lat, p.lon) if p else (None, None, None)
            await db.run("UPDATE trips SET state = 'away', home_name = ?, home_lat = ?, home_lon = ? WHERE user_id = ?", *home, user.id)
            if not _same_place(p, t.place_name, t.lat, t.lon):
                await _move(db, user.id, t.place_name, t.lat, t.lon)
                changed = True
        elif body.today > t.end_date:
            if t.state == 'away' and t.home_name and t.home_lat is not None and _same_place(p, t.place_name, t.lat, t.lon):
                await _move(db, user.id, t.home_name, t.home_lat, t.home_lon)
                changed = True
            await db.run("UPDATE trips SET state = 'done' WHERE user_id = ?", user.id)
    return TripMoved(changed=changed, prefs=prefs_of(await get_prefs(db, user.id)))

