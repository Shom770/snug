"""Friends, who live on each other's street rather than in a list.

  GET  /friends/me        -> my code (to share as a link) and whether my city's hidden
  PUT  /friends/me        -> hide or show my city
  POST /friends/add       -> {code}: become friends with whoever's code it is (both ways)
  GET  /friends/street    -> the friends out on my street today: up to five who opened snug today (rotating through the
                             day if there are more), each with their outfit, weather, city, mood word and comfort score
  POST /friends/react     -> {to, kind}: a heart or a "fit" for a friend, once a day each
  GET  /mailbox           -> the postcards in my mailbox (read or not, until I toss them);  POST /mailbox/seen -> I've
                             read them (the flag comes down);  POST /mailbox/discard -> {id}: toss one
  GET  /friends/feed      -> what friends (and I) are up to: "feeling: frazzled" and a line, the last few days' worth
  POST /friends/status    -> {feeling, text}: post mine
  PUT  /friends/card      -> the picture my link shows when it's shared (my snug in today's fit), drawn by the app
  GET  /f/{code}          -> my link: a page with its preview ("add me as a friend on snug!" and the picture) that
                             sends you on into snug to add me;  GET /f/{code}/card.png -> the picture

Only ever the city name, never anything more precise; and not even that for anyone who's hidden theirs.
"""

import base64
import binascii
import html
import logging
import secrets
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from pydantic import BaseModel, Field

from .auth import require_user
from .db import Database, Row, get_db, placeholders, utcnow
from .models import Outfit

router = APIRouter(tags=['friends'])
log = logging.getLogger('snug')

ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'  # no 0/o, 1/l/i: easy to read out and type
ON_STREET = 5  # friends out walking at once
FRESH = timedelta(hours=20)  # opened snug "today": their last visit within this long


class Settings(BaseModel):
    code: str
    hideCity: bool


class SettingsIn(BaseModel):
    hideCity: bool


class StatusIn(BaseModel):
    feeling: str = Field(min_length=1, max_length=24)
    text: str = Field('', max_length=140)


class Post(BaseModel):
    name: str
    mine: bool
    feeling: str
    text: str
    at: str
    city: str | None
    condition: str | None
    night: bool = False
    avatar: dict | None
    outfit: Outfit | None


class CardIn(BaseModel):
    png: str = Field(max_length=900_000)  # base64, no data: prefix


class AddIn(BaseModel):
    code: str = Field(min_length=4, max_length=12)


class Added(BaseModel):
    name: str


class Walker(BaseModel):
    id: str
    name: str
    avatar: dict | None
    outfit: Outfit | None
    city: str | None  # None when they've hidden it
    mood: str | None
    score: int | None
    condition: str | None
    night: bool = False
    sent: list[str] = []  # the reactions I've already sent them today


class ReactIn(BaseModel):
    to: str = Field(max_length=32)
    kind: Literal['heart', 'fit']


class Letter(BaseModel):
    """A reaction, arriving as a postcard from where they are."""
    id: int
    seen: bool
    name: str
    kind: str
    at: str
    city: str | None  # None when they've hidden it
    condition: str | None  # their weather, for the picture on the front
    night: bool = False


class TossIn(BaseModel):
    id: int


class Mailbox(BaseModel):
    letters: list[Letter]


def _first_name(u: Row) -> str:
    return ((u.name or '').split() or [(u.email or 'a friend').split('@')[0]])[0][:20].lower()


async def _settings(db: Database, user_id: str) -> Row:
    row = await db.first('SELECT * FROM friend_codes WHERE user_id = ?', user_id)
    while not row:
        code = ''.join(secrets.choice(ALPHABET) for _ in range(6))
        await db.run('INSERT OR IGNORE INTO friend_codes (user_id, code, hide_city, created_at) VALUES (?, ?, 0, ?)', user_id, code, utcnow())
        row = await db.first('SELECT * FROM friend_codes WHERE user_id = ?', user_id)
    return row


async def note_presence(db: Database, user_id: str, w, score: int, label: str, outfit: Outfit) -> None:
    """They opened snug: on their friends' streets today, in this outfit, in this weather. Never at the cost of their
    forecast: if it can't be noted (the friends tables not there yet, say), it's just skipped."""
    try:
        await _note(db, user_id, w, score, label, outfit)
    except Exception:  # noqa: BLE001
        log.exception('presence not noted')


async def _note(db: Database, user_id: str, w, score: int, label: str, outfit: Outfit) -> None:
    await db.run('INSERT INTO presence (user_id, local_date, city, lat, lon, score, label, outfit, condition, night, updated_at) '
                 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET local_date = excluded.local_date, '
                 'city = excluded.city, lat = excluded.lat, lon = excluded.lon, score = excluded.score, label = excluded.label, '
                 'outfit = excluded.outfit, condition = excluded.condition, night = excluded.night, updated_at = excluded.updated_at',
                 user_id, w.time[:10], w.city, w.lat, w.lon, score, label, outfit.model_dump(), w.condition, bool(w.night), utcnow())


@router.get('/friends/me', response_model=Settings)
async def my_settings(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    s = await _settings(db, user.id)
    return Settings(code=s.code, hideCity=bool(s.hide_city))


@router.put('/friends/me', response_model=Settings)
async def put_settings(body: SettingsIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    s = await _settings(db, user.id)
    await db.run('UPDATE friend_codes SET hide_city = ? WHERE user_id = ?', body.hideCity, user.id)
    return Settings(code=s.code, hideCity=body.hideCity)


@router.post('/friends/add', response_model=Added)
async def add_friend(body: AddIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    owner = await db.first('SELECT * FROM friend_codes WHERE code = ?', body.code.strip().lower())
    if not owner:
        raise HTTPException(404, 'no one has that code')
    if owner.user_id == user.id:
        raise HTTPException(400, "that's your own code")
    now = utcnow()
    await db.run('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)', user.id, owner.user_id, now)
    await db.run('INSERT OR IGNORE INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)', owner.user_id, user.id, now)
    them = await db.first('SELECT * FROM users WHERE id = ?', owner.user_id)
    return Added(name=_first_name(them))


@router.get('/friends/street', response_model=list[Walker])
async def street(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    ids = [r.friend_id for r in await db.all('SELECT friend_id FROM friends WHERE user_id = ?', user.id)]
    if not ids:
        return []
    marks = placeholders(len(ids))
    now = utcnow()
    people = {u.id: u for u in await db.all(f'SELECT * FROM users WHERE id IN ({marks})', *ids)}
    prefs = {p.user_id: p for p in await db.all(f'SELECT user_id, avatar FROM preferences WHERE user_id IN ({marks})', *ids)}
    hidden = {c.user_id for c in await db.all(f'SELECT user_id FROM friend_codes WHERE hide_city = 1 AND user_id IN ({marks})', *ids)}
    seen = {p.user_id: p for p in await db.all(f'SELECT * FROM presence WHERE user_id IN ({marks})', *ids)}
    out_today = sorted(i for i in ids if i in seen and now - seen[i].updated_at <= FRESH)
    # more than five out today: a different five each hour
    if len(out_today) > ON_STREET:
        k = now.hour % len(out_today)
        out_today = (out_today[k:] + out_today[:k])[:ON_STREET]
    sent: dict[str, list[str]] = {}
    for r in await db.all('SELECT to_id, kind FROM reactions WHERE from_id = ? AND local_date = ?', user.id, now.date().isoformat()):
        sent.setdefault(r.to_id, []).append(r.kind)

    def walker(i: str) -> Walker:
        p, pr = seen[i], prefs.get(i)
        return Walker(id=i, name=_first_name(people[i]), avatar=pr.avatar if pr else None, outfit=Outfit(**p.outfit),
                      city=None if i in hidden else p.city.split(',')[0], mood=p.label, score=p.score,
                      condition=p.condition, night=bool(p.night), sent=sent.get(i, []))
    return [walker(i) for i in out_today if i in people]


@router.post('/friends/react')
async def react(body: ReactIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    if not await db.first('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?', user.id, body.to):
        raise HTTPException(404, 'not a friend')
    await db.run('INSERT OR IGNORE INTO reactions (from_id, to_id, kind, local_date, seen, created_at) VALUES (?, ?, ?, ?, 0, ?)',
                 user.id, body.to, body.kind, utcnow().date().isoformat(), utcnow())
    return {'ok': True}


@router.get('/mailbox', response_model=Mailbox)
async def mailbox(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    rows = await db.all('SELECT r.id, r.seen, r.kind, r.created_at, u.name, u.email, p.city, p.condition, p.night, c.hide_city FROM reactions r '
                        'JOIN users u ON u.id = r.from_id LEFT JOIN presence p ON p.user_id = r.from_id LEFT JOIN friend_codes c ON c.user_id = r.from_id '
                        'WHERE r.to_id = ? AND r.discarded = 0 ORDER BY r.created_at DESC LIMIT 30', user.id)
    return Mailbox(letters=[Letter(id=r.id, seen=bool(r.seen), name=_first_name(r), kind=r.kind, at=r.created_at.isoformat(), city=None if r.hide_city or not r.city else r.city.split(',')[0],
                                   condition=r.condition, night=bool(r.night)) for r in rows])


@router.post('/mailbox/seen')
async def mailbox_seen(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    await db.run('UPDATE reactions SET seen = 1 WHERE to_id = ? AND seen = 0', user.id)
    return {'ok': True}


@router.post('/mailbox/discard')
async def mailbox_discard(body: TossIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    await db.run('UPDATE reactions SET discarded = 1, seen = 1 WHERE id = ? AND to_id = ?', body.id, user.id)
    return {'ok': True}


@router.put('/friends/card')
async def put_card(body: CardIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    try:
        raw = base64.b64decode(body.png, validate=True)
    except (binascii.Error, ValueError) as e:
        raise HTTPException(422, 'not a picture') from e
    if not raw.startswith(b'\x89PNG'):
        raise HTTPException(422, 'not a png')
    await _settings(db, user.id)
    await db.run('UPDATE friend_codes SET card = ? WHERE user_id = ?', body.png, user.id)
    return {'ok': True}


@router.get('/f/{code}', response_class=HTMLResponse)
async def share_page(code: str, request: Request, db: Database = Depends(get_db)):
    """What a shared link opens: the preview a chat app shows, then straight on into snug to add them."""
    row = await db.first('SELECT * FROM friend_codes WHERE code = ?', code.strip().lower())
    origin = f'{request.url.scheme}://{request.url.netloc}'
    if not row:
        return RedirectResponse(origin + '/')
    who = await db.first('SELECT * FROM users WHERE id = ?', row.user_id)
    name, c = html.escape(_first_name(who)), html.escape(row.code)
    image = f'{origin}/f/{c}/card.png' if row.card else f'{origin}/opengraph-image.jpg'
    title, desc, go = 'add me as a friend on snug!', f'{name} wants you on their street. come say hi.', f'{origin}/?f={c}'
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="website">
<meta property="og:url" content="{origin}/f/{c}"><meta property="og:site_name" content="snug"><meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{name}'s snug, in today's fit">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{image}">
<meta http-equiv="refresh" content="0; url={go}"></head>
<body style="background:#f3ede1;font-family:sans-serif"><script>location.replace({go!r})</script><a href="{go}">open snug</a></body></html>"""


@router.get('/f/{code}/card.png')
async def share_card(code: str, request: Request, db: Database = Depends(get_db)):
    row = await db.first('SELECT card FROM friend_codes WHERE code = ?', code.strip().lower())
    if not row or not row.card:
        return RedirectResponse(f'{request.url.scheme}://{request.url.netloc}/opengraph-image.jpg')
    return Response(base64.b64decode(row.card), media_type='image/png', headers={'Cache-Control': 'public, max-age=3600'})


@router.get('/friends/feed', response_model=list[Post])
async def feed(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    ids = [user.id] + [r.friend_id for r in await db.all('SELECT friend_id FROM friends WHERE user_id = ?', user.id)]
    marks = placeholders(len(ids))
    rows = await db.all(f'SELECT s.*, u.name, u.email, p.city, p.condition, p.night, p.outfit, c.hide_city, pr.avatar FROM statuses s '
                        f'JOIN users u ON u.id = s.user_id LEFT JOIN presence p ON p.user_id = s.user_id LEFT JOIN friend_codes c ON c.user_id = s.user_id '
                        f'LEFT JOIN preferences pr ON pr.user_id = s.user_id WHERE s.user_id IN ({marks}) AND s.created_at > ? '
                        f'ORDER BY s.created_at DESC LIMIT 40', *ids, utcnow() - timedelta(days=3))
    return [Post(name=_first_name(r), mine=r.user_id == user.id, feeling=r.feeling, text=r.text, at=r.created_at.isoformat(),
                 city=None if r.hide_city or not r.city else r.city.split(',')[0], condition=r.condition, night=bool(r.night),
                 avatar=r.avatar, outfit=Outfit(**r.outfit) if r.outfit else None) for r in rows]


@router.post('/friends/status')
async def post_status(body: StatusIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    await db.run('INSERT INTO statuses (user_id, feeling, text, created_at) VALUES (?, ?, ?, ?)', user.id, body.feeling.strip().lower(), body.text.strip(), utcnow())
    return {'ok': True}
