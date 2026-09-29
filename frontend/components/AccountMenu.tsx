'use client';
import { useState, type CSSProperties } from 'react';
import { CP, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import LocationSearch, { type Place } from './LocationSearch';

const rope: CSSProperties = { width: 4, height: '100%', background: 'repeating-linear-gradient(180deg,#7a5634 0 4px,#5e3c20 4px 8px)' };

/** Hangs top-left in the app: where the forecast is for. Opens to change the place. */
export default function AccountMenu({ place, onPlace, onEditSnug }: { place: Place; onPlace: (p: Place) => void; onEditSnug: () => void }) {
  const [open, setOpen] = useState(false);
  const city = place.name.split(',')[0].toLowerCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontFamily: "'Rethink Sans',sans-serif" }}>
      <div className="snug-hang" onClick={() => setOpen(o => !o)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: -40 }}>
      {/* ropes run up past the top of the screen so a swing never shows their ends */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 96, height: 54, marginLeft: 20 }}><span style={rope} /><span style={rope} /></div>
      <button className="snug-plank" aria-expanded={open} aria-label={`change place (now ${place.name})`} style={{ padding: 4, background: WOOD, clipPath: CP }}>
        <span className="snug-place-face" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: PLANK, clipPath: CP, color: LIGHT, fontSize: 15, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}`, whiteSpace: 'nowrap' }}>
          <span aria-hidden>📍</span>{city}<span aria-hidden style={{ fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </span>
      </button>
      </div>
      {open && (
        <div style={{ marginTop: 8, padding: 4, background: WOOD, clipPath: CP, boxShadow: '0 12px 24px rgba(20,10,4,0.35)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, width: 300, background: WOOD_TEX, clipPath: CP }}>
            <div style={{ color: LIGHT, fontSize: 13, fontWeight: 800, textShadow: `1px 1px 0 ${WOOD}` }}>change place</div>
            <LocationSearch inline width={272} onPick={p => { setOpen(false); onPlace(p); }} />
            <button onClick={() => { setOpen(false); onEditSnug(); }} style={{ alignSelf: 'flex-start', padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>✎ edit my snug</button>
          </div>
        </div>
      )}
    </div>
  );
}
