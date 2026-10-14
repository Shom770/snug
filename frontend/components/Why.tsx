'use client';
import { useEffect, useState } from 'react';
import { CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';

export interface WhyHour {
  hour: number; score: number; level: number; probs: number[]; confidence: number; cap: number | null;
  sky: string; temp: number; feels: number; humidity: number; wind: number; gust: number; clouds: number; sun: number; pop: number; precip: number;
}
export interface WhyData { levels: string[]; hours: WhyHour[]; about: string[] }
export interface Earlier { made: string; startHour: number; curve: number[]; hours: WhyHour[] | null }

const MUTED = '#6b6478', HI = '#f2c230';
const hourName = (h: number) => `${h % 12 || 12}${h % 24 < 12 ? 'am' : 'pm'}`;

// the weather that goes in, each with how big a change counts as a real difference between two hours
type Stat = { k: keyof WhyHour; name: string; show: (h: WhyHour, c: boolean) => string; gap: number };
const deg = (f: number, c: boolean) => `${Math.round(c ? (f - 32) * 5 / 9 : f)}°`;
const STATS: Stat[] = [
  { k: 'sky', name: 'sky', show: h => h.sky, gap: 0 },
  { k: 'feels', name: 'feels like', show: (h, c) => deg(h.feels, c), gap: 3 },
  { k: 'temp', name: 'temp', show: (h, c) => deg(h.temp, c), gap: 3 },
  { k: 'humidity', name: 'humidity', show: h => `${h.humidity}%`, gap: 10 },
  { k: 'wind', name: 'wind', show: h => `${h.wind} mph`, gap: 5 },
  { k: 'gust', name: 'gusts', show: h => `${h.gust} mph`, gap: 7 },
  { k: 'clouds', name: 'cloud', show: h => `${h.clouds}%`, gap: 20 },
  { k: 'sun', name: 'sun hidden', show: h => `${h.sun}%`, gap: 20 },
  { k: 'pop', name: 'rain chance', show: h => `${h.pop}%`, gap: 20 },
  { k: 'precip', name: 'rain', show: h => `${h.precip}"`, gap: 0.02 },
];
const differs = (s: Stat, a: WhyHour, b: WhyHour) => (s.gap ? Math.abs((a[s.k] as number) - (b[s.k] as number)) >= s.gap : a[s.k] !== b[s.k]);

/** What went into an hour's comfort score: Jev's vote across the comfort levels and how that becomes the number, any rain
 * cap, the hour's weather against the day's best (or worst) hour, how the forecast before rated it, and what Jev knows
 * about you. */
export default function WhyPanel({ why, earlier, start, units, onClose }: { why: WhyData; earlier: Earlier | null; start: number; units?: '°F' | '°C'; onClose: () => void }) {
  const hs = why.hours, [i, setI] = useState(Math.min(start, hs.length - 1));
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [onClose]);
  const c = units === '°C', h = hs[i];
  const best = hs.reduce((b, x, k) => (x.score > hs[b].score ? k : b), 0), worst = hs.reduce((b, x, k) => (x.score < hs[b].score ? k : b), 0);
  const other = i === best ? worst : best, o = hs[other];
  const raw = Math.round(1 + h.level / 9 * 99);
  // the forecast before this one, if it covered this hour
  const ek = earlier ? (h.hour - earlier.startHour + 24) % 24 : -1;
  const was = earlier && ek < earlier.curve.length ? earlier.curve[ek] : null, wasH = earlier?.hours?.[ek] ?? null;
  const top = h.probs.map((p, k) => [p, k] as const).filter(([p]) => p >= 0.01).reverse();
  const card = { padding: '12px 14px', background: CREAM, clipPath: CP, color: INK } as const;
  const head = { fontSize: 11.5, fontWeight: 800, letterSpacing: 1, color: MUTED } as const;

  return (
    <div role="dialog" aria-modal="true" aria-label="what went into the score" onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(20,14,30,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif", animation: 'snug-fade .2s both' }}>
      <style>{'@keyframes snug-fade{from{opacity:0}to{opacity:1}} @keyframes snug-pop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}'}</style>
      <div style={{ width: 'min(560px, 100%)', maxHeight: '100%', overflowY: 'auto', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.35)', animation: 'snug-pop .3s cubic-bezier(.2,1.3,.4,1) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 14px 14px', background: WOOD_TEX, clipPath: CP }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>WHAT WENT INTO THE SCORE</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{i ? hourName(h.hour) : 'right now'} · {h.score}{i === best ? ' · best' : i === worst ? ' · worst' : ''}</div>
            </div>
            <button onClick={onClose} aria-label="close" style={{ flex: 'none', width: 34, height: 34, background: WOOD, color: LIGHT, fontSize: 18, fontWeight: 800, clipPath: CP }}>×</button>
          </div>

          {/* the 12 hours: tap one */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hs.length}, minmax(0, 1fr))`, gap: 2, padding: '8px 6px 4px', background: 'rgba(30,18,8,0.35)' }}>
            {hs.map((x, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`${hourName(x.hour)}: ${x.score}`} aria-pressed={k === i}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2, height: 74, color: LIGHT }}>
                <span style={{ fontSize: 10.5, fontWeight: 800 }}>{x.score}</span>
                <span style={{ width: '70%', height: Math.max(3, x.score * 0.36), background: k === i ? HI : k === best ? '#9fd38a' : k === worst ? '#e58a7a' : 'rgba(255,241,210,0.55)' }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, opacity: k === i ? 1 : 0.75, whiteSpace: 'nowrap' }}>{hourName(x.hour).replace('m', '')}</span>
              </button>
            ))}
          </div>

          {/* Jev's vote, and how it becomes the number */}
          <div style={card}>
            <div style={head}>JEV&apos;S VOTE ON HOW IT FEELS · {Math.round(h.confidence * 100)}% SURE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7 }}>
              {top.map(([p, k]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 36px', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
                  <span>{why.levels[k]} <span style={{ color: MUTED }}>({k})</span></span>
                  <span style={{ height: 10, background: '#ece3cf' }}><span style={{ display: 'block', width: `${p * 100}%`, height: '100%', background: k >= 7 ? '#7fb06a' : k >= 5 ? '#d9b44a' : '#d77a5e' }} /></span>
                  <span style={{ textAlign: 'right' }}>{Math.round(p * 100)}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>
              averaged: level <b>{h.level.toFixed(2)}</b> of 9 → 1 + {h.level.toFixed(2)} ÷ 9 × 99 = <b>{raw}</b>
              {h.cap != null && <><br />rain cap: an hour you&apos;d be out in rain can&apos;t score above {h.cap} → <b>{h.score}</b></>}
            </div>
          </div>

          {/* the hour's weather, against the best (or worst) hour */}
          <div style={card}>
            <div style={head}>THE WEATHER JEV SAW · VS {hourName(o.hour).toUpperCase()} ({other === best ? 'BEST' : 'WORST'}, {o.score})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '6px 8px', marginTop: 7 }}>
              {STATS.map(s => {
                const d = other !== i && differs(s, h, o);
                return (
                  <div key={s.k} style={{ padding: '3px 6px', background: d ? '#f8e7a6' : 'transparent' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: MUTED }}>{s.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{s.show(h, c)} {other !== i && <span style={{ fontSize: 11, fontWeight: 700, color: MUTED }}>vs {s.show(o, c)}</span>}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: MUTED }}>highlighted: what&apos;s noticeably different from {hourName(o.hour)}.</div>
          </div>

          {/* the forecast before rated this hour differently? */}
          {was != null && (
            <div style={card}>
              <div style={head}>THE FORECAST BEFORE · {new Date(earlier!.made).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}</div>
              <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 700 }}>
                it rated {hourName(h.hour)} <b>{was}</b>; now <b>{h.score}</b>{was === h.score ? ' (no change)' : ` (${h.score > was ? '+' : ''}${h.score - was})`}.
              </div>
              {wasH && was !== h.score && (() => {
                const moved = STATS.filter(s => differs(s, h, wasH));
                return <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                  {moved.length ? <>the weather for that hour moved: {moved.map(s => `${s.name} ${s.show(wasH, c)} → ${s.show(h, c)}`).join(', ')}.</>
                    : <>the weather for that hour barely moved, so this is Jev reading it differently (its vote then: level {wasH.level.toFixed(2)}).</>}
                </div>;
              })()}
              {!wasH && was !== h.score && <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600, color: MUTED }}>each forecast re-reads the newest weather for all 12 hours, so an hour&apos;s score can move between them.</div>}
            </div>
          )}

          {/* what Jev knows about you */}
          <div style={card}>
            <div style={head}>WHAT JEV WAS TOLD ABOUT YOU</div>
            {why.about.length
              ? <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>{why.about.map(a => <li key={a}>{a}</li>)}</ul>
              : <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 600 }}>nothing yet, so this is its read for a typical person. check-ins and adjusting your preferences change that.</div>}
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 600, color: LIGHT, opacity: 0.85, textAlign: 'center', lineHeight: 1.4 }}>
            once an hour snug sends the next 12 hours of weather to Jev in one go, and Jev votes on how each hour feels.
          </div>
          <button onClick={onClose} style={{ padding: 4, background: WOOD, clipPath: CP, alignSelf: 'center' }}>
            <span style={{ display: 'block', padding: '8px 22px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}` }}>close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
