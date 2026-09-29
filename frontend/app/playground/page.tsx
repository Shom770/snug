'use client';
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { CONDITIONS, HAS_INTENSITY, buildPreset } from '../../lib/weather';
import { ALL_WORDS } from '../../lib/descriptors';
import { outfitFor } from '../../lib/outfit';
import type { Condition, WeatherInput } from '../../lib/types';
import type { ChangeEvent, ReactNode } from 'react';

const Snug = dynamic(() => import('../../components/Snug'), { ssr: false });
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const INK = '#27233a', CREAM = '#fbf3e2', WOOD = '#4a2e16';
const CP = 'polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))';

type Form = { condition: Condition; intensity: number; temp: number; feels: number; lo: number; hi: number; wind: number; gust: number; dir: number; clouds: number; humidity: number; hour: number; time: 'auto' | 'day' | 'night'; label: string; scoreOn: boolean; score: number; layersOn: boolean; low: number; mid: number; high: number };
const START: Form = { condition: 'partly', intensity: 0.5, temp: 68, feels: 67, lo: 58, hi: 74, wind: 8, gust: 14, dir: 270, clouds: 40, humidity: 55, hour: 12, time: 'auto', label: '', scoreOn: false, score: 70, layersOn: false, low: 20, mid: 10, high: 40 };

function Row({ label, value, children }: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#5a5468' }}>
        <span>{label}</span>{value != null && <span style={{ color: INK }}>{value}</span>}
      </span>
      {children}
    </label>
  );
}
const field: React.CSSProperties = { height: 34, padding: '0 10px', border: `2px solid ${INK}`, borderRadius: 0, background: '#fff', font: 'inherit', fontSize: 14, fontWeight: 700, color: INK };

export default function Playground() {
  const [f, setF] = useState<Form>(START);
  const [open, setOpen] = useState(true);
  const [units, setUnits] = useState<'°F' | '°C'>('°F');
  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    setF(p => ({ ...p, [k]: t.type === 'checkbox' ? t.checked : t.type === 'range' || t.type === 'number' ? +t.value : t.value }));
  };

  const weather = useMemo(() => {
    const w: WeatherInput = { condition: f.condition, temp: f.temp, feels: f.feels, lo: f.lo, hi: f.hi, wind: f.wind, gust: f.gust, dir: f.dir, clouds: f.clouds, humidity: f.humidity, hour: f.hour };
    if (HAS_INTENSITY.includes(f.condition)) w.intensity = f.intensity;
    if (f.time !== 'auto') w.night = f.time === 'night';
    if (f.label) w.label = f.label;
    if (f.scoreOn) w.score = f.score;
    if (f.layersOn) { w.cloudLow = f.low; w.cloudMid = f.mid; w.cloudHigh = f.high; }
    return w;
  }, [f]);
  const out = useMemo(() => buildPreset(weather, outfitFor), [weather]);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(JSON.stringify(weather, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1200); };

  return (
    <div>
      <Snug weather={weather} units={units} skipLogin />
      <div style={{ position: 'fixed', left: 16, top: 16, zIndex: 100, width: open ? 320 : 'auto', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', padding: 4, background: WOOD, clipPath: CP, fontFamily: "'Rethink Sans',sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: CREAM, color: INK, clipPath: CP }}>
          <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 14px', fontSize: 14, fontWeight: 800, textAlign: 'left' }}>
            <span>weather input</span><span>{open ? '–' : '+'}</span>
          </button>
          {open && (
            <div style={{ overflowY: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 10, background: '#fff', border: `2px solid ${INK}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800 }}>{out.preset.score}</span>
                  <span style={{ fontSize: 16, fontWeight: 800 }}>{out.preset.label.toLowerCase()}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#5a5468' }}>{out.description.factor} · {out.description.band}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{out.description.blurb}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {out.description.options.map(o => (
                    <button key={o} onClick={() => setF(p => ({ ...p, label: p.label === o ? '' : o }))} style={{ padding: '2px 8px', fontSize: 12, fontWeight: 700, background: f.label === o ? INK : '#efe4cc', color: f.label === o ? CREAM : INK }}>{o}</button>
                  ))}
                </div>
              </div>

              <Row label="weather">
                <select value={f.condition} onChange={set('condition')} style={field}>{CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </Row>
              {HAS_INTENSITY.includes(f.condition) && (
                <Row label="intensity" value={Math.round(f.intensity * 100) + '%'}><input type="range" min="0" max="1" step="0.01" value={f.intensity} onChange={set('intensity')} /></Row>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Row label="temp °F"><input type="number" value={f.temp} onChange={set('temp')} style={field} /></Row>
                <Row label="feels like °F"><input type="number" value={f.feels} onChange={set('feels')} style={field} /></Row>
                <Row label="low °F"><input type="number" value={f.lo} onChange={set('lo')} style={field} /></Row>
                <Row label="high °F"><input type="number" value={f.hi} onChange={set('hi')} style={field} /></Row>
              </div>
              <Row label="wind" value={f.wind + ' mph'}><input type="range" min="0" max="80" value={f.wind} onChange={set('wind')} /></Row>
              <Row label="gusts" value={f.gust + ' mph'}><input type="range" min="0" max="100" value={f.gust} onChange={set('gust')} /></Row>
              <Row label="wind from" value={COMPASS[Math.round(f.dir / 22.5) % 16] + ' · ' + f.dir + '°'}><input type="range" min="0" max="359" value={f.dir} onChange={set('dir')} /></Row>
              <Row label="cloud cover" value={f.clouds + '%'}><input type="range" min="0" max="100" value={f.clouds} onChange={set('clouds')} /></Row>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={f.layersOn} onChange={set('layersOn')} /> cloud layers (low/mid hide the sun, high = cirrus)
              </label>
              {f.layersOn && (<>
                <Row label="low clouds" value={f.low + '%'}><input type="range" min="0" max="100" value={f.low} onChange={set('low')} /></Row>
                <Row label="mid clouds" value={f.mid + '%'}><input type="range" min="0" max="100" value={f.mid} onChange={set('mid')} /></Row>
                <Row label="high clouds" value={f.high + '%'}><input type="range" min="0" max="100" value={f.high} onChange={set('high')} /></Row>
              </>)}
              <Row label="humidity" value={f.humidity + '%'}><input type="range" min="0" max="100" value={f.humidity} onChange={set('humidity')} /></Row>
              <Row label="hour" value={(f.hour % 12 || 12) + (f.hour < 12 ? 'am' : 'pm')}><input type="range" min="0" max="23" value={f.hour} onChange={set('hour')} /></Row>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Row label="time of day">
                  <select value={f.time} onChange={set('time')} style={field}><option value="auto">from hour</option><option value="day">day</option><option value="night">night</option></select>
                </Row>
                <Row label="units">
                  <select value={units} onChange={e => setUnits(e.target.value as '°F' | '°C')} style={field}><option>°F</option><option>°C</option></select>
                </Row>
              </div>
              <Row label="descriptor">
                <select value={f.label} onChange={set('label')} style={field}><option value="">auto</option>{ALL_WORDS.map(w => <option key={w} value={w}>{w}</option>)}</select>
              </Row>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={f.scoreOn} onChange={set('scoreOn')} /> override score
              </label>
              {f.scoreOn && <Row label="score" value={f.score}><input type="range" min="1" max="100" value={f.score} onChange={set('score')} /></Row>}
              <button onClick={copy} style={{ height: 40, background: INK, color: CREAM, fontSize: 14, fontWeight: 800, clipPath: CP }}>{copied ? 'copied' : 'copy weather json'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
