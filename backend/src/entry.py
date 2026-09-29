"""Cloudflare Worker entry. The site's static files are served by Workers Assets; only /backend/* reaches this
Worker, which hands it to the FastAPI app (the same one `uvicorn app.main:app` runs locally) without the prefix."""

import os

from workers import asgi

from app.main import app as api

PREFIX = '/backend'
# vars and secrets from wrangler.jsonc / `wrangler secret put`, which the app reads from the environment
SETTINGS = ('OPENROUTER_KEY', 'JEV_MODEL', 'NWS_USER_AGENT', 'GOOGLE_CLIENT_ID', 'SNUG_ENV')


async def app(scope, receive, send):
    if scope['type'] in ('http', 'websocket'):
        env = scope.get('env')
        for k in SETTINGS:
            v = getattr(env, k, None) if env is not None else None
            if isinstance(v, str) and v:
                os.environ[k] = v
        path = scope['path']
        if path == PREFIX or path.startswith(PREFIX + '/'):
            scope = {**scope, 'path': path[len(PREFIX):] or '/', 'raw_path': (path[len(PREFIX):] or '/').encode(), 'root_path': ''}
    await api(scope, receive, send)


Default = asgi.entrypoint(app)
