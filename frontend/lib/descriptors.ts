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
  none: { perfect: ['sunny', 'clear'], great: ['sunny', 'clear'], good: ['mild', 'clear'], meh: ['mild'], rough: ['mild'], bad: ['mild'], awful: ['mild'] },
  cold: { perfect: ['crisp'], great: ['crisp', 'cool'], good: ['cool'], meh: ['chilly', 'cool'], rough: ['cold', 'chilly'], bad: ['bitter', 'freezing'], awful: ['frigid', 'freezing'] },
  heat: { perfect: ['warm', 'sunny'], great: ['warm', 'sunny'], good: ['warm'], meh: ['hot'], rough: ['hot'], bad: ['scorching', 'sweltering'], awful: ['scorching'] },
  humid: { perfect: ['balmy'], great: ['balmy'], good: ['humid'], meh: ['humid', 'muggy'], rough: ['muggy', 'sticky'], bad: ['steamy', 'sticky'], awful: ['steamy'] },
  wind: { perfect: ['breezy'], great: ['breezy'], good: ['breezy', 'windy'], meh: ['windy', 'gusty'], rough: ['gusty', 'windy'], bad: ['howling'], awful: ['gale-force'] },
  wet: { perfect: ['showery'], great: ['drizzly'], good: ['drizzly'], meh: ['damp', 'rainy'], rough: ['rainy'], bad: ['pouring'], awful: ['torrential'] },
  storm: { perfect: ['thundery'], great: ['thundery'], good: ['stormy', 'thundery'], meh: ['stormy'], rough: ['stormy'], bad: ['stormy'], awful: ['severe storms'] },
  snow: { perfect: ['snowy'], great: ['snowy'], good: ['snowy'], meh: ['snowy'], rough: ['slushy', 'snowy'], bad: ['whiteout'], awful: ['blizzard'] },
  ice: { perfect: ['icy'], great: ['icy'], good: ['icy'], meh: ['icy', 'sleety'], rough: ['sleety'], bad: ['freezing rain'], awful: ['freezing rain'] },
  fog: { perfect: ['misty'], great: ['misty'], good: ['misty', 'foggy'], meh: ['foggy'], rough: ['foggy'], bad: ['dense fog'], awful: ['dense fog'] },
  smoke: { perfect: ['hazy'], great: ['hazy'], good: ['hazy'], meh: ['hazy', 'smoky'], rough: ['smoky'], bad: ['smoky'], awful: ['smoky'] },
  gloom: { perfect: ['cloudy'], great: ['cloudy'], good: ['cloudy', 'overcast'], meh: ['overcast', 'grey'], rough: ['overcast', 'grey'], bad: ['dreary'], awful: ['dreary'] },
  dusk: { perfect: ['golden'], great: ['golden'], good: ['clear'] },
  night: { perfect: ['starry', 'clear'], great: ['clear', 'starry'], good: ['clear'] },
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

export function describeDay(w: NormalizedWeather, score: number, extra: { best?: string } = {}): Description {
  const band = bandOf(score);
  let factor: Factor = dominantFactor(w);
  const hour = w.hour ?? 12;
  // evening/night words only under an open sky (low and mid clouds under 70%)
  const open = (w.cloudLow != null && w.cloudMid != null ? Math.max(w.cloudLow, w.cloudMid) : w.clouds) < 70;
  if (factor === 'none' && !open) factor = 'gloom';
  else if (factor === 'none' && w.night && DESCRIPTORS.night[band]) factor = 'night';
  else if (factor === 'none' && hour >= 17 && hour <= 19 && DESCRIPTORS.dusk[band]) factor = 'dusk';
  const cell = DESCRIPTORS[factor][band] || DESCRIPTORS.none[band] || ['okay'];
  const seed = seedOf(w);
  const unit = '°';
  const blurb = pick(BLURBS[factor] || BLURBS.none, seed)
    .replace('{feels}', Math.round(w.feels) + unit)
    .replace('{gust}', Math.round(w.gust ?? w.wind) + ' mph')
    .replace('{best}', extra.best || 'midday');
  return { label: pick(cell, seed), band, factor, blurb, options: cell };
}
