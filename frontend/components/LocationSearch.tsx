'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { api, CP, CREAM, INK, LIGHT, WOOD } from './auth';

export interface Place { name: string; lat: number; lon: number }

/** Type a city, town or postal code; pick a suggestion. Or use the browser's location. */
/** inline: suggestions push content down instead of floating (for use inside a clipped panel) */
export default function LocationSearch({ onPick, width = 280, autoFocus = true, inline = false }: { onPick: (p: Place) => void; width?: number; autoFocus?: boolean; inline?: boolean }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Place[]>([]);
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const seq = useRef(0);

  // debounced suggestions; only the latest query's answer is shown
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) { setHits([]); return; }
    const n = ++seq.current;
    const t = setTimeout(() => {
      api<Place[]>('/places?q=' + encodeURIComponent(text))
        .then(r => { if (n === seq.current) { setHits(r); setSel(0); setMsg(r.length ? '' : 'no places found'); } })
        .catch(() => n === seq.current && setMsg('search is down, try again'));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (p: Place) => { setQ(p.name); setHits([]); onPick(p); };
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(hits.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (hits[sel]) pick(hits[sel]); }
    else if (e.key === 'Escape') setHits([]);
  };
  const here = () => {
    if (!navigator.geolocation) { setMsg('this browser can’t share location'); return; }
    setBusy(true);
    setMsg('');
    navigator.geolocation.getCurrentPosition(
      pos => api<Place>(`/places/reverse?lat=${pos.coords.latitude.toFixed(4)}&lon=${pos.coords.longitude.toFixed(4)}`)
        .then(pick, () => pick({ name: 'my location', lat: pos.coords.latitude, lon: pos.coords.longitude }))
        .finally(() => setBusy(false)),
      () => { setBusy(false); setMsg('location permission was denied'); },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div style={{ position: 'relative', width, fontFamily: "'Rethink Sans',sans-serif" }}>
      <div style={{ padding: 3, background: WOOD, clipPath: CP }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={key} autoFocus={autoFocus} placeholder="city, town or zip…" aria-label="location"
          role="combobox" aria-expanded={hits.length > 0} aria-autocomplete="list"
          style={{ display: 'block', width: '100%', height: 50, padding: '0 14px', border: 'none', outline: 'none', background: '#f6e8c6', color: '#2e1a0c', font: 'inherit', fontSize: 16, fontWeight: 700, clipPath: CP }} />
      </div>
      {hits.length > 0 && (
        <div role="listbox" style={{ ...(inline ? { marginTop: 8 } : { position: 'absolute', left: 0, right: 0, top: 58, zIndex: 20 }), padding: 3, background: WOOD, clipPath: CP, boxShadow: '0 12px 24px rgba(20,10,4,0.35)' }}>
          <div style={{ background: CREAM, clipPath: CP }}>
            {hits.map((h, i) => (
              <button key={h.name + h.lat} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => pick(h)}
                style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: i === sel ? '#f2c230' : 'transparent', color: INK, fontSize: 14, fontWeight: 700 }}>
                {h.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
        <button onClick={here} disabled={busy} style={{ padding: '5px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>
          {busy ? 'finding you…' : '📍 use my location'}
        </button>
      </div>
      {msg && <div style={{ marginTop: 6, textAlign: 'center', color: LIGHT, fontSize: 12, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}` }}>{msg}</div>}
    </div>
  );
}
