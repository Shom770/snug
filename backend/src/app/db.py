"""SQL storage: users, sessions, preferences, the forecasts we served, tune picks and check-ins.

On Cloudflare it's the D1 database bound as DB; locally it's backend/snug.db. Both have the schema in
backend/migrations (applied with `wrangler d1 migrations apply`, or automatically to a fresh local file).

Rows come back as `Row`s: attribute access, JSON columns decoded, timestamps as naive-UTC datetimes, booleans as bool.
Values are stored the way SQLAlchemy stored them before, so older local databases keep working.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from fastapi import Request

ROOT = Path(__file__).resolve().parents[2]
LOCAL_DB = ROOT / 'snug.db'
MIGRATIONS = ROOT / 'migrations'

JSON_COLS = {'tuning', 'avatar', 'curve', 'outfit', 'weather', 'a', 'b'}
TIME_COLS = {'created_at', 'last_seen_at', 'expires_at', 'updated_at'}
BOOL_COLS = {'onboarded'}


def utcnow() -> datetime:
    """Naive UTC, which is what the database round-trips."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_id() -> str:
    return uuid.uuid4().hex


class Row(SimpleNamespace):
    """One database row."""


def _encode(v: Any) -> Any:
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, datetime):  # always 6 fractional digits, so timestamps compare correctly as text
        return v.isoformat(sep=' ', timespec='microseconds')
    if isinstance(v, (dict, list)):
        return json.dumps(v)
    return v


def _decode(d: dict) -> Row:
    out = {}
    for k, v in d.items():
        if v is not None and k in JSON_COLS and isinstance(v, str):
            v = json.loads(v)
        elif v is not None and k in TIME_COLS and isinstance(v, str):
            v = datetime.fromisoformat(v)
        elif k in BOOL_COLS and v is not None:
            v = bool(v)
        out[k] = v
    return Row(**out)


class Database:
    async def _all(self, sql: str, args: list) -> list[dict]:
        raise NotImplementedError

    async def all(self, sql: str, *args: Any) -> list[Row]:
        return [_decode(r) for r in await self._all(sql, [_encode(a) for a in args])]

    async def first(self, sql: str, *args: Any) -> Row | None:
        rows = await self.all(sql, *args)
        return rows[0] if rows else None

    async def run(self, sql: str, *args: Any) -> None:
        await self._all(sql, [_encode(a) for a in args])


class D1(Database):
    """Cloudflare D1 through the Worker binding (the Python SDK converts values and nulls both ways)."""

    def __init__(self, binding):
        self.binding = binding

    async def _all(self, sql, args):
        stmt = self.binding.prepare(sql)
        if args:
            stmt = stmt.bind(*args)
        res = await stmt.all()
        return [dict(r) for r in (res['results'] or [])]


class Local(Database):
    """A SQLite file for local development."""

    _ready = False

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(LOCAL_DB)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')
        if not Local._ready:
            if not conn.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").fetchone():
                for f in sorted(MIGRATIONS.glob('*.sql')):
                    conn.executescript(f.read_text())
            Local._ready = True
        return conn

    async def _all(self, sql, args):
        conn = self._connect()
        try:
            rows = [dict(r) for r in conn.execute(sql, args).fetchall()]
            conn.commit()
            return rows
        finally:
            conn.close()


def get_db(request: Request) -> Database:
    """FastAPI dependency: D1 when running as a Worker, the local file otherwise."""
    env = request.scope.get('env')
    return D1(env.DB) if env is not None else Local()


def placeholders(n: int) -> str:
    return ', '.join('?' * n)


__all__ = ['Database', 'Row', 'get_db', 'new_id', 'placeholders', 'utcnow']
