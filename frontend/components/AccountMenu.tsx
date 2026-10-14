'use client';
import { useState, type CSSProperties } from 'react';
import { CP, LIGHT, PLANK, WOOD, WOOD_TEX } from './auth';
import LocationSearch, { type Place } from './LocationSearch';

const rope: CSSProperties = { width: 4, height: '100%', background: 'repeating-linear-gradient(180deg,#7a5634 0 4px,#5e3c20 4px 8px)' };

/** Hangs top-left in the app: where the forecast is for. Opens to change the place (and, on a phone, where "adjust" and
 * "sign out" live too, instead of hanging under the snug board and crowding the top of the screen). */
export default function AccountMenu({ place, onPlace, onEditSnug, onShop, more }: {
  place: Place; onPlace: (p: Place) => void; onEditSnug: () => void; onShop: () => void; more?: { onAdjust: () => void; onSignOut: () => void; email?: string | null };
}) {
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setOpen(false); onShop(); }} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>go shopping</button>
              <button onClick={() => { setOpen(false); onEditSnug(); }} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>✎ edit my snug</button>
            </div>
            {more && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => { setOpen(false); more.onAdjust(); }} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>adjust preferences</button>
                <button onClick={() => { setOpen(false); more.onSignOut(); }} title={more.email ? `signed in as ${more.email}` : undefined} style={{ padding: '6px 12px', background: 'rgba(30,18,8,0.55)', color: LIGHT, fontSize: 13, fontWeight: 800 }}>sign out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
