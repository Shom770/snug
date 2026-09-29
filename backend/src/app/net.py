"""One shared HTTP client for the weather, geocoding, Google and Jev calls (on Cloudflare, httpx goes through fetch)."""

import sys

import httpx

# In a Worker httpx goes through fetch, which hands back deflate bodies still compressed; ask for plain ones
WORKER = sys.platform == 'emscripten'
if WORKER:
    # its fetch transport drops User-Agent (browsers forbid setting it), but NWS and Nominatim refuse requests without one
    try:
        from httpx._transports import jsfetch
        jsfetch.HEADERS_TO_IGNORE = ()
    except ImportError:
        pass

_client: httpx.AsyncClient | None = None


def http() -> httpx.AsyncClient:
    global _client
    if _client is None:  # made on first use, not at import, so the Worker snapshot doesn't hold one
        _client = httpx.AsyncClient(headers={'Accept-Encoding': 'identity'} if WORKER else None)
    return _client
