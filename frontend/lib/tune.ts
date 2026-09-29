// Adjust-my-preferences: the backend (app/tuning.py) picks each question adaptively; this is just the shapes and
// how an option should look as a little scene.

export interface Option { feels: number; wind: number; clouds: number; humidity: number; rain: number }
export type Dim = 'temp' | 'wind' | 'clouds' | 'humidity' | 'rain';
export interface Pair { dim: Dim; a: Option; b: Option }
export interface Belief { dim: Dim; mean: number; lo: number; hi: number; picks: number; strength: 'slight' | 'some' | 'strong'; text: string }
export interface Summary { picks: number; beliefs: Belief[] }

/** what the mini scene should look like for an option */
export function sceneOf(o: Option): { cond: string; precip: string; int: number } {
  if (o.rain >= 0.5) return { cond: 'rain', precip: 'rain', int: o.rain };
  if (o.rain >= 0.15) return { cond: 'overcast', precip: 'drizzle', int: o.rain };
  if (o.feels >= 88 && o.clouds < 40) return { cond: 'heat', precip: '', int: 0 };
  return { cond: o.clouds < 25 ? 'sunny' : o.clouds < 70 ? 'partly' : 'overcast', precip: '', int: 0 };
}
