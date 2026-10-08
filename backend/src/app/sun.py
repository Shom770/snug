"""Where the sun is, so the scene's sunset glow and night line up with the real sky at the place.

Golden: the sun within ~6 degrees of the horizon (roughly 45 minutes before sunset until civil dusk, and the same
around sunrise). Night: after civil dusk (sun more than 6 degrees below), when it's actually dark.
"""

import math
from datetime import datetime, timezone

GOLDEN_TOP, CIVIL = 6.0, -6.0


def elevation(lat: float, lon: float, t: datetime) -> float:
    """The sun's elevation in degrees (NOAA solar position approximation). `t` must be timezone-aware."""
    u = t.astimezone(timezone.utc)
    g = 2 * math.pi / 365 * (u.timetuple().tm_yday - 1 + (u.hour - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    ha = math.radians((u.hour * 60 + u.minute + u.second / 60 + eqt + 4 * lon) / 4 - 180)
    la = math.radians(lat)
    cos_zen = math.sin(la) * math.sin(decl) + math.cos(la) * math.cos(decl) * math.cos(ha)
    return 90 - math.degrees(math.acos(max(-1, min(1, cos_zen))))


def phase(lat: float, lon: float, t: datetime | None = None) -> tuple[bool, bool]:
    """(night, golden) right now at the place."""
    e = elevation(lat, lon, t or datetime.now(timezone.utc))
    return e < CIVIL, CIVIL <= e < GOLDEN_TOP
