"""Minimal client for OpenRouter's Decisions API, which is how Jev is served.

Jev doesn't write text: every answer is a typed decision with probabilities.
  score  -> {"score": expected level 0..n-1, "confidence", "probabilities"}   (at most 10 levels)
  choice -> {"choice": key, "confidence", "probabilities"}
  noul   -> {"noul": probability the answer is true}
"""

import os
from typing import Any

import httpx

URL = 'https://openrouter.ai/api/alpha/decisions'


def model() -> str:
    return os.environ.get('JEV_MODEL') or '~typesafe/jev-latest'


class JevError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


def score_q(instructions: str, levels: list[str]) -> dict:
    return {'type': 'score', 'instructions': instructions, 'criteria': levels}


def choice_q(instructions: str, options: dict[str, str]) -> dict:
    return {'type': 'choice', 'instructions': instructions, 'criteria': options}


def noul_q(instructions: str, yes: str = 'yes', no: str = 'no') -> dict:
    return {'type': 'noul', 'instructions': instructions, 'criteria': {'true': yes, 'false': no}}


async def decide(client: httpx.AsyncClient, state: Any, questions: dict[str, dict]) -> tuple[str, dict[str, dict]]:
    """Ask Jev every question about one state. Returns (resolved model id, answers by key)."""
    key = os.environ.get('OPENROUTER_KEY')
    if not key:
        raise JevError('OPENROUTER_KEY is not set in .env', 500)
    try:
        res = await client.post(URL, json={'model': model(), 'state': state, 'questions': questions},
                                headers={'Authorization': f'Bearer {key}', 'X-Title': 'snug'}, timeout=20)
    except httpx.HTTPError as e:
        raise JevError(f'jev unreachable: {e!r}') from e
    body = res.json() if res.headers.get('content-type', '').startswith('application/json') else {}
    if res.status_code != 200 or 'answers' not in body:
        raise JevError(f"jev {res.status_code}: {(body.get('error') or {}).get('message', res.text[:200])}", res.status_code)
    return body.get('model', model()), body['answers']


def score(a: dict | None) -> float:
    if not a or a.get('type') != 'score':
        raise JevError(f'expected a score answer, got {a!r}')
    return float(a['score'])


def choice(a: dict | None, options: dict[str, str], fallback: str) -> str:
    c = a.get('choice') if a and a.get('type') == 'choice' else None
    return c if c in options else fallback


def yes(a: dict | None) -> bool:
    return bool(a and a.get('type') == 'noul' and a.get('noul', 0) >= 0.5)
