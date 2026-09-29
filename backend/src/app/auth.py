"""Sign in (Google, or email-only while developing), sessions and sign out.

A session is a random token in an HttpOnly cookie; the database only keeps its sha256, so a leaked database
can't be replayed as logins.
"""

import hashlib
import re
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from . import config
from .db import Database, Row, get_db, new_id, utcnow
from .net import http

COOKIE = 'snug_session'
TTL = timedelta(days=30)
GOOGLE_ISSUERS = ('accounts.google.com', 'https://accounts.google.com')

router = APIRouter(prefix='/auth', tags=['auth'])


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None
    picture: str | None


async def current_user(request: Request, db: Database = Depends(get_db)) -> Row | None:
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    row = await db.first('SELECT * FROM sessions WHERE token_hash = ?', _hash(token))
    if not row or row.expires_at < utcnow():
        return None
    user = await db.first('SELECT * FROM users WHERE id = ?', row.user_id)
    if user and utcnow() - user.last_seen_at > timedelta(hours=1):
        user.last_seen_at = utcnow()
        await db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', user.last_seen_at, user.id)
    return user


async def require_user(user: Row | None = Depends(current_user)) -> Row:
    if not user:
        raise HTTPException(401, 'sign in first')
    return user


async def _start_session(db: Database, user: Row, request: Request, response: Response) -> None:
    token, now = secrets.token_urlsafe(32), utcnow()
    await db.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)',
                 _hash(token), user.id, now, now + TTL, (request.headers.get('user-agent') or '')[:400])
    await db.run("INSERT OR IGNORE INTO preferences (user_id, units, onboarded, updated_at) VALUES (?, '°F', 0, ?)", user.id, now)
    response.set_cookie(COOKIE, token, max_age=int(TTL.total_seconds()), httponly=True, samesite='lax',
                        secure=config.production() or request.url.scheme == 'https', path='/')


async def _upsert(db: Database, email: str, name: str | None = None, picture: str | None = None, google_sub: str | None = None) -> Row:
    user = await db.first('SELECT * FROM users WHERE google_sub = ?', google_sub) if google_sub else None
    if not user:
        user = await db.first('SELECT * FROM users WHERE email = ?', email)
    now = utcnow()
    if not user:
        return await db.first('INSERT INTO users (id, email, name, picture, google_sub, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *',
                              new_id(), email, name, picture, google_sub, now, now)
    return await db.first('UPDATE users SET name = ?, picture = ?, google_sub = ?, last_seen_at = ? WHERE id = ? RETURNING *',
                          name or user.name, picture or user.picture, google_sub or user.google_sub, now, user.id)


@router.get('/config')
async def auth_config():
    """What the sign-in UI should offer."""
    return {'google_client_id': config.google_client_id(), 'dev_login': config.dev_login()}


class GoogleIn(BaseModel):
    """One of: an ID token (Google's standard button) or an access token (our wooden button's popup)."""
    credential: str | None = None
    access_token: str | None = None


async def _google_identity(body: GoogleIn) -> dict:
    """Who Google says this is, after checking the token was issued to our client id."""
    client_id = config.google_client_id()
    if body.credential:
        # Google's tokeninfo checks the ID token's signature and expiry; we check it was issued to us
        info = await http().get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': body.credential}, timeout=10)
        t = info.json() if info.status_code == 200 else {}
        if t.get('aud') != client_id or t.get('iss') not in GOOGLE_ISSUERS or not t.get('sub'):
            raise HTTPException(401, 'invalid google credential')
        return t
    if not body.access_token:
        raise HTTPException(422, 'send credential or access_token')
    info = await http().get('https://oauth2.googleapis.com/tokeninfo', params={'access_token': body.access_token}, timeout=10)
    t = info.json() if info.status_code == 200 else {}
    # an access token minted for some other app must not sign anyone in here
    if client_id not in (t.get('aud'), t.get('azp')):
        raise HTTPException(401, 'invalid google token')
    me = await http().get('https://openidconnect.googleapis.com/v1/userinfo', headers={'Authorization': f'Bearer {body.access_token}'}, timeout=10)
    if me.status_code != 200:
        raise HTTPException(401, 'invalid google token')
    u = me.json()
    if u.get('sub') != t.get('sub'):
        raise HTTPException(401, 'invalid google token')
    return u


@router.post('/google', response_model=UserOut)
async def google_sign_in(body: GoogleIn, request: Request, response: Response, db: Database = Depends(get_db)):
    if not config.google_client_id():
        raise HTTPException(503, 'google sign-in is not configured (set GOOGLE_CLIENT_ID)')
    info = await _google_identity(body)
    if not info.get('email') or info.get('email_verified') not in (True, 'true'):
        raise HTTPException(401, 'google account has no verified email')
    user = await _upsert(db, info['email'].lower(), info.get('name'), info.get('picture'), info['sub'])
    await _start_session(db, user, request, response)
    return UserOut.model_validate(user, from_attributes=True)


class DevIn(BaseModel):
    email: str = Field(max_length=320)
    name: str | None = Field(None, max_length=200)


@router.post('/dev', response_model=UserOut)
async def dev_sign_in(body: DevIn, request: Request, response: Response, db: Database = Depends(get_db)):
    if not config.dev_login():
        raise HTTPException(404, 'not found')
    email = body.email.strip().lower()
    if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        raise HTTPException(422, 'that doesn’t look like an email')
    user = await _upsert(db, email, body.name or email.split('@')[0])
    await _start_session(db, user, request, response)
    return UserOut.model_validate(user, from_attributes=True)


@router.post('/logout', status_code=204)
async def logout(request: Request, response: Response, db: Database = Depends(get_db)):
    token = request.cookies.get(COOKIE)
    if token:
        await db.run('DELETE FROM sessions WHERE token_hash = ?', _hash(token))
    response.delete_cookie(COOKIE, path='/')
