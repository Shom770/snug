import { describeDay } from './descriptors';
import type { Condition, Description, HourInput, NormalizedWeather, OutfitFn, SceneCond, ScenePreset, WeatherInput, Activity, Mood } from './types';

export const CONDITIONS: Condition[] = ['clear', 'partly', 'cloudy', 'overcast', 'fog', 'drizzle', 'rain', 'storm', 'hail', 'sleet', 'snow', 'blizzard', 'windy', 'smoke', 'heat', 'humid'];
const SKY_ONLY: Condition[] = ['clear', 'partly', 'cloudy', 'overcast'];
export const HAS_INTENSITY: Condition[] = ['drizzle', 'rain', 'storm', 'hail', 'sleet', 'snow', 'blizzard'];
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

interface SceneDef { cond: SceneCond; icon: string; name: string; clouds: number; precip?: ScenePreset['precip']; storm?: number; fxk?: ScenePreset['fxk'] }

// condition -> scene settings the renderer understands
const SCENE: Record<Condition, SceneDef> = {
  clear: { cond: 'sunny', icon: 'sunny', name: 'Clear', clouds: 5 },
  partly: { cond: 'partly', icon: 'partly', name: 'Partly cloudy', clouds: 40 },
  cloudy: { cond: 'partly', icon: 'overcast', name: 'Mostly cloudy', clouds: 75 }, // dense puffs, the sun in and out
  overcast: { cond: 'overcast', icon: 'overcast', name: 'Overcast', clouds: 95 },
  fog: { cond: 'overcast', icon: 'fog', name: 'Foggy', clouds: 100 },
  drizzle: { cond: 'overcast', precip: 'drizzle', icon: 'drizzle', name: 'Drizzle', clouds: 96 },
  rain: { cond: 'rain', precip: 'rain', icon: 'rain', name: 'Rain', clouds: 100 },
  storm: { cond: 'rain', storm: 1, icon: 'storm', name: 'Thunderstorm', clouds: 100 },
  hail: { cond: 'rain', precip: 'hail', icon: 'hail', name: 'Hail', clouds: 100 },
  sleet: { cond: 'snow', precip: 'sleet', icon: 'sleet', name: 'Sleet', clouds: 100 },
  snow: { cond: 'snow', icon: 'snow', name: 'Snow', clouds: 90 },
  blizzard: { cond: 'snow', fxk: 'blizzard', icon: 'blizzard', name: 'Blizzard', clouds: 100 },
  windy: { cond: 'partly', icon: 'gust', name: 'Windy', clouds: 45 },
  smoke: { cond: 'heat', fxk: 'haze', icon: 'haze', name: 'Smoky', clouds: 10 },
  heat: { cond: 'heat', icon: 'heat', name: 'Hot', clouds: 0 },
  humid: { cond: 'partly', icon: 'humid', name: 'Humid', clouds: 45 },
};
const DEF_INT: Partial<Record<Condition, number>> = { drizzle: 0.25, rain: 0.55, storm: 0.85, hail: 0.6, sleet: 0.5, snow: 0.5, blizzard: 0.95 };
const PRECIP_PEN: Partial<Record<Condition, (i: number) => number>> = {
  drizzle: i => 10 + 10 * i, rain: i => 15 + 25 * i, storm: i => 30 + 20 * i, hail: i => 30 + 20 * i,
  sleet: i => 25 + 20 * i, snow: i => 8 + 25 * i, blizzard: i => 25 + 25 * i,
};

export function dirToDeg(d: number | string | undefined): number {
  if (typeof d === 'number') return ((Math.round(d) % 360) + 360) % 360;
  const i = COMPASS.indexOf(String(d || '').toUpperCase());
  return i < 0 ? 270 : i * 22.5;
}

type ScoreInput = Pick<NormalizedWeather, 'feels' | 'wind' | 'gust' | 'humidity' | 'clouds' | 'condition' | 'intensity'>;

// 1-100. Same weights the descriptors use so the word and number agree.
export function comfortScore(h: ScoreInput): number {
  const f = h.feels, i = h.intensity ?? DEF_INT[h.condition] ?? 0;
  let pen = 0;
  if (f < 66) pen += (66 - f) * 1.6;
  if (f > 76) pen += (f - 76) * 2.6;
  if (f > 72 && h.humidity > 55) pen += (h.humidity - 55) * 0.35;
  pen += Math.max(0, h.wind - 8) * 0.9 + Math.max(0, (h.gust ?? h.wind) - 25) * 0.3;
  pen += PRECIP_PEN[h.condition]?.(i) ?? 0;
  if (h.condition === 'fog') pen += 6;
  if (h.condition === 'smoke') pen += 35;
  if (h.clouds > 85) pen += 4;
  return Math.max(1, Math.min(100, Math.round(100 - pen)));
}

// fill any missing hours with a simple day/night temperature cycle
function hourlyFrom(w: NormalizedWeather): NormalizedWeather[] {
  if (w.hourly && w.hourly.length) {
    const hs = w.hourly;
    return Array.from({ length: 12 }, (_, i) => ({ ...w, ...(hs[Math.min(i, hs.length - 1)] as HourInput) }) as NormalizedWeather);
  }
  const T = (h: number) => w.lo + (w.hi - w.lo) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (h - 4)) / 24));
  const delta = w.temp - T(w.hour), off = w.feels - w.temp;
  return Array.from({ length: 12 }, (_, i) => {
    const hr = (w.hour + i) % 24, t = T(hr) + delta * (1 - i / 12);
    return { ...w, temp: t, feels: t + off, hour: hr };
  });
}

export function normalize(input: WeatherInput = {}): NormalizedWeather {
  const hour = input.hour ?? new Date().getHours();
  const condition: Condition = input.condition && CONDITIONS.includes(input.condition) ? input.condition : 'clear';
  const temp = +(input.temp ?? 68), feels = +(input.feels ?? temp), wind = +(input.wind ?? 5);
  return {
    condition, hour, temp, feels,
    lo: +(input.lo ?? Math.min(temp, feels) - 6), hi: +(input.hi ?? Math.max(temp, feels) + 5),
    wind, gust: +(input.gust ?? Math.round(wind * 1.6)),
    dir: dirToDeg(input.dir ?? 270),
    clouds: +(input.clouds ?? SCENE[condition].clouds),
    humidity: +(input.humidity ?? 50),
    intensity: HAS_INTENSITY.includes(condition) ? +(input.intensity ?? DEF_INT[condition] ?? 0.5) : 0,
    night: input.night ?? (hour >= 20 || hour < 6),
    cloudLow: input.cloudLow ?? null, cloudMid: input.cloudMid ?? null, cloudHigh: input.cloudHigh ?? null,
    score: input.score, curve: input.curve, label: input.label, hourly: input.hourly, date: input.date, outfit: input.outfit,
  };
}

export interface BuildResult { preset: ScenePreset; description: Description; normalized: NormalizedWeather }

// Turn raw weather into the preset object the Snug renderer consumes.
export function buildPreset(input: WeatherInput, outfitFor?: OutfitFn): BuildResult {
  const w = normalize(input);
  const sc = SCENE[w.condition];
  const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)));
  const curve = w.curve?.length ? Array.from({ length: 12 }, (_, i) => clamp(w.curve![Math.min(i, w.curve!.length - 1)])) : hourlyFrom(w).map(comfortScore);
  const score = w.score != null ? clamp(w.score) : curve[0];
  if (w.score != null) curve[0] = score;
  const best = curve.indexOf(Math.max(...curve)), bh = (w.hour + best) % 24;
  const d = describeDay(w, score, { best: (bh % 12 || 12) + (bh < 12 ? 'am' : 'pm') });
  // For sky-only weather the look comes from the clouds that block the sun: low and mid layers (thin high cirrus
  // doesn't). Only a near-complete deck (88%+) is the grey ceiling with no sun; below that the renderer draws that
  // share of the sky as clouds, so mostly cloudy still has gaps and glimpses of sun. Without layer data, total cover.
  let cond: SceneCond = sc.cond;
  if (SKY_ONLY.includes(w.condition)) {
    const opaque = w.cloudLow != null && w.cloudMid != null ? 100 * (1 - (1 - w.cloudLow / 100) * (1 - w.cloudMid / 100)) : w.clouds;
    cond = opaque >= 88 ? 'overcast' : opaque >= 20 || w.clouds >= 40 ? 'partly' : 'sunny';
  }
  const clearish = cond === 'sunny' || cond === 'partly';
  if (clearish && w.night) cond = 'night';
  else if (clearish && w.hour >= 17 && w.hour <= 19) cond = 'sunset';
  let act: Activity = 'stand';
  if (score >= 78 && cond === 'night' && w.clouds < 35) act = 'stargaze';
  else if (score >= 75 && cond === 'sunset') act = 'sunset';
  else if (score >= 82 && clearish && !w.night) act = w.wind >= 12 ? 'kite' : 'picnic';
  const pose: ScenePreset['pose'] = act === 'picnic' || act === 'sunset' || act === 'stargaze' ? 'sit' : act === 'kite' ? 'kite' : 'stand';
  const mood: Mood = w.feels <= 25 && score < 40 ? 'cold' : w.feels >= 92 && score < 45 ? 'hot' : score >= 80 ? 'happy' : score >= 65 ? 'content' : score >= 45 ? 'meh' : 'grumpy';
  const label = w.label || d.label;
  const preset: ScenePreset = {
    name: sc.name, icon: sc.icon, cond, precip: sc.precip, storm: sc.storm, fxk: sc.fxk,
    temp: Math.round(w.temp), feels: Math.round(w.feels), lo: Math.round(w.lo), hi: Math.round(w.hi),
    wind: Math.round(w.wind), gust: Math.round(w.gust), dir: w.dir, clouds: Math.round(w.clouds),
    score, label: label.charAt(0).toUpperCase() + label.slice(1), start: w.hour, curve,
    act, pose, mood, intensity: w.intensity, night: w.night && cond !== 'night', noTune: w.score != null ? 1 : 0,
    cloudLow: w.cloudLow, cloudMid: w.cloudMid, cloudHigh: w.cloudHigh,
  };
  if (w.outfit) preset.outfit = w.outfit;
  else if (outfitFor) preset.outfit = outfitFor(w.feels, cond, w.wind).o;
  return { preset, description: d, normalized: w };
}
