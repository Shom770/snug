export type Condition =
  | 'clear' | 'partly' | 'cloudy' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'storm'
  | 'hail' | 'sleet' | 'snow' | 'blizzard' | 'windy' | 'smoke' | 'heat' | 'humid';

export type Compass = 'N' | 'NNE' | 'NE' | 'ENE' | 'E' | 'ESE' | 'SE' | 'SSE' | 'S' | 'SSW' | 'SW' | 'WSW' | 'W' | 'WNW' | 'NW' | 'NNW';

export interface Outfit {
  top: 'tank' | 'tee' | 'long' | 'sweater';
  outer: 'none' | 'light' | 'hoodie' | 'coat' | 'rain';
  bottom: 'shorts' | 'pants';
  acc: Array<'sunglasses' | 'umbrella' | 'beanie' | 'scarf'>;
}

export interface HourInput {
  condition?: Condition;
  /** cloud cover by layer, %: low and mid clouds hide the sun, high ones are thin cirrus */
  cloudLow?: number | null;
  cloudMid?: number | null;
  cloudHigh?: number | null;
  intensity?: number;
  temp?: number;
  feels?: number;
  wind?: number;
  gust?: number;
  clouds?: number;
  humidity?: number;
}

/** Everything is °F and mph. Only condition/temp are really needed; the rest has sensible defaults. */
export interface WeatherInput extends HourInput {
  lo?: number;
  hi?: number;
  /** degrees the wind comes from (0-359) or a compass point */
  dir?: number | Compass;
  /** local hour 0-23 */
  hour?: number;
  night?: boolean;
  /** up to 12 hours starting now; missing fields fall back to the current values */
  hourly?: HourInput[];
  /** skip the built-in comfort model */
  score?: number;
  /** comfort for each of the next 12 hours (e.g. from the backend); skips the built-in model for the curve */
  curve?: number[];
  /** force a descriptor */
  label?: string;
  date?: string | number | Date;
  outfit?: Outfit;
}

export interface NormalizedWeather {
  condition: Condition;
  hour: number;
  temp: number;
  feels: number;
  lo: number;
  hi: number;
  wind: number;
  gust: number;
  dir: number;
  clouds: number;
  humidity: number;
  intensity: number;
  night: boolean;
  cloudLow: number | null;
  cloudMid: number | null;
  cloudHigh: number | null;
  score?: number;
  curve?: number[];
  label?: string;
  hourly?: HourInput[];
  date?: string | number | Date;
  outfit?: Outfit;
}

export type Band = 'perfect' | 'great' | 'good' | 'meh' | 'rough' | 'bad' | 'awful';
export type Factor = 'none' | 'cold' | 'heat' | 'humid' | 'wind' | 'wet' | 'storm' | 'snow' | 'ice' | 'fog' | 'smoke' | 'gloom' | 'dusk' | 'night';

export interface Description {
  label: string;
  band: Band;
  factor: Factor;
  blurb: string;
  options: string[];
}

export type SceneCond = 'sunny' | 'partly' | 'overcast' | 'rain' | 'snow' | 'heat' | 'sunset' | 'night';
export type Activity = 'stand' | 'picnic' | 'kite' | 'sunset' | 'stargaze';
export type Mood = 'happy' | 'content' | 'meh' | 'grumpy' | 'cold' | 'hot';

/** The shape Snug's renderer consumes. */
export interface ScenePreset {
  name: string;
  icon: string;
  cond: SceneCond;
  precip?: 'drizzle' | 'rain' | 'hail' | 'sleet';
  storm?: number;
  fxk?: 'blizzard' | 'haze';
  temp: number;
  feels: number;
  lo: number;
  hi: number;
  wind: number;
  gust: number;
  dir: number;
  clouds: number;
  score: number;
  label: string;
  start: number;
  curve: number[];
  act: Activity;
  pose: 'stand' | 'sit' | 'kite';
  mood: Mood;
  intensity: number;
  night: boolean;
  noTune: 0 | 1;
  outfit?: Outfit;
  cloudLow?: number | null;
  cloudMid?: number | null;
  cloudHigh?: number | null;
}

export type OutfitFn = (feels: number, cond: SceneCond | string, wind: number) => { o: Outfit };
