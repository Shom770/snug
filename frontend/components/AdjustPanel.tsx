'use client';
import { useEffect, useState } from 'react';
import { api, CP, CREAM, INK, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import MiniScene from './MiniScene';
import { sceneOf, type Belief, type Dim, type Option, type Pair, type Summary } from '../lib/tune';

const QUESTION: Record<Dim, string> = {
  temp: 'warmer or cooler?', wind: 'calm or breezy?', clouds: 'sun or clouds?', humidity: 'dry air or muggy?', rain: 'dry or a bit of rain?',
};

function Card({ o, tag, seed, onPick, picked, dim }: { o: Option; tag: string; seed: number; onPick: () => void; picked: boolean; dim: Dim }) {
  const sc = sceneOf(o);
  // the one thing this pair is asking about gets highlighted, so you don't have to spot the difference
  const stat = (v: string, k: string, on = false) => (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 6px', background: on ? '#f2c230' : 'transparent' }}>
      <b style={{ fontSize: 17, fontWeight: 800 }}>{v}</b><span style={{ fontSize: 11, fontWeight: 700, color: '#6b6478' }}>{k}</span>
    </span>
  );
  return (
    <button onClick={onPick} className="snug-card" style={{ flex: 1, minWidth: 0, padding: 4, background: picked ? '#f2c230' : WOOD, clipPath: CP, transition: 'transform .15s', transform: picked ? 'translateY(-4px)' : 'none' }}>
      <div style={{ background: CREAM, clipPath: CP }}>
        <div style={{ position: 'relative' }}>
          <MiniScene cond={sc.cond} precip={sc.precip} int={sc.int} wind={o.wind} clouds={o.clouds} seed={seed} />
          <span style={{ position: 'absolute', left: 8, top: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: WOOD, color: LIGHT, fontSize: 14, fontWeight: 800 }}>{tag}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '9px 6px 10px', color: INK }}>
          {stat(`${Math.round(o.feels)}°`, 'feels', dim === 'temp')}{stat(`${Math.round(o.wind)}`, 'mph', dim === 'wind')}{stat(o.rain >= 0.2 ? 'rain' : `${Math.round(o.clouds)}%`, o.rain >= 0.2 ? 'sky' : 'cloud', dim === 'clouds' || dim === 'rain')}{stat(`${Math.round(o.humidity)}%`, 'humid', dim === 'humidity')}
        </div>
      </div>
    </button>
  );
}

/**
 * "Adjust my preferences": pick between two weathers, as many rounds as you like. The backend chooses each question
 * (whatever it's least sure about, straddling its current best guess) and saves every pick; learned preferences can be
 * removed with the × on their pill. Closing re-runs the forecast if anything changed.
 */
export default function AdjustPanel({ onClose }: { onClose: (changed: boolean) => void }) {
  const [round, setRound] = useState(0);
  const [next, setNext] = useState<Pair | null>(null);
  const [picked, setPicked] = useState<'A' | 'B' | '=' | null>(null);
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState('');
  const pair: [Option, Option] | null = next ? [next.a, next.b] : null;
  const dim: Dim = next?.dim ?? 'temp';

  useEffect(() => {
    api<Summary>('/tune/summary').then(setSummary, () => {});
    api<Pair>('/tune/next').then(setNext, () => setErr('couldn’t load a question'));
  }, []);
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose(count > 0); window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [count, onClose]);

  const pick = async (p: 'A' | 'B' | '=') => {
    if (picked || !pair) return;
    setPicked(p);
    setErr('');
    let upcoming: Pair | null = null;
    try {
      const r = await api<{ summary: Summary; next: Pair }>('/tune', { a: pair[0], b: pair[1], pick: p });
      setSummary(r.summary);
      upcoming = r.next;
      setCount(c => c + 1);
    } catch { setErr('couldn’t save that pick'); }
    setTimeout(() => { if (upcoming) { setNext(upcoming); setRound(r => r + 1); } setPicked(null); }, 450);
  };

  // forget one learned preference (deletes the picks behind it); counts as a change so the forecast re-runs
  const forget = async (b: Belief) => {
    try {
      const r = await api<{ summary: Summary; next: Pair }>(`/tune/${b.dim}`, undefined, 'DELETE');
      setSummary(r.summary);
      setCount(c => c + 1);
    } catch { setErr('couldn’t remove that'); }
  };

  const learned = summary?.beliefs ?? [];
  return (
    <div role="dialog" aria-modal="true" aria-label="adjust my preferences" onClick={e => e.target === e.currentTarget && onClose(count > 0)}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(20,14,30,0.55)', backdropFilter: 'blur(3px)', fontFamily: "'Rethink Sans',sans-serif", animation: 'snug-fade .2s both' }}>
      <style>{'@keyframes snug-fade{from{opacity:0}to{opacity:1}} @keyframes snug-pop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}} .snug-card:hover{transform:translateY(-3px)!important}'}</style>
      <div style={{ width: 'min(700px, 100%)', maxHeight: '100%', overflowY: 'auto', padding: 5, background: WOOD, clipPath: CP, boxShadow: '0 20px 40px rgba(0,0,0,0.35)', animation: 'snug-pop .3s cubic-bezier(.2,1.3,.4,1) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 18px 16px', background: WOOD_TEX, clipPath: CP }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ color: LIGHT, textShadow: `2px 2px 0 ${WOOD}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85 }}>ADJUST MY PREFERENCES</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>which would you rather be out in?</div>
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>{QUESTION[dim]} · pick as many as you like</div>
            </div>
            <button onClick={() => onClose(count > 0)} aria-label="close" style={{ flex: 'none', width: 34, height: 34, background: WOOD, color: LIGHT, fontSize: 18, fontWeight: 800, clipPath: CP }}>×</button>
          </div>
          <div key={round} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, minHeight: 200, animation: 'snug-pop .3s both' }}>
            {pair?.map((o, i) => (
              <div key={i} style={{ flex: '1 1 260px', display: 'flex' }}>
                <Card o={o} dim={dim} tag={i ? 'B' : 'A'} seed={round * 2 + i + 3} picked={picked === (i ? 'B' : 'A')} onPick={() => pick(i ? 'B' : 'A')} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => pick('=')} style={{ padding: '6px 14px', background: 'rgba(30,18,8,0.5)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>they feel about the same</button>
          </div>
          {err && <div style={{ textAlign: 'center', color: LIGHT, fontWeight: 800 }}>{err}</div>}
          <div style={{ padding: '12px 14px', background: CREAM, clipPath: CP, color: INK }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: '#6b6478' }}>WHAT SNUG HAS LEARNED{summary ? ` · ${summary.picks} pick${summary.picks === 1 ? '' : 's'}` : ''}</div>
            {learned.length
              ? <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {learned.map(l => (
                    <li key={l.dim} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 4px 10px', background: l.strength === 'strong' ? '#f2c230' : l.strength === 'some' ? '#f6e3a4' : '#efe6d2', fontSize: 13, fontWeight: 700 }}>
                      {l.text}
                      <button onClick={() => forget(l)} aria-label={`forget: ${l.text}`} title="forget this"
                        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(39,35,58,0.12)', color: INK, fontSize: 14, fontWeight: 800, lineHeight: 1 }}>×</button>
                    </li>
                  ))}
                </ul>
              : <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>nothing yet.</div>}
          </div>
          <button onClick={() => onClose(count > 0)} style={{ padding: 4, background: WOOD, clipPath: CP, alignSelf: 'center' }}>
            <span style={{ display: 'block', padding: '9px 20px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 16, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}` }}>
              {count ? `done · update my forecast (${count} new)` : 'close'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
