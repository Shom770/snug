import type { Band, Description, Factor, NormalizedWeather } from './types';

// Descriptor library. Every cell is a list of interchangeable words; describeDay() picks one
// deterministically per date so the label stays stable through the day.

export const BANDS: { id: Band; min: number }[] = [
  { id: 'perfect', min: 88 },
  { id: 'great', min: 75 },
  { id: 'good', min: 60 },
  { id: 'meh', min: 45 },
  { id: 'rough', min: 30 },
  { id: 'bad', min: 15 },
  { id: 'awful', min: 0 },
];

// factor -> band -> words
export const DESCRIPTORS: Record<Factor, Partial<Record<Band, string[]>>> = {
  // same table as backend/src/app/descriptors.py: how the day feels, never a weather word
  none: { perfect: ['serene','idyllic'], great: ['easy','gentle'], good: ['mellow','calm'], meh: ['middling','so-so'], rough: ['iffy'], bad: ['grim'], awful: ['brutal'] },
  cold: { perfect: ['crisp'], great: ['crisp','fresh'], good: ['brisk','nippy'], meh: ['raw','nippy'], rough: ['biting','bitter'], bad: ['numbing','frigid'], awful: ['brutal','merciless'] },
  heat: { perfect: ['toasty'], great: ['toasty','lazy'], good: ['languid'], meh: ['sluggish'], rough: ['scorching','sweltering'], bad: ['blistering'], awful: ['unlivable','oven-like'] },
  humid: { perfect: ['velvety'], great: ['lush','velvety'], good: ['heavy'], meh: ['sticky','clammy'], rough: ['swampy','sticky'], bad: ['stifling','soupy'], awful: ['unlivable','suffocating'] },
  wind: { perfect: ['lively'], great: ['lively','spirited'], good: ['restless'], meh: ['restless','unruly'], rough: ['unruly','whiplash'], bad: ['savage'], awful: ['merciless'] },
  wet: { perfect: ['dewy'], great: ['dewy','glistening'], good: ['drippy'], meh: ['soggy','sodden'], rough: ['sodden','dismal'], bad: ['miserable'], awful: ['biblical'] },
  storm: { perfect: ['electric'], great: ['electric'], good: ['brooding'], meh: ['brooding','tense'], rough: ['wild'], bad: ['ferocious'], awful: ['apocalyptic'] },
  snow: { perfect: ['magical'], great: ['storybook','magical'], good: ['storybook'], meh: ['muffled'], rough: ['raw'], bad: ['savage'], awful: ['blinding'] },
  ice: { perfect: ['glassy'], great: ['glassy'], good: ['glittering'], meh: ['slick'], rough: ['treacherous'], bad: ['treacherous'], awful: ['perilous'] },
  fog: { perfect: ['dreamy'], great: ['dreamy','hushed'], good: ['muffled'], meh: ['murky'], rough: ['murky','eerie'], bad: ['eerie'], awful: ['blinding'] },
  smoke: { perfect: ['dusky'], great: ['dusky'], good: ['filmy'], meh: ['gritty'], rough: ['acrid'], bad: ['choking'], awful: ['toxic'] },
  partly: { perfect: ['dappled'], great: ['dappled','playful'], good: ['playful','fickle'], meh: ['fickle'], rough: ['fickle'], bad: ['moody'], awful: ['moody'] },
  mostly: { perfect: ['soft'], great: ['soft','muted'], good: ['muted','mellow'], meh: ['dim','muted'], rough: ['dull'], bad: ['gloomy'], awful: ['gloomy'] },
  gloom: { perfect: ['hushed'], great: ['soft','hushed'], good: ['muted','pewter'], meh: ['drab','leaden'], rough: ['leaden','dreary'], bad: ['dreary','bleak'], awful: ['bleak'] },
  dusk: { perfect: ['golden'], great: ['golden','glowy'], good: ['glowy'] },
  night: { perfect: ['velvety','twinkly'], great: ['twinkly','still'], good: ['still'] },
};

// short, direct, lowercase lines. {tokens} are filled by describeDay().
export const BLURBS: Record<Factor, string[]> = {
  none: ['nice out. best around {best}.', 'good all day. best around {best}.'],
  cold: ['layer up. feels like {feels}.', 'cold out. feels like {feels}.'],
  heat: ['stay shaded. feels like {feels}.', 'hot out. drink water.'],
  humid: ['sticky out. dress light.', 'muggy. feels like {feels}.'],
  wind: ['windy. gusts to {gust}.', 'hold onto your hat. gusts to {gust}.'],
  wet: ['bring a rain jacket.', 'wet out. best around {best}.'],
  storm: ['storms around. stay near cover.', 'thunder likely. plan indoors.'],
  snow: ['snow out. wear boots.', 'snowy. roads may be slow.'],
  ice: ['icy out. watch your step.', 'slick out. go slow.'],
  fog: ['foggy. low visibility.', 'misty morning. clears later.'],
  smoke: ['smoky air. limit time outside.', 'hazy air. keep it short outside.'],
  partly: ['sun and clouds.', 'sun in and out.'],
  mostly: ['mostly cloudy, some sun.', 'clouds with breaks.'],
  gloom: ['grey but dry.', 'cloudy and flat.'],
  dusk: ['nice evening. stay out.'],
  night: ['clear night. good for a walk.'],
};

export const ALL_WORDS: string[] = [...new Set(Object.values(DESCRIPTORS).flatMap(b => Object.values(b).flat() as string[]))].sort();

export function bandOf(score: number): Band {
  return (BANDS.find(b => score >= b.min) || BANDS[BANDS.length - 1]).id;
}

// which single thing is driving how the day feels
export function dominantFactor(w: NormalizedWeather): Factor {
  const f = w.feels, pen: Partial<Record<Factor, number>> = {};
  if (f < 66) pen.cold = (66 - f) * 1.6;
  if (f > 76) pen.heat = (f - 76) * 2.6;
  if (f > 72 && w.humidity > 55) pen.humid = (w.humidity - 55) * 0.6;
  if (w.condition === 'humid') pen.humid = (pen.humid || 0) + 25;
  const wind = Math.max(0, w.wind - 8) * 0.9 + Math.max(0, (w.gust ?? 0) - 25) * 0.3;
  if (wind > 0) pen.wind = wind * 1.2;
  const i = w.intensity ?? 0.5;
  if (w.condition === 'drizzle' || w.condition === 'rain') pen.wet = 12 + i * 30;
  if (w.condition === 'storm') pen.storm = 40 + i * 20;
  if (w.condition === 'snow' || w.condition === 'blizzard') pen.snow = 15 + i * 30 + (w.condition === 'blizzard' ? 20 : 0);
  if (w.condition === 'sleet' || w.condition === 'hail') pen.ice = 30 + i * 20;
  if (w.condition === 'fog') pen.fog = 24;
  if (w.condition === 'smoke') pen.smoke = 45;
  if (w.condition === 'overcast' || w.condition === 'cloudy') pen.gloom = 8;
  const top = (Object.entries(pen) as [Factor, number][]).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 6 ? top[0] : 'none';
}

const seedOf = (w: NormalizedWeather): number => { const d = w.date ? new Date(w.date) : new Date(); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length];

/** % of the sky hiding the sun: low and mid cloud (thin high cirrus lets it through), never more than the total, and in
 * daylight no more than the share of the hour the sun was blocked. Same as the backend's sun_cover(). */
export function sunCover(w: Pick<NormalizedWeather, 'clouds' | 'cloudLow' | 'cloudMid' | 'sunshine'>): number {
  const cover = w.cloudLow != null && w.cloudMid != null ? Math.min(w.clouds, 100 * (1 - (1 - w.cloudLow / 100) * (1 - w.cloudMid / 100))) : w.clouds;
  return w.sunshine != null ? Math.min(cover, 100 - w.sunshine) : cover;
}

export function describeDay(w: NormalizedWeather, score: number, extra: { best?: string } = {}): Description {
  const band = bandOf(score);
  let factor: Factor = dominantFactor(w);
  const hour = w.hour ?? 12;
  // the sky words follow the cover that hides the sun, same as the backend's describe(): grey only for a (nearly)
  // complete deck, sun and clouds in between; evening/night words only under an open sky
  const cover = sunCover(w);
  if (factor === 'none' || factor === 'gloom') factor = cover >= 88 ? 'gloom' : cover >= 62 ? 'mostly' : cover >= 25 ? 'partly' : 'none';
  if (factor === 'partly' && w.night) return { label: 'moody', band, factor, blurb: 'clouds and stars.', options: ['moody'] };
  if (factor === 'none' && w.night && DESCRIPTORS.night[band]) factor = 'night';
  else if (factor === 'none' && w.golden && hour >= 12 && DESCRIPTORS.dusk[band]) factor = 'dusk'; // the evening glow
  const cell = DESCRIPTORS[factor][band] || DESCRIPTORS.none[band] || ['okay'];
  const seed = seedOf(w);
  const unit = '°';
  const blurb = pick(BLURBS[factor] || BLURBS.none, seed)
    .replace('{feels}', Math.round(w.feels) + unit)
    .replace('{gust}', Math.round(w.gust ?? w.wind) + ' mph')
    .replace('{best}', extra.best || 'midday');
  return { label: pick(cell, seed), band, factor, blurb, options: cell };
}
