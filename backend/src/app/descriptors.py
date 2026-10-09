"""Descriptor library, same table as frontend/lib/descriptors.ts. Every word says how it *feels* out there (crisp,
sticky, dappled, leaden, unlivable...), not the obvious sky report you can see out the window.

Jev decides which factor stands out; the word comes from that factor's cell for the score's band.
Words in a cell are interchangeable, so one is picked per date and the label stays the same all day.
"""

BANDS = [('perfect', 88), ('great', 75), ('good', 60), ('meh', 45), ('rough', 30), ('bad', 15), ('awful', 0)]

# factor -> band -> words
DESCRIPTORS: dict[str, dict[str, list[str]]] = {
    'none': {'perfect': ['serene', 'idyllic'], 'great': ['easy', 'gentle'], 'good': ['mellow', 'calm'], 'meh': ['middling'], 'rough': ['iffy'], 'bad': ['grim'], 'awful': ['brutal']},
    'cold': {'perfect': ['crisp'], 'great': ['crisp', 'fresh'], 'good': ['brisk', 'nippy'], 'meh': ['raw', 'nippy'], 'rough': ['biting', 'bitter'], 'bad': ['frigid', 'numbing'], 'awful': ['brutal', 'arctic']},
    'heat': {'perfect': ['toasty'], 'great': ['toasty', 'summery'], 'good': ['sun-baked'], 'meh': ['baking'], 'rough': ['scorching', 'sweltering'], 'bad': ['blistering'], 'awful': ['unlivable', 'oven-like']},
    'humid': {'perfect': ['balmy'], 'great': ['balmy', 'tropical'], 'good': ['tropical'], 'meh': ['sticky', 'clammy'], 'rough': ['swampy', 'sticky'], 'bad': ['stifling', 'soupy'], 'awful': ['unlivable', 'suffocating']},
    'wind': {'perfect': ['breezy'], 'great': ['breezy', 'airy'], 'good': ['blustery'], 'meh': ['blustery', 'gusty'], 'rough': ['whipping', 'blustery'], 'bad': ['howling', 'whiplash'], 'awful': ['gale-force']},
    'wet': {'perfect': ['dewy'], 'great': ['dewy', 'spritzy'], 'good': ['spitting', 'drippy'], 'meh': ['damp', 'soggy'], 'rough': ['soggy', 'pelting'], 'bad': ['pelting', 'drenching'], 'awful': ['torrential', 'biblical']},
    'storm': {'perfect': ['electric'], 'great': ['electric'], 'good': ['rumbly'], 'meh': ['rumbly', 'brooding'], 'rough': ['wild'], 'bad': ['ferocious'], 'awful': ['apocalyptic']},
    'snow': {'perfect': ['magical'], 'great': ['powdery', 'magical'], 'good': ['powdery', 'frosty'], 'meh': ['frosty', 'wintry'], 'rough': ['slushy', 'raw'], 'bad': ['whiteout'], 'awful': ['blinding', 'brutal']},
    'ice': {'perfect': ['glassy'], 'great': ['glassy'], 'good': ['glazed'], 'meh': ['slick', 'glazed'], 'rough': ['treacherous', 'slick'], 'bad': ['treacherous'], 'awful': ['perilous']},
    'fog': {'perfect': ['dreamy', 'hushed'], 'great': ['hushed', 'dreamy'], 'good': ['muffled'], 'meh': ['murky'], 'rough': ['murky', 'soupy'], 'bad': ['blinding'], 'awful': ['blinding']},
    'smoke': {'perfect': ['hazy'], 'great': ['hazy'], 'good': ['filmy'], 'meh': ['smoggy'], 'rough': ['acrid'], 'bad': ['choking'], 'awful': ['toxic']},
    'partly': {'perfect': ['dappled'], 'great': ['dappled', 'sun-kissed'], 'good': ['dappled', 'patchy'], 'meh': ['fickle'], 'rough': ['fickle'], 'bad': ['moody'], 'awful': ['moody']},
    'mostly': {'perfect': ['soft', 'muted'], 'great': ['soft', 'muted'], 'good': ['muted', 'mellow'], 'meh': ['dim', 'muted'], 'rough': ['dull'], 'bad': ['gloomy'], 'awful': ['gloomy']},
    'gloom': {'perfect': ['hushed'], 'great': ['soft', 'hushed'], 'good': ['muted', 'pewter'], 'meh': ['drab', 'leaden'], 'rough': ['leaden', 'dreary'], 'bad': ['dreary', 'bleak'], 'awful': ['bleak']},
    'dusk': {'perfect': ['golden'], 'great': ['golden', 'glowy'], 'good': ['glowy']},
    'night': {'perfect': ['starlit', 'velvety'], 'great': ['starlit', 'still'], 'good': ['still']},
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
