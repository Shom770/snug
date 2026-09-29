# snug

know how today will feel before you step outside.

## run it

Run from the repo root (`npm run dev` there starts this and the backend together). On its own:

```bash
npm install
npm run dev
npm run typecheck   # optional
```

- `/` is the live app. It opens in the loading world, fetches Philadelphia's weather and Jev's forecast from the backend (`/backend/*` is proxied to it, see `next.config.mjs`), then reveals comfort today, what to wear and the evening check-in. Sign-in is skipped for now.
- `/playground` has an input panel where you type in the weather (condition, intensity, temp, feels like, low/high, wind, gusts, wind direction, clouds, humidity, hour, day/night). The scene, score, curve, outfit and descriptor all update live. Use "copy weather json" to grab the exact input.
- `POST /api/describe` takes the same weather JSON and returns the score, descriptor, blurb, 12-hour curve and outfit, without rendering anything.

## feeding it real weather

```jsx
import Snug from '@/components/Snug'; // client only: load with next/dynamic { ssr: false }
import type { WeatherInput } from '@/lib/types';

<Snug
  weather={{
    condition: 'rain',     // clear partly cloudy overcast fog drizzle rain storm hail sleet snow blizzard windy smoke heat humid
    intensity: 0.7,        // 0-1, only for drizzle/rain/storm/hail/sleet/snow/blizzard. puddles, drifts, flooding scale with it
    temp: 48, feels: 42,   // °F
    lo: 44, hi: 52,        // °F, used to shape the 12-hour curve
    wind: 18, gust: 30,    // mph
    dir: 'SW',             // degrees (0-359) or compass (N, NNE, ... NNW)
    clouds: 100,           // %
    humidity: 80,          // %
    hour: 15,              // 0-23, local
    night: false,          // optional, defaults to hour >= 20 || hour < 6
    hourly: [ /* optional: 12 objects with any of the fields above, starting now */ ],
    score: 34,             // optional: skip the built-in comfort model
    curve: [34, 36, /* … */], // optional: 12 hourly comfort scores (the backend's forecast)
    label: 'raw',          // optional: force a descriptor
  }}
  units="°F"               // or "°C" (display only; input is always °F / mph)
  skipLogin                // go straight to the app
  loading                  // show the loading world; flip to false to reveal the forecast
  city="philadelphia"      // shown on the signs
/>
```

The backend's `GET /weather` already returns this shape (Open-Meteo, WMO codes → condition + intensity).

## comfort model

`lib/weather.ts → comfortScore()`. Starts at 100 and subtracts:

- cold: 1.6 per °F of feels-like below 66
- heat: 2.6 per °F above 76, plus humidity over 55% when feels-like is above 72
- wind: 0.9 per mph over 8, plus 0.3 per mph of gusts over 25
- precip: drizzle 10–20, rain 15–40, storm/hail 30–50, sleet 25–45, snow 8–33, blizzard 25–50 (scaled by intensity)
- fog 6, smoke 35, heavy cloud 4

Without `hourly`, the 12-hour curve follows a normal day/night temperature swing between `lo` and `hi`.

## descriptors

`lib/descriptors.ts` (the backend's `app/descriptors.py` is the one the live app uses). Every word describes what it is like outside, never just a mood. The label is picked from the band the score lands in, and from whichever factor is driving the discomfort the most. Each cell has a few interchangeable words; one is picked per date so the label stays the same all day. `describeDay()` returns `{ label, band, factor, blurb, options }`. `options` is the full cell, if you want to let the user choose or rotate.

| factor | perfect (88+) | great (75+) | good (60+) | meh (45+) | rough (30+) | bad (15+) | awful (0+) |
|---|---|---|---|---|---|---|---|
| none | sunny, clear | sunny, clear | mild, clear | mild | mild | mild | mild |
| cold | crisp | crisp, cool | cool | chilly, cool | cold, chilly | bitter, freezing | frigid, freezing |
| heat | warm, sunny | warm, sunny | warm | hot | hot | scorching, sweltering | scorching |
| humid | balmy | balmy | humid | humid, muggy | muggy, sticky | steamy, sticky | steamy |
| wind | breezy | breezy | breezy, windy | windy, gusty | gusty, windy | howling | gale-force |
| wet | showery | drizzly | drizzly | damp, rainy | rainy | pouring | torrential |
| storm | thundery | thundery | stormy, thundery | stormy | stormy | stormy | severe storms |
| snow | snowy | snowy | snowy | snowy | slushy, snowy | whiteout | blizzard |
| ice | icy | icy | icy | icy, sleety | sleety | freezing rain | freezing rain |
| fog | misty | misty | misty, foggy | foggy | foggy | dense fog | dense fog |
| smoke | hazy | hazy | hazy | hazy, smoky | smoky | smoky | smoky |
| gloom | cloudy | cloudy | cloudy, overcast | overcast, grey | overcast, grey | dreary | dreary |
| dusk | golden | golden | clear | — | — | — | — |
| night | starry, clear | clear, starry | clear | — | — | — | — |

`dusk` is used for pleasant evenings (5–7pm), and `night` for pleasant clear nights.

### blurbs

- **none**: "nice out. best around {best}.", "good all day. best around {best}."
- **cold**: "layer up. feels like {feels}.", "cold out. feels like {feels}."
- **heat**: "stay shaded. feels like {feels}.", "hot out. drink water."
- **humid**: "sticky out. dress light.", "muggy. feels like {feels}."
- **wind**: "windy. gusts to {gust}.", "hold onto your hat. gusts to {gust}."
- **wet**: "bring a rain jacket.", "wet out. best around {best}."
- **storm**: "storms around. stay near cover.", "thunder likely. plan indoors."
- **snow**: "snow out. wear boots.", "snowy. roads may be slow."
- **ice**: "icy out. watch your step.", "slick out. go slow."
- **fog**: "foggy. low visibility.", "misty morning. clears later."
- **smoke**: "smoky air. limit time outside.", "hazy air. keep it short outside."
- **gloom**: "grey but dry.", "cloudy and flat."
- **dusk**: "nice evening. stay out."
- **night**: "clear night. good for a walk."

## files

- `components/Snug.tsx`: the typed component (`SnugProps`) that adds the `weather` prop.
- `components/SnugTemplate.tsx`: the markup, converted from the design file (not type-checked).
- `lib/types.ts`: `WeatherInput`, `ScenePreset`, `Description` and friends.
- `lib/engine.ts` (not type-checked): scene renderer (canvas), sprites, presets, outfit rules, the app logic, and the loading world + reveal (`ld*`).
- `lib/weather.ts`: input normalizing, comfort model, weather → scene preset.
- `lib/descriptors.ts`: descriptor and blurb library.
- `lib/outfit.ts`: outfit rules without DOM access, for the API route.
