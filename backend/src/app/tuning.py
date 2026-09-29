"""Adjust-my-preferences: "which would you rather be out in?" picks, and what they actually tell us.

A pick is evidence about where someone's *ideal* sits, not that the winner is ideal: choosing 75°F over 55°F only says
the ideal is above 65°F (the midpoint). So for each dimension we keep a probability curve over possible ideals
(a gentle prior times one logistic likelihood per pick), report its mean and 80% range, and ask the next question just
either side of the current best guess, where an answer is most informative. The gap shrinks as the range narrows,
like an eye exam.

Each pick is weighted by age: its weight halves every HALF_LIFE_DAYS but never drops below FLOOR, so a fresh round
moves the forecast right away and older picks fade into a steady background that always counts.
"""

import math
import random
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from .auth import require_user
from .db import Database, Row, get_db, placeholders, utcnow

HALF_LIFE_DAYS = 5
FLOOR = 0.3
RECENT = 60  # picks considered

Dim = Literal['temp', 'wind', 'clouds', 'humidity', 'rain']
# how much each one matters for comfort, so the questions go where they count (temperature most)
IMPORTANCE = {'temp': 1.8, 'wind': 1.0, 'clouds': 0.9, 'humidity': 0.7, 'rain': 0.6}
FIELD = {'temp': 'feels', 'wind': 'wind', 'clouds': 'clouds', 'humidity': 'humidity', 'rain': 'rain'}


class Spec:
    """How one dimension is modelled: the grid of possible ideals, a weak prior, how sharp a pick is, question gaps."""
    def __init__(self, lo, hi, step, prior_mean, prior_sd, sharp, min_gap, max_gap, differ):
        self.grid = [lo + i * step for i in range(int(round((hi - lo) / step)) + 1)]
        self.prior_mean, self.prior_sd, self.sharp = prior_mean, prior_sd, sharp
        self.min_gap, self.max_gap, self.differ = min_gap, max_gap, differ


SPECS: dict[str, Spec] = {
    #               grid           prior         sharpness  gaps        min difference to count as a question about it
    'temp':     Spec(30, 100, 0.5, 70, 9,        0.35,      2.5, 10,    3),
    'wind':     Spec(0, 35, 0.5,   6, 8,         0.30,      2, 8,       3),
    'clouds':   Spec(0, 100, 1,    30, 35,       0.07,      8, 35,      15),
    'humidity': Spec(20, 95, 1,    50, 20,       0.10,      6, 22,      10),
    'rain':     Spec(0, 1, 0.02,   0.05, 0.3,    9.0,       0.12, 0.45, 0.15),
}


class Option(BaseModel):
    feels: float = Field(ge=-60, le=140)  # °F
    wind: float = Field(ge=0, le=100)  # mph
    clouds: float = Field(ge=0, le=100)  # %
    humidity: float = Field(ge=0, le=100)  # %
    rain: float = Field(ge=0, le=1)  # 0 dry .. 1 pouring


class Pair(BaseModel):
    dim: Dim
    a: Option
    b: Option


class PickIn(BaseModel):
    a: Option
    b: Option
    pick: Literal['A', 'B', '=']


class Belief(BaseModel):
    dim: Dim
    mean: float
    lo: float  # 80% range
    hi: float
    picks: float  # weighted evidence
    strength: Literal['slight', 'some', 'strong']
    text: str


class Summary(BaseModel):
    picks: int
    beliefs: list[Belief]


class PickOut(BaseModel):
    summary: Summary
    next: Pair


def weight(created_at: datetime, now: datetime | None = None) -> float:
    age_days = ((now or utcnow()) - created_at).total_seconds() / 86400
    return max(FLOOR, 0.5 ** (age_days / HALF_LIFE_DAYS))


def _about(p: Row) -> str | None:
    """Which single dimension a pick was asking about (older picks that differed in several things are skipped)."""
    diffs = [d for d, s in SPECS.items() if abs(p.a[FIELD[d]] - p.b[FIELD[d]]) >= s.differ]
    if len(diffs) == 1:
        return diffs[0]
    if diffs == ['temp', 'humidity'] or set(diffs) == {'clouds', 'rain'}:  # rain pairs also darken the sky
        return 'rain' if 'rain' in diffs else None
    return None


def posterior(dim: str, picks: list[Row], now: datetime | None = None) -> tuple[list[float], float]:
    """Normalized probability over SPECS[dim].grid, and the weighted amount of evidence behind it."""
    s, now = SPECS[dim], now or utcnow()
    logp = [-0.5 * ((x - s.prior_mean) / s.prior_sd) ** 2 for x in s.grid]
    evidence = 0.0
    for p in picks:
        if _about(p) != dim:
            continue
        w, a, b = weight(p.created_at, now), p.a[FIELD[dim]], p.b[FIELD[dim]]
        mid = (a + b) / 2
        evidence += w
        for i, x in enumerate(s.grid):
            if p.pick == '=':  # about the same: the ideal is near the middle
                logp[i] += w * -0.5 * ((x - mid) * s.sharp) ** 2 * 0.5
            else:  # the chosen one is closer to the ideal, so the ideal is on its side of the midpoint
                side = 1 if (a if p.pick == 'A' else b) > mid else -1
                z = s.sharp * side * (x - mid)
                logp[i] += w * -math.log1p(math.exp(-z)) if z > -30 else w * z
    top = max(logp)
    prob = [math.exp(v - top) for v in logp]
    total = sum(prob)
    return [v / total for v in prob], evidence


def _stats(dim: str, prob: list[float]) -> tuple[float, float, float]:
    grid = SPECS[dim].grid
    mean = sum(x * p for x, p in zip(grid, prob))
    acc, lo, hi = 0.0, grid[0], grid[-1]
    for x, p in zip(grid, prob):
        acc += p
        if acc >= 0.1 and lo == grid[0]:
            lo = x
        if acc >= 0.9:
            hi = x
            break
    return mean, lo, hi


def _text(dim: str, mean: float, lo: float, hi: float, sure: bool = True) -> str:
    if dim == 'temp':
        return f'feels best around {round(mean)}°F ({round(lo)}–{round(hi)}°F)' if sure else f'probably feels best somewhere in {round(lo)}–{round(hi)}°F'
    if dim == 'wind':
        return 'likes still air' if mean < 3 else f'likes a light breeze, around {round(mean)} mph' if mean < 10 else f'likes it breezy, around {round(mean)} mph'
    if dim == 'clouds':
        return 'likes clear, sunny skies' if mean < 22 else 'likes sun with some clouds' if mean < 50 else 'happy under clouds'
    if dim == 'humidity':
        return 'likes dry air' if mean < 42 else f'fine up to about {round(hi)}% humidity' if mean < 65 else "doesn't mind muggy air"
    return 'would rather it be dry' if mean < 0.1 else 'fine with a sprinkle' if mean < 0.3 else "doesn't mind rain"


def _strength(dim: str, lo: float, hi: float, evidence: float) -> Literal['slight', 'some', 'strong']:
    s = SPECS[dim]
    width = (hi - lo) / (s.grid[-1] - s.grid[0])
    return 'strong' if evidence >= 2.5 and width < 0.14 else 'some' if evidence >= 1 and width < 0.3 else 'slight'


def beliefs(picks: list[Row]) -> list[Belief]:
    out, now = [], utcnow()
    for dim in SPECS:
        prob, ev = posterior(dim, picks, now)
        if not ev:
            continue  # never asked about it: say nothing rather than echo the prior
        mean, lo, hi = _stats(dim, prob)
        strength = _strength(dim, lo, hi, ev)
        out.append(Belief(dim=dim, mean=round(mean, 2), lo=round(lo, 2), hi=round(hi, 2), picks=round(ev, 2),
                          strength=strength, text=_text(dim, mean, lo, hi, sure=strength != 'slight')))
    return out


def next_pair(picks: list[Row]) -> Pair:
    """Ask about whatever we're least sure of, with the two options straddling the current best guess."""
    now = utcnow()
    est: dict[str, tuple[float, float, float]] = {}
    for dim in SPECS:
        prob, _ = posterior(dim, picks, now)
        est[dim] = _stats(dim, prob)
    last = _about(picks[0]) if picks else None

    def unsure(d: str) -> float:
        lo, hi = est[d][1], est[d][2]
        g = SPECS[d].grid
        return (hi - lo) / (g[-1] - g[0]) * IMPORTANCE[d] * (0.4 if d == last else 1) * random.uniform(0.85, 1.15)

    dim = 'temp' if not picks else max(SPECS, key=unsure)
    s = SPECS[dim]
    mean, lo, hi = est[dim]
    gap = min(s.max_gap, max(s.min_gap, (hi - lo) / 3))
    center = min(max(mean, s.grid[0] + gap), s.grid[-1] - gap)
    # everything else sits at their own best guess, so the only difference is the thing being asked about
    base = {FIELD[d]: est[d][0] for d in SPECS}
    base['rain'] = 0.0
    if dim == 'humidity':
        base['feels'] = max(base['feels'], 80)  # humidity only matters when it's warm
    if dim == 'rain':
        base['clouds'] = 90
    a, b = dict(base), dict(base)
    a[FIELD[dim]], b[FIELD[dim]] = center - gap, center + gap
    rnd = lambda o: Option(**{k: round(v, 2) if k == 'rain' else round(v) for k, v in o.items()})
    x, y = rnd(a), rnd(b)
    return Pair(dim=dim, a=x, b=y) if random.random() < 0.5 else Pair(dim=dim, a=y, b=x)


async def recent_picks(db: Database, user_id: str) -> list[Row]:
    return await db.all('SELECT * FROM tune_picks WHERE user_id = ? ORDER BY id DESC LIMIT ?', user_id, RECENT)


def section(picks: list[Row]) -> str:
    """The SPECIFICALLY TUNED block of the Jev state."""
    bs = beliefs(picks)
    if not bs:
        return ''
    return ('\nSPECIFICALLY TUNED (they picked between weathers in the app; ranges are 80% sure; recent picks count most, '
            'older ones fade but always count):\n' + '\n'.join(f'- {b.text} ({b.strength})' for b in bs))


router = APIRouter(prefix='/tune', tags=['tune'])


def _summary(picks: list[Row]) -> Summary:
    return Summary(picks=len(picks), beliefs=beliefs(picks))


@router.get('/next', response_model=Pair)
async def get_next(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    return next_pair(await recent_picks(db, user.id))


@router.post('', response_model=PickOut)
async def post_pick(body: PickIn, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    await db.run('INSERT INTO tune_picks (user_id, a, b, pick, created_at) VALUES (?, ?, ?, ?, ?)',
                 user.id, body.a.model_dump(), body.b.model_dump(), body.pick, utcnow())
    picks = await recent_picks(db, user.id)
    return PickOut(summary=_summary(picks), next=next_pair(picks))


@router.delete('/{dim}', response_model=PickOut)
async def forget(dim: Dim, user: Row = Depends(require_user), db: Database = Depends(get_db)):
    """Forget one learned preference: delete every pick that was asking about it (all of them, not just recent ones)."""
    rows = await db.all('SELECT * FROM tune_picks WHERE user_id = ?', user.id)
    ids = [p.id for p in rows if _about(p) == dim]
    for i in range(0, len(ids), 90):  # D1 takes at most 100 bound values per query
        chunk = ids[i:i + 90]
        await db.run(f'DELETE FROM tune_picks WHERE id IN ({placeholders(len(chunk))})', *chunk)
    picks = await recent_picks(db, user.id)
    return PickOut(summary=_summary(picks), next=next_pair(picks))


@router.get('/summary', response_model=Summary)
async def get_summary(user: Row = Depends(require_user), db: Database = Depends(get_db)):
    return _summary(await recent_picks(db, user.id))
