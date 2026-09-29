import type { Outfit } from './types';

// Server-safe copy of the outfit rules in engine.js (engine.js touches canvas/DOM).
export function outfitFor(t: number, c: string, w: number): { o: Outfit } {
  const top: Outfit['top'] = t >= 78 ? 'tank' : t >= 62 ? 'tee' : t >= 50 ? 'long' : 'sweater';
  const outer: Outfit['outer'] = c === 'rain' ? 'rain' : t < 40 ? 'coat' : t < 55 ? 'hoodie' : ((t < 68 && (w >= 10 || c === 'partly')) || ((c === 'sunset' || c === 'night') && t < 72)) ? 'light' : 'none';
  const bottom: Outfit['bottom'] = t >= 70 ? 'shorts' : 'pants';
  const acc: Outfit['acc'] = [];
  if (c === 'sunny' || c === 'partly' || c === 'heat') acc.push('sunglasses');
  if (c === 'rain') acc.push('umbrella');
  if (t < 42) acc.push('beanie');
  if (t < 35) acc.push('scarf');
  return { o: { top, outer, bottom, acc } };
}
