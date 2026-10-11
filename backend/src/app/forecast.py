"""Weather -> one Jev call -> comfort curve, outfit and descriptor.

Kept to a single call with a compact table as the state; input tokens are dominated by the 12 hourly
score questions, so their criteria stay one word each.
"""

import time
from datetime import datetime
from statistics import mean

import httpx

from . import jev
from .descriptors import describe
from .db import Row
from .models import Forecast, HourWeather, Outfit, Weather
from .weather import sun_cover

# 10 levels (Jev's max). The expected level 0..9 maps onto a 1-100 comfort score.
COMFORT = ['dangerous', 'miserable', 'bad', 'rough', 'unpleasant', 'meh', 'okay', 'comfortable', 'pleasant', 'perfect']

# How warmly to dress, as one graded score (Jev's choice questions kept landing on "t-shirt" and "light jacket" even at
# 40°F; a score spreads properly, like the comfort curve). Each level is a top and an outer layer.
# The rough feels-like ranges anchor it; the person's check-ins can still lean it warmer or lighter.
WARMTH = [('tank top (feels 88°F+)', 'tank', 'none'), ('t-shirt (74-88°F)', 'tee', 'none'),
          ('t-shirt + light layer (67-74°F)', 'tee', 'layer'), ('long sleeves (61-67°F)', 'long', 'none'),
          ('long sleeves + light layer (54-61°F)', 'long', 'layer'), ('sweater (48-54°F)', 'sweater', 'none'),
          ('sweater + light layer (42-48°F)', 'sweater', 'layer'), ('sweater + winter coat (30-42°F)', 'sweater', 'coat'),
          ('heavy winter coat (15-30°F)', 'sweater', 'coat'), ('bundled up (below 15°F)', 'sweater', 'coat')]
RAIN_GEAR = ('Will they want a rain jacket today?', "yes, rain is likely while they're out and it isn't hot", 'no, it stays dry, or it is too hot for one')
BOTTOMS = {'shorts': 'shorts', 'pants': 'pants'}
# a bare "bring X?" sits on the fence (~0.5); spelling out what yes/no mean gives Jev something to decide on
ACCESSORIES = {
    'sunglasses': ('Will they want sunglasses today?', "yes, it's sunny and bright", 'no, not much sun'),
    'umbrella': ('Will they need an umbrella today?', 'yes, rain is likely', 'no, rain is unlikely'),
    'beanie': ('Will they want a beanie today?', "yes, it's cold enough", 'no, not cold enough'),
    'scarf': ('Will they want a scarf today?', "yes, it's cold enough", 'no, not cold enough'),
}
# the hints keep Jev from calling a cool damp day "humid"
FACTORS = {
    'none': 'nothing stands out', 'cold': 'cold (feels below ~60°F)', 'heat': 'heat (feels above ~80°F)',
    'humid': 'muggy, sticky air (feels above ~78°F and humid)', 'wind': 'strong wind', 'wet': 'rain or drizzle', 'storm': 'thunderstorms',
    'snow': 'snow', 'ice': 'ice, sleet or hail', 'fog': 'fog', 'smoke': 'smoke or haze', 'gloom': 'grey, fully overcast skies (no sun at all)',
}
HAS_INTENSITY = {'drizzle', 'rain', 'storm', 'hail', 'sleet', 'snow', 'blizzard'}
# rain boots only for real puddles: this much rain (inches) over the next hours they're out, or heavy rain right now
BOOTS_IN, BOOTS_HOURS = 0.2, 8
WET = {'drizzle', 'rain', 'storm', 'hail', 'sleet'}
# a rain jacket or umbrella only when it's raining now or about to (within the hour); for a whole day's outfit
# (tomorrow's chair), rain any time they're out. Jev says yes to them on dry days with a cloud about, so this is a rule
RAIN_POP, RAIN_IN, RAIN_HOURS = 50, 0.01, 2


def rains(w: Weather) -> bool:
    """Rain worth a jacket or umbrella: falling now, or likely and measurable within the hour (all day for a day's outfit)."""
    if not w.day and w.condition in WET:
        return True
    hours = w.hourly[:BOOTS_HOURS] if w.day else w.hourly[:RAIN_HOURS]
    if w.day:
        return max(h.pop for h in hours) >= RAIN_POP and sum(h.precip for h in hours) >= 0.05
    return any(h.pop >= RAIN_POP and (h.precip >= RAIN_IN or h.condition in WET) for h in hours)


def no_rain_gear(o: Outfit, w: Weather) -> Outfit:
    """Take the rain jacket and umbrella back out when it isn't going to rain (a jacket's still right if it's cool)."""
    if rains(w):
        return o
    outer = o.outer if o.outer != 'rain' else ('light' if w.feels < 61 else 'none')  # what the warmth bands would have had
    return o.model_copy(update={'outer': outer, 'acc': [a for a in o.acc if a != 'umbrella'], 'boots': False})


def _state(w: Weather) -> str:
    now = datetime.fromisoformat(w.time)
    rows = '\n'.join(
        f"{h.hour}:00 {(('light ' if h.intensity < 0.35 else 'heavy ' if h.intensity >= 0.7 else '') if h.condition in HAS_INTENSITY else '') + h.condition} "
        f"{round(h.temp)} {round(h.feels)} {round(h.humidity)} {round(h.wind)} {round(h.gust)} {round(h.clouds)} {round(sun_cover(h))} {round(h.pop)} {h.precip:g}"
        for h in w.hourly
    )
    return (f"{w.city}, {now:%a %b %-d}, {'night' if w.night else 'daytime'}. Low {round(w.lo)}°F, high {round(w.hi)}°F.\n"
            f'hour sky temp°F feels°F humidity% wind_mph gust_mph cloud% sun_blocked% rain_chance% precip_in\n{rows}\n{JUDGING}')


# how to score comfort: decisively, as someone actually out walking in it (Jev was calling a whole day of steady rain at a
# mild temperature "okay")
JUDGING = ('How to judge comfort: picture actually walking around outside in it, not looking at it from a window. Be decisive and '
           'use the whole scale. Steady rain (0.05+ in an hour) is unpleasant however mild it is: no better than "rough". Heavy rain '
           'or thunderstorms are "bad" or worse, and rain with wind or a chill (feels under 55°F) is worse again. Liking "a sprinkle" '
           'means a passing drizzle, not a rainy day. A dry, mild hour near what they like is "pleasant" or "perfect".')


def _cap(h: HourWeather) -> int:
    """The most comfortable an hour can be, whatever else: rain you're out in is never a decent hour."""
    raw = h.condition in ('drizzle', 'rain', 'sleet', 'hail', 'storm') and (h.precip >= 0.05 or h.intensity >= 0.5)
    if h.condition in ('storm', 'hail') and (h.precip >= 0.02 or h.intensity >= 0.4):
        return 25
    if raw:
        return 28 if h.feels < 55 or h.wind >= 15 else 35
    if h.condition == 'drizzle' or (h.condition == 'rain' and h.precip >= 0.01):
        return 55
    return 100


def _history(rows: list[tuple[Row, Row]]) -> str:
    """The person's recent check-ins as a small table, so Jev can lean the answers toward how they actually feel."""
    if not rows:
        return ''
    lines = []
    for c, f in reversed(rows):
        w, o = f.weather, f.outfit
        outfit = o['top'] + ('+' + o['outer'] if o['outer'] != 'none' else '') + '/' + o['bottom']
        lines.append(f"{datetime.fromisoformat(c.local_date):%b %-d} {w['condition']} {round(w['feels'])} {round(w['wind'])} {round(w['humidity'])} "
                     f"{f.score} {c.felt} {outfit} {(c.fit or '-').replace(' ', '_')}")
    # spell out which way to lean; left to infer it from the table, Jev sometimes reads "too warm" as "worse"
    delta = round(mean(c.felt - f.score for c, f in rows))
    advice = [f'rate comfort about {abs(delta)} {"higher" if delta > 0 else "lower"} for them than for a typical person'] if abs(delta) >= 5 else []
    fits = [c.fit for c, _ in rows if c.fit]
    cold, warm = fits.count('too cold'), fits.count('too warm')
    if cold > warm:
        advice.append(f'they ran cold in their outfit {cold} of {len(fits)} times, so dress them warmer')
    elif warm > cold:
        advice.append(f'they ran warm in their outfit {warm} of {len(fits)} times, so dress them lighter')
    return ('\nAnswer for one person. Their past check-ins (our forecast vs how it actually felt to them, 1-100; how the outfit worked):\n'
            'date sky feels°F wind_mph humidity% forecast felt outfit fit\n' + '\n'.join(lines) +
            (f"\nFor this person: {'; '.join(advice)}." if advice else ''))


# The personal signal is a queue of the last QUEUE things we learned about someone. The onboarding picks fill it
# at first; every evening check-in pushes one of their slots out, so after QUEUE check-ins only real days count.
QUEUE = 6


def _tuning(t: dict | None, checkins: int = 0) -> str:
    """What they told us in onboarding ("which day feels better"), weighted by how much of the queue it still holds."""
    left = QUEUE - min(QUEUE, checkins)
    if not t or not left:
        return ''
    bits = [f"they're happiest around {round(t['ideal'])}°F"]
    if t['windAvoid'] > 3:
        bits.append('wind bothers them more than most')
    elif t['windAvoid'] < -3:
        bits.append("they don't mind wind")
    if t['cloudAvoid'] > 15:
        bits.append('grey skies bring them down')
    elif t['cloudAvoid'] < -15:
        bits.append("they're happy under clouds")
    weight = '' if left == QUEUE else f' (from their signup quiz; now {left} of {QUEUE} signals, their check-ins below count for the rest)'
    return f"\nThis person told us{weight}: {'; '.join(bits)}."


async def forecast(client: httpx.AsyncClient, w: Weather, history: list[tuple[Row, Row]] | None = None,
                   tuning: dict | None = None, tuned: str = '') -> Forecast:
    t0 = time.perf_counter()
    qs: dict[str, dict] = {
        f'h{i}': jev.score_q(f'How comfortable is it outside at {h.hour}:00, dressed sensibly?', COMFORT)
        for i, h in enumerate(w.hourly)
    }
    qs['warmth'] = jev.score_q('How warmly should they dress to be comfortable outside today, for the hours they are out?', [lv for lv, _, _ in WARMTH])
    qs['rain'] = jev.noul_q(*RAIN_GEAR)
    qs['bottom'] = jev.choice_q('Bottoms today', BOTTOMS)
    for k, (q, yes, no) in ACCESSORIES.items():
        qs[k] = jev.noul_q(q, yes, no)
    qs['factor'] = jev.choice_q('What stands out most about how it feels outside today?', FACTORS)
    # about this person: signup quiz (fading), what they tuned directly (always counts), then real days
    model, a = await jev.decide(client, _state(w) + _tuning(tuning, len(history or [])) + tuned + _history(history or []), qs)

    top = len(COMFORT) - 1
    curve = [max(1, min(100, _cap(h), round(1 + jev.score(a[f'h{i}']) / top * 99))) for i, h in enumerate(w.hourly)]
    curve += [curve[-1]] * (12 - len(curve))
    _, top_, layer = WARMTH[max(0, min(len(WARMTH) - 1, round(jev.score(a['warmth']))))]
    if jev.yes(a.get('rain')) and layer != 'coat' and rains(w):
        layer = 'rain'
    elif layer == 'layer':  # a hoodie on a dry, calm day; a jacket when it's windy or damp
        dry = max(h.pop for h in w.hourly[:6]) < 30 and w.wind < 15 and w.gust < 25
        layer = 'hoodie' if dry else 'light'
    rain_in = sum(h.precip for h in w.hourly[:BOOTS_HOURS] if h.condition in WET)
    outfit = Outfit(
        top=top_,
        outer=layer,
        bottom=jev.choice(a.get('bottom'), BOTTOMS, 'pants'),
        # it's dark out now; sunglasses would be for tomorrow morning at best
        # no sunglasses after dark, and no umbrella when what's falling is snow
        acc=[k for k in ACCESSORIES if jev.yes(a.get(k)) and not (k == 'sunglasses' and w.night)
             and not (k == 'umbrella' and (w.condition in ('snow', 'blizzard') or not rains(w)))],
        boots=rains(w) and (rain_in >= BOOTS_IN or (w.condition in ('rain', 'storm') and w.intensity >= 0.55)),
    )
    # the sun-hiding cloud, as the scene draws it
    label, band, factor = describe(jev.choice(a.get('factor'), FACTORS, 'none'), curve[0], w.hour, w.night,
                                   datetime.fromisoformat(w.time).toordinal(), cover=sun_cover(w), golden=w.golden)
    return Forecast(score=curve[0], curve=curve, startHour=w.hour, label=label, band=band, factor=factor,
                    outfit=outfit, model=model, ms=round((time.perf_counter() - t0) * 1000), personalized=bool(history or tuning or tuned))
