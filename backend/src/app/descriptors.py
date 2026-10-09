"""Descriptor library, same table as frontend/lib/descriptors.ts. Every word says how the day *feels* (crisp, sticky,
dappled, leaden, unlivable...), never a weather word (no breezy, cloudy, hazy, snowy...).

Jev decides which factor stands out; the word comes from that factor's cell for the score's band.
Words in a cell are interchangeable, so one is picked per date and the label stays the same all day.
"""

BANDS = [('perfect', 88), ('great', 75), ('good', 60), ('meh', 45), ('rough', 30), ('bad', 15), ('awful', 0)]

# factor -> band -> words
DESCRIPTORS: dict[str, dict[str, list[str]]] = {
    'none': {'perfect': ['serene','idyllic'], 'great': ['easy','gentle'], 'good': ['mellow','calm'], 'meh': ['middling','so-so'], 'rough': ['iffy'], 'bad': ['grim'], 'awful': ['brutal']},
    'cold': {'perfect': ['crisp'], 'great': ['crisp','fresh'], 'good': ['brisk','nippy'], 'meh': ['raw','nippy'], 'rough': ['biting','bitter'], 'bad': ['numbing','frigid'], 'awful': ['brutal','merciless']},
    'heat': {'perfect': ['toasty'], 'great': ['toasty','lazy'], 'good': ['languid'], 'meh': ['sluggish'], 'rough': ['scorching','sweltering'], 'bad': ['blistering'], 'awful': ['unlivable','oven-like']},
    'humid': {'perfect': ['velvety'], 'great': ['lush','velvety'], 'good': ['heavy'], 'meh': ['sticky','clammy'], 'rough': ['swampy','sticky'], 'bad': ['stifling','soupy'], 'awful': ['unlivable','suffocating']},
    'wind': {'perfect': ['lively'], 'great': ['lively','spirited'], 'good': ['restless'], 'meh': ['restless','unruly'], 'rough': ['unruly','whiplash'], 'bad': ['savage'], 'awful': ['merciless']},
    'wet': {'perfect': ['dewy'], 'great': ['dewy','glistening'], 'good': ['drippy'], 'meh': ['soggy','sodden'], 'rough': ['sodden','dismal'], 'bad': ['miserable'], 'awful': ['biblical']},
    'storm': {'perfect': ['electric'], 'great': ['electric'], 'good': ['brooding'], 'meh': ['brooding','tense'], 'rough': ['wild'], 'bad': ['ferocious'], 'awful': ['apocalyptic']},
    'snow': {'perfect': ['magical'], 'great': ['storybook','magical'], 'good': ['storybook'], 'meh': ['muffled'], 'rough': ['raw'], 'bad': ['savage'], 'awful': ['blinding']},
    'ice': {'perfect': ['glassy'], 'great': ['glassy'], 'good': ['glittering'], 'meh': ['slick'], 'rough': ['treacherous'], 'bad': ['treacherous'], 'awful': ['perilous']},
    'fog': {'perfect': ['dreamy'], 'great': ['dreamy','hushed'], 'good': ['muffled'], 'meh': ['murky'], 'rough': ['murky','eerie'], 'bad': ['eerie'], 'awful': ['blinding']},
    'smoke': {'perfect': ['dusky'], 'great': ['dusky'], 'good': ['filmy'], 'meh': ['gritty'], 'rough': ['acrid'], 'bad': ['choking'], 'awful': ['toxic']},
    'partly': {'perfect': ['dappled'], 'great': ['dappled','playful'], 'good': ['playful','fickle'], 'meh': ['fickle'], 'rough': ['fickle'], 'bad': ['moody'], 'awful': ['moody']},
    'mostly': {'perfect': ['soft'], 'great': ['soft','muted'], 'good': ['muted','mellow'], 'meh': ['dim','muted'], 'rough': ['dull'], 'bad': ['gloomy'], 'awful': ['gloomy']},
    'gloom': {'perfect': ['hushed'], 'great': ['soft','hushed'], 'good': ['muted','pewter'], 'meh': ['drab','leaden'], 'rough': ['leaden','dreary'], 'bad': ['dreary','bleak'], 'awful': ['bleak']},
    'dusk': {'perfect': ['golden'], 'great': ['golden','glowy'], 'good': ['glowy']},
    'night': {'perfect': ['velvety','twinkly'], 'great': ['twinkly','still'], 'good': ['still']},
}


def band_of(score: int) -> str:
    return next(b for b, lo in BANDS if score >= lo)


# share of the sky (low + mid cloud, the kind that hides the sun) where the words change
PARTLY, MOSTLY, OVERCAST = 25, 62, 88


def sky_word(cover: float) -> str:
    """The cloud factor that fits a cover: grey only when the deck is (nearly) complete, otherwise sun and clouds."""
    return 'gloom' if cover >= OVERCAST else 'mostly' if cover >= MOSTLY else 'partly' if cover >= PARTLY else 'none'


def describe(factor: str, score: int, hour: int, night: bool, day: int, cover: float = 0, golden: bool = False) -> tuple[str, str, str]:
    """(label, band, factor). The sky words follow the actual cover (Jev saying "grey" at half cloud becomes "partly
    sunny"). Pleasant evenings and clear nights get their own words, like describeDay(), but only under open sky."""
    band = band_of(score)
    if factor in ('none', 'gloom'):
        factor = sky_word(cover)
    if factor == 'partly' and night:
        return 'moody', band, factor  # broken cloud after dark
    if factor == 'none' and night and band in DESCRIPTORS['night']:
        factor = 'night'
    elif factor == 'none' and golden and hour >= 12 and band in DESCRIPTORS['dusk']:  # the evening glow, not dawn
        factor = 'dusk'
    cell = DESCRIPTORS[factor].get(band) or DESCRIPTORS['none'][band]
    return cell[day % len(cell)], band, factor
