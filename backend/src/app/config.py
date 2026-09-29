"""Settings. Locally they come from the repo-root .env; on Cloudflare from the Worker's vars and secrets, which
src/entry.py copies into os.environ on each request. So read them through these functions, never at import time."""

import os
from pathlib import Path

try:  # local development only; the Worker has no .env
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[3] / '.env')
except ImportError:
    pass


def google_client_id() -> str | None:
    return os.environ.get('GOOGLE_CLIENT_ID') or None


def production() -> bool:
    return os.environ.get('SNUG_ENV') == 'production'


def dev_login() -> bool:
    """Email-only sign-in for local testing. Off as soon as Google sign-in is configured, and never in production."""
    return not google_client_id() and not production()
