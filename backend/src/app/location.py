"""Turn whatever the client sends into a Location: coordinates, or a place name / postal code (Open-Meteo geocoding)."""

import os

import httpx

from .models import Location

# hardcoded until the sign-in flow picks a place
DEFAULT = Location(name='Philadelphia, PA', lat=39.9526, lon=-75.1652)

US_STATES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut',
    'DE': 'Delaware', 'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
    'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
    'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
    'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
}
STATE_CODES = {v.lower(): k for k, v in US_STATES.items()}


class LocationNotFound(Exception):
    pass


def _display(r: dict) -> str:
    admin = r.get('admin1') or ''
    if r.get('country_code') == 'US' and admin.lower() in STATE_CODES:
        return f"{r['name']}, {STATE_CODES[admin.lower()]}"
    return ', '.join(x for x in (r['name'], admin if admin != r['name'] else '', r.get('country', '')) if x)


async def resolve(client: httpx.AsyncClient, q: str | None, lat: float | None, lon: float | None, name: str | None) -> Location:
    """Coordinates win when given (name is just a label for them). Otherwise q is geocoded: "Philadelphia, PA", "Paris", "19104"."""
    if lat is not None and lon is not None:
        return Location(name=name or f'{lat:.3f}, {lon:.3f}', lat=lat, lon=lon)
    if not q or not q.strip():
        return DEFAULT
    place, _, region = (p.strip() for p in q.partition(','))
    res = await client.get('https://geocoding-api.open-meteo.com/v1/search',
                           params={'name': place, 'count': 10, 'language': 'en', 'format': 'json'}, timeout=10)
    res.raise_for_status()
    results = res.json().get('results') or []
    if region:  # "Portland, OR" -> prefer the Oregon one; also matches full state or country names
        want = region.lower()
        full = US_STATES.get(region.upper(), '').lower()
        results = [r for r in results if want in {(r.get('admin1') or '').lower(), (r.get('country') or '').lower(), (r.get('country_code') or '').lower()}
                   or (full and (r.get('admin1') or '').lower() == full)] or results
    if not results:
        raise LocationNotFound(f'no place called {q!r}')
    r = results[0]  # geocoding results come sorted by relevance/population
    return Location(name=_display(r), lat=r['latitude'], lon=r['longitude'])


async def search(client: httpx.AsyncClient, q: str, limit: int = 6) -> list[Location]:
    """Suggestions for a location box: "portl" -> Portland, OR; Portland, ME; ... Postal codes work too."""
    place, _, region = (p.strip() for p in q.partition(','))
    if len(place) < 2:
        return []
    res = await client.get('https://geocoding-api.open-meteo.com/v1/search',
                           params={'name': place, 'count': 20 if region else limit, 'language': 'en', 'format': 'json'}, timeout=10)
    res.raise_for_status()
    results = res.json().get('results') or []
    if region:
        want, full = region.lower(), US_STATES.get(region.upper(), '').lower()
        results = [r for r in results if (r.get('admin1') or '').lower().startswith(want) or (r.get('country') or '').lower().startswith(want)
                   or (r.get('country_code') or '').lower() == want or (full and (r.get('admin1') or '').lower() == full)]
    seen, out = set(), []
    for r in results:
        loc = Location(name=_display(r), lat=r['latitude'], lon=r['longitude'])
        if loc.name not in seen:
            seen.add(loc.name)
            out.append(loc)
    return out[:limit]


async def reverse(client: httpx.AsyncClient, lat: float, lon: float) -> Location:
    """A name for coordinates (for "use my location"): NWS in the US, OpenStreetMap elsewhere."""
    try:
        res = await client.get(f'https://api.weather.gov/points/{lat:.4f},{lon:.4f}', headers={'User-Agent': 'snug-dev (local)'}, timeout=8)
        if res.status_code == 200:
            rel = res.json()['properties']['relativeLocation']['properties']
            return Location(name=f"{rel['city']}, {rel['state']}", lat=lat, lon=lon)
    except httpx.HTTPError:
        pass
    try:
        # OpenStreetMap Nominatim: fine for an occasional "use my location" tap (their policy: identify yourself, ~1 req/s)
        res = await client.get('https://nominatim.openstreetmap.org/reverse', params={'lat': lat, 'lon': lon, 'format': 'json', 'zoom': 10, 'accept-language': 'en'},
                               headers={'User-Agent': os.environ.get('NWS_USER_AGENT') or 'snug-dev (local)'}, timeout=8)
        a = res.json().get('address') or {}
        name = ', '.join(x for x in (a.get('city') or a.get('town') or a.get('village') or a.get('suburb') or a.get('county'), a.get('country')) if x)
        if name:
            return Location(name=name, lat=lat, lon=lon)
    except (httpx.HTTPError, ValueError):
        pass
    return Location(name=f'{lat:.2f}, {lon:.2f}', lat=lat, lon=lon)
