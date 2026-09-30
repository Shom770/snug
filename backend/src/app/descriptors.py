"""Descriptor library, same table as frontend/lib/descriptors.ts. Every word says what it is like outside
(sunny, overcast, muggy, gusty...), never just a mood.

Jev decides which factor stands out; the word comes from that factor's cell for the score's band.
Words in a cell are interchangeable, so one is picked per date and the label stays the same all day.
"""

BANDS = [('perfect', 88), ('great', 75), ('good', 60), ('meh', 45), ('rough', 30), ('bad', 15), ('awful', 0)]

# factor -> band -> words
DESCRIPTORS: dict[str, dict[str, list[str]]] = {
    'none': {'perfect': ['sunny', 'clear'], 'great': ['sunny', 'clear'], 'good': ['mild', 'clear'], 'meh': ['mild'], 'rough': ['mild'], 'bad': ['mild'], 'awful': ['mild']},
    'cold': {'perfect': ['crisp'], 'great': ['crisp', 'cool'], 'good': ['cool'], 'meh': ['chilly', 'cool'], 'rough': ['cold', 'chilly'], 'bad': ['bitter', 'freezing'], 'awful': ['frigid', 'freezing']},
    'heat': {'perfect': ['warm', 'sunny'], 'great': ['warm', 'sunny'], 'good': ['warm'], 'meh': ['hot'], 'rough': ['hot'], 'bad': ['scorching', 'sweltering'], 'awful': ['scorching']},
    'humid': {'perfect': ['balmy'], 'great': ['balmy'], 'good': ['humid'], 'meh': ['humid', 'muggy'], 'rough': ['muggy', 'sticky'], 'bad': ['steamy', 'sticky'], 'awful': ['steamy']},
    'wind': {'perfect': ['breezy'], 'great': ['breezy'], 'good': ['breezy', 'windy'], 'meh': ['windy', 'gusty'], 'rough': ['gusty', 'windy'], 'bad': ['howling'], 'awful': ['gale-force']},
    'wet': {'perfect': ['showery'], 'great': ['drizzly'], 'good': ['drizzly'], 'meh': ['damp', 'rainy'], 'rough': ['rainy'], 'bad': ['pouring'], 'awful': ['torrential']},
    'storm': {'perfect': ['thundery'], 'great': ['thundery'], 'good': ['stormy', 'thundery'], 'meh': ['stormy'], 'rough': ['stormy'], 'bad': ['stormy'], 'awful': ['severe storms']},
    'snow': {'perfect': ['snowy'], 'great': ['snowy'], 'good': ['snowy'], 'meh': ['snowy'], 'rough': ['slushy', 'snowy'], 'bad': ['whiteout'], 'awful': ['blizzard']},
    'ice': {'perfect': ['icy'], 'great': ['icy'], 'good': ['icy'], 'meh': ['icy', 'sleety'], 'rough': ['sleety'], 'bad': ['freezing rain'], 'awful': ['freezing rain']},
    'fog': {'perfect': ['misty'], 'great': ['misty'], 'good': ['misty', 'foggy'], 'meh': ['foggy'], 'rough': ['foggy'], 'bad': ['dense fog'], 'awful': ['dense fog']},
    'smoke': {'perfect': ['hazy'], 'great': ['hazy'], 'good': ['hazy'], 'meh': ['hazy', 'smoky'], 'rough': ['smoky'], 'bad': ['smoky'], 'awful': ['smoky']},
    # broken cloud, the sun in and out: 'partly' is about 25-62% of the sky, 'mostly' 62-88% (see describe)
    'partly': {b: ['partly sunny'] for b, _ in BANDS},
    'mostly': {b: ['mostly cloudy'] for b, _ in BANDS},
    'gloom': {'perfect': ['cloudy'], 'great': ['cloudy'], 'good': ['cloudy', 'overcast'], 'meh': ['overcast', 'grey'], 'rough': ['overcast', 'grey'], 'bad': ['dreary'], 'awful': ['dreary']},
    'dusk': {'perfect': ['golden'], 'great': ['golden'], 'good': ['clear']},
    'night': {'perfect': ['starry', 'clear'], 'great': ['clear', 'starry'], 'good': ['clear']},
}


def band_of(score: int) -> str:
    return next(b for b, lo in BANDS if score >= lo)


# share of the sky (low + mid cloud, the kind that hides the sun) where the words change
PARTLY, MOSTLY, OVERCAST = 25, 62, 88


def sky_word(cover: float) -> str:
    """The cloud factor that fits a cover: grey only when the deck is (nearly) complete, otherwise sun and clouds."""
    return 'gloom' if cover >= OVERCAST else 'mostly' if cover >= MOSTLY else 'partly' if cover >= PARTLY else 'none'


def describe(factor: str, score: int, hour: int, night: bool, day: int, cover: float = 0) -> tuple[str, str, str]:
    """(label, band, factor). The sky words follow the actual cover (Jev saying "grey" at half cloud becomes "partly
    sunny"). Pleasant evenings and clear nights get their own words, like describeDay(), but only under open sky."""
    band = band_of(score)
    if factor in ('none', 'gloom'):
        factor = sky_word(cover)
    if factor == 'partly' and night:
        return 'partly cloudy', band, factor
    if factor == 'none' and night and band in DESCRIPTORS['night']:
        factor = 'night'
    elif factor == 'none' and 17 <= hour <= 19 and band in DESCRIPTORS['dusk']:
        factor = 'dusk'
    cell = DESCRIPTORS[factor].get(band) or DESCRIPTORS['none'][band]
    return cell[day % len(cell)], band, factor
