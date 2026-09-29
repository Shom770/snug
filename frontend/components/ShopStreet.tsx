'use client';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CP, WOOD } from './auth';

export interface Shop { id: string; name: string; label: string; hint: string }
export type ShopPhase = 'ride' | 'park' | 'inside' | 'out' | 'idle';
type Step = 'browse' | 'ride' | 'hop' | 'walk' | 'inside' | 'out' | 'idle' | 'back' | 'leave';

const SHOP_W = 156, SHOP_H = 188;
const DOOR_CX = SHOP_W - 30;
// snug at 2x the 46x58 sprite (about door height); the bike is 32x20 pixels at 2.5x
const SNUG_W = 92, SNUG_H = 116, BIKE_PX = 3.2, BIKE_W = 32 * BIKE_PX, BIKE_H = 20 * BIKE_PX;

// What each shop puts in its window: two pieces on a rail and one on the shelf.
const DISPLAY: Record<string, [string, string, string]> = {
  casual: ['light', 'tee', 'pants'], surf: ['long', 'coat', 'shorts'], minimal: ['coat', 'long', 'pants'],
  sporty: ['light', 'tee', 'shoe'], street: ['hoodie', 'tee', 'pants'], preppy: ['light', 'long', 'shoe'], cozy: ['sweater', 'coat', 'pants'],
};

interface Look { wall: string; trim: string; sign: CSSProperties; awning?: string; extra?: ReactNode }
const LOOKS: Record<string, Look> = {
  casual: { wall: 'repeating-linear-gradient(0deg, #9b4a35 0 8px, #7e3a29 8px 10px)', trim: '#2f4a73', sign: { background: '#2f4a73', color: '#fff1d2' },
    awning: 'repeating-linear-gradient(90deg, #4a6a9a 0 14px, #f1eadb 14px 28px)' },
  surf: { wall: 'repeating-linear-gradient(0deg, #d9b98c 0 10px, #b99868 10px 12px)', trim: '#e9806e', sign: { background: '#e9806e', color: '#fff', borderRadius: 10 },
    awning: 'repeating-linear-gradient(90deg, #2f9ab5 0 10px, #f4e6c6 10px 20px)',
    extra: <span style={{ position: 'absolute', left: 98, bottom: 86, width: 10, height: 0 }} /> },
  minimal: { wall: '#f3f1ec', trim: '#1f1f22', sign: { background: 'transparent', color: '#1f1f22', letterSpacing: 3, textTransform: 'uppercase', fontSize: 11 } },
  sporty: { wall: 'linear-gradient(170deg, #cfd5d9 0 52%, #e04848 52% 60%, #cfd5d9 60%)', trim: '#26324f', sign: { background: '#26324f', color: '#fff', fontStyle: 'italic' } },
  street: { wall: '#2b2b30', trim: '#e07a2c', sign: { background: 'transparent', color: '#ff7ad9', textShadow: '0 0 6px #ff7ad9, 0 0 12px #ff3fb8' },
    extra: <>
      <span style={{ position: 'absolute', left: 100, top: 48, width: 26, height: 4, background: '#2aa39a', transform: 'rotate(-14deg)', borderRadius: 3 }} />
      <span style={{ position: 'absolute', left: 104, top: 56, width: 18, height: 4, background: '#f2c230', transform: 'rotate(10deg)', borderRadius: 3 }} />
    </> },
  preppy: { wall: '#ece5d3', trim: '#26324f', sign: { background: '#26324f', color: '#d9b45a', fontFamily: 'Georgia, serif' },
    awning: 'radial-gradient(circle at 7px 0, #26324f 7px, transparent 7.5px) 0 100% / 14px 7px repeat-x, linear-gradient(#26324f, #26324f) 0 0 / 100% 9px no-repeat' },
  cozy: { wall: '#f1d7d9', trim: '#8a6040', sign: { background: '#fbf3e2', color: '#8a6040', borderRadius: 12, fontStyle: 'italic' },
    awning: 'repeating-linear-gradient(90deg, #c8b6e2 0 12px, #fbf3e2 12px 24px)',
    extra: <span style={{ position: 'absolute', left: 97, bottom: 0, width: 12, height: 11, background: '#b8643a', boxShadow: 'inset 0 3px 0 #964d2b' }}>
      <span style={{ position: 'absolute', left: -3, bottom: 9, width: 18, height: 13, borderRadius: '50%', background: '#6aa15a' }} />
    </span> },
};

/** One storefront: its own walls, trim, awning, sign and props, a window of clothes, and a door. */
function Front({ id, name, window }: { id: string; name: string; window: ReactNode }) {
  const L = LOOKS[id] || LOOKS.casual;
  return (
    <span style={{ position: 'absolute', inset: 0, background: L.wall, boxShadow: `inset 0 0 0 3px ${L.trim}` }}>
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 8, background: L.trim }} />
      <span className="snug-shop-sign" style={{ position: 'absolute', left: 12, right: 12, top: 14, padding: '4px 4px', fontSize: 13, lineHeight: 1.1, textAlign: 'center', transition: 'transform .15s', ...L.sign, fontFamily: "'Pixelify Sans', monospace", fontWeight: 700, WebkitFontSmoothing: 'none' }}>{name}</span>
      {L.awning && <span style={{ position: 'absolute', left: -4, right: -4, top: 44, height: 16, background: L.awning, boxShadow: '0 3px 0 rgba(0,0,0,0.15)' }} />}
      {L.extra}
      {window}
      <span style={{ position: 'absolute', left: DOOR_CX - 19, bottom: 0, width: 38, height: 84, background: L.trim, boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.25)' }}>
        <span style={{ position: 'absolute', left: 6, right: 6, top: 8, height: 32, background: 'rgba(233,244,251,0.8)' }} />
        <span style={{ position: 'absolute', right: 6, top: 46, width: 4, height: 4, background: '#f2c230' }} />
      </span>
      {id === 'surf' && ( // a surfboard leaning by the door
        <span style={{ position: 'absolute', left: DOOR_CX - 34, bottom: 0, width: 13, height: 66, borderRadius: '7px 7px 3px 3px', background: 'linear-gradient(90deg, #f2c230 0 42%, #e9806e 42% 58%, #f2c230 58%)', boxShadow: `0 0 0 2px ${WOOD}`, transform: 'rotate(-6deg)', transformOrigin: 'bottom' }} />
      )}
    </span>
  );
}

// A 32x20 pixel bicycle, drawn once per spoke frame; frames alternate while it rolls.
const BIKE_FRAMES: string[] = [];
function bikeFrame(f: number): string {
  if (BIKE_FRAMES[f]) return BIKE_FRAMES[f];
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 20;
  const g = cv.getContext('2d')!;
  const P = (x: number, y: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) P(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
  };
  const wheel = (cx: number, cy: number) => {
    for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; P(cx + Math.cos(t) * 5.5, cy + Math.sin(t) * 5.5, '#1c1a28'); }
    const d = f ? [[-3, -3, 3, 3], [-3, 3, 3, -3]] : [[-4, 0, 4, 0], [0, -4, 0, 4]];
    d.forEach(([a, b, c, e]) => line(cx + a, cy + b, cx + c, cy + e, '#a3a8b2'));
    P(cx, cy, '#1c1a28');
  };
  wheel(7, 13); wheel(25, 13);
  line(7, 13, 14, 13, '#e8604c'); line(14, 13, 20, 7, '#e8604c'); line(11, 7, 20, 7, '#e8604c'); line(11, 7, 7, 13, '#e8604c');
  line(20, 7, 25, 13, '#c94c3a'); line(11, 7, 14, 13, '#c94c3a'); line(12, 6, 21, 6, '#f08a74');
  line(11, 7, 10, 4, '#1c1a28'); line(7, 3, 12, 3, '#1c1a28');                 // seat
  line(20, 7, 21, 3, '#1c1a28'); line(19, 2, 23, 2, '#1c1a28');                 // handlebar
  P(14, 13, '#1c1a28'); P(f ? 15 : 13, f ? 15 : 11, '#1c1a28');                 // crank + pedal
  line(2, 8, 5, 8, '#1c1a28');                                                  // back rack
  return (BIKE_FRAMES[f] = cv.toDataURL());
}

function Bike({ moving, facing }: { moving: boolean; facing: number }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!moving) return;
    const iv = setInterval(() => setF(v => 1 - v), 120);
    return () => clearInterval(iv);
  }, [moving]);
  return <img src={bikeFrame(f)} alt="" style={{ width: BIKE_W, height: BIKE_H, imageRendering: 'pixelated', display: 'block', transform: `scaleX(${facing})` }} />;
}

/**
 * The style step: one storefront at a time, its window showing that style's clothes. Browse with the arrows
 * (or swipe). "Try it on" and snug rides up, hops off, walks in, and comes back out wearing it; browse on and
 * they walk back to the bike and pedal off.
 */
export default function ShopStreet({ shops, current, dress, item, onBuy, onStatus }: {
  shops: Shop[];
  current: string;
  /** snug wearing a style; 'sit' is the riding pose */
  dress: (style: string, pose: 'stand' | 'sit') => string;
  /** one clothing piece as a style makes it */
  item: (style: string, kind: string) => string;
  onBuy: (style: string) => void;
  onStatus?: (p: ShopPhase, shop: Shop) => void;
}) {
  const [i, setI] = useState(() => Math.max(0, shops.findIndex(s => s.id === current)));
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState<Step>('browse');
  const [wearing, setWearing] = useState(current);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clear(), []);
  const shop = shops[i];
  useEffect(() => {
    const p: ShopPhase = step === 'ride' ? 'ride' : step === 'hop' || step === 'walk' ? 'park' : step === 'inside' ? 'inside' : step === 'out' ? 'out' : 'idle';
    onStatus?.(p, shop);
  }, [step, shop, onStatus]);

  // the street's real width (phones are narrower), so everything lines up with the shop's door
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(420);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 320, GROUND_Y = 258, SCALE = 1.3;
  const doorX = boxW / 2 + (DOOR_CX - SHOP_W / 2) * SCALE;         // centre of the door
  const parkX = doorX - SNUG_W / 2 - BIKE_W - 6;                     // bike parked at the curb, left of where snug stands
  const busy = step !== 'browse' && step !== 'idle';
  const RIDE_IN = 1700, RIDE_OFF = 1100, WALK = 520;

  const tryOn = () => {
    if (busy) return;
    clear();
    setStep('ride');                                                             // glides in and slows to a stop
    later(RIDE_IN, () => setStep('hop'));                                        // hops off next to the bike
    later(RIDE_IN + 260, () => setStep('walk'));                                 // walks to the door
    later(RIDE_IN + 260 + WALK, () => setStep('inside'));                        // in through the door
    later(RIDE_IN + 260 + WALK + 950, () => { setWearing(shop.id); onBuy(shop.id); setStep('out'); });
    later(RIDE_IN + 260 + WALK + 1950, () => setStep('idle'));
  };
  const browse = (d: number) => {
    if (busy) return;
    clear();
    const go = () => { setSlide(d); setI(n => (n + d + shops.length) % shops.length); later(30, () => setSlide(0)); };
    if (step === 'idle') {                                                       // walk back, hop on, pedal off
      setStep('back');
      later(WALK, () => setStep('leave'));
      later(WALK + RIDE_OFF, () => { setStep('browse'); go(); });
    } else go();
  };
  const touch = useRef(0);

  // where things are, by step
  const bikeX = step === 'browse' ? -BIKE_W - 40 : step === 'leave' ? boxW + 40 : parkX;
  const riding = step === 'ride' || step === 'leave';
  const onFoot = !riding && step !== 'browse';
  const footX = step === 'hop' || step === 'back' ? parkX + BIKE_W - 18 : doorX - SNUG_W / 2;
  const walking = step === 'walk' || step === 'back';
  const [a, b, c] = DISPLAY[shop.id] || DISPLAY.casual;
  const win = (
    <span style={{ position: 'absolute', left: 10, top: 68, width: 84, height: 100, background: 'linear-gradient(160deg, #eef6fb, #c9dfee)', boxShadow: 'inset 0 0 0 3px rgba(30,24,40,0.45)' }}>
      <span style={{ position: 'absolute', left: 6, right: 6, top: 10, height: 2, background: '#8a8f99' }} />
      {[a, b].map((k, n) => (
        <span key={n} style={{ position: 'absolute', left: 4 + n * 38, top: 5, width: 38, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid #8a8f99' }} />
          <img src={item(shop.id, k)} alt="" style={{ width: 38, height: 33, imageRendering: 'pixelated' }} />
        </span>
      ))}
      <span style={{ position: 'absolute', left: 6, right: 6, bottom: 12, height: 3, background: '#8a6040' }} />
      <img src={item(shop.id, c)} alt="" style={{ position: 'absolute', left: 21, bottom: 15, width: 42, height: 36, imageRendering: 'pixelated' }} />
      <span style={{ position: 'absolute', left: 8, top: 6, width: 16, height: 3, background: 'rgba(255,255,255,0.7)', transform: 'rotate(-30deg)' }} />
    </span>
  );
  const arrow = (d: number) => (
    <button onClick={() => browse(d)} aria-label={d < 0 ? 'previous shop' : 'next shop'} disabled={busy}
      style={{ position: 'absolute', top: 110, [d < 0 ? 'left' : 'right']: 6, width: 28, height: 36, padding: 2, background: 'rgba(74,46,22,0.75)', clipPath: CP, opacity: busy ? 0.35 : 0.9, zIndex: 3, transition: 'opacity .2s' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(168,116,63,0.9)', clipPath: CP, color: '#fff1d2', fontSize: 18, fontWeight: 900 }}>{d < 0 ? '‹' : '›'}</span>
    </button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <style>{`
        @keyframes snug-step-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes snug-hop { 0% { transform: translate(-14px, -18px) } 60% { transform: translate(0, -6px) } 100% { transform: none } }
        @keyframes snug-sparkle { 0% { opacity: 0; transform: scale(.4) } 30% { opacity: 1 } 100% { opacity: 0; transform: scale(1.4) } }
        @keyframes snug-pop-out { 0% { transform: translateY(6px) scale(.94); opacity: 0 } 60% { transform: translateY(-3px) scale(1.02); opacity: 1 } 100% { transform: none } }
        .snug-shop:hover .snug-shop-sign { transform: translateY(-2px) rotate(-1.5deg); }
      `}</style>
      <div style={{ width: '100%', maxWidth: 440, padding: 3, background: WOOD, clipPath: CP }}
        onTouchStart={e => { touch.current = e.touches[0].clientX; }} onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) browse(dx < 0 ? 1 : -1); }}>
        <div ref={box} style={{ position: 'relative', height: H, overflow: 'hidden', clipPath: CP, background: 'linear-gradient(#a9d2ef 0, #dcedf8 190px)' }}>
          <button className="snug-shop" onClick={tryOn} aria-label={`try on at ${shop.name}`} title={`${shop.label} · ${shop.hint}`}
            style={{ position: 'absolute', left: '50%', top: GROUND_Y - SHOP_H * SCALE, width: SHOP_W, height: SHOP_H, padding: 0, background: 'none', cursor: busy ? 'default' : 'pointer',
              transformOrigin: 'top left', transform: `translateX(calc(-50% * ${SCALE} + ${slide * 110}%)) scale(${SCALE})`, opacity: slide ? 0 : 1, transition: slide ? 'none' : 'transform .5s cubic-bezier(.2,.9,.3,1), opacity .35s' }}>
            <Front id={shop.id} name={shop.name} window={win} />
          </button>
          {arrow(-1)}{arrow(1)}
          {/* sidewalk + a quiet street */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y, height: 26, background: 'repeating-linear-gradient(90deg, #ddd6c8 0 56px, #cfc7b7 56px 58px)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y + 26, bottom: 0, background: '#7a7e88' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 2, background: 'repeating-linear-gradient(90deg, rgba(242,194,48,0.8) 0 22px, transparent 22px 56px)' }} />
          </div>
          {/* the bike (with snug riding it while it moves) */}
          <div style={{ position: 'absolute', left: bikeX, top: GROUND_Y + 22 - BIKE_H, width: BIKE_W, height: BIKE_H, pointerEvents: 'none',
            transition: riding ? `left ${step === 'leave' ? RIDE_OFF : RIDE_IN}ms ${step === 'leave' ? 'cubic-bezier(.5,0,.8,.6)' : 'cubic-bezier(.15,.6,.3,1)'}` : 'none' }}>
            {/* seated on the saddle (bike pixels ~x9, y3); the sit sprite's hips are ~(40, 78) at this size */}
            {riding && <img src={dress(wearing, 'sit')} alt="snug riding a bike" style={{ position: 'absolute', left: 9.5 * BIKE_PX - 40, top: 3 * BIKE_PX - 78, width: SNUG_W, height: SNUG_H, imageRendering: 'pixelated', animation: 'snug-step-bob .3s ease-in-out infinite' }} />}
            <Bike moving={riding} facing={1} />
          </div>
          {/* snug on foot: hops off, walks to the door and in, comes back out in the new look */}
          {onFoot && (
            <div style={{ position: 'absolute', left: footX, top: GROUND_Y + 14 - SNUG_H, width: SNUG_W, height: SNUG_H, pointerEvents: 'none', transition: walking ? `left ${WALK}ms linear` : 'none' }}>
              <div style={{ width: '100%', height: '100%', opacity: step === 'inside' ? 0 : 1, transition: 'opacity .3s',
                animation: step === 'hop' ? 'snug-hop .26s ease-out both' : walking ? 'snug-step-bob .26s ease-in-out infinite' : step === 'out' ? 'snug-pop-out .55s both' : 'none' }}>
                <img src={dress(wearing, 'stand')} alt="your snug" style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
              </div>
              {step === 'out' && [0, 1, 2, 3, 4].map(k => (
                <span key={k} style={{ position: 'absolute', left: [6, 74, 12, 80, 42][k], top: [14, 22, 66, 60, -8][k], color: '#f2c230', fontSize: 16, fontWeight: 900, textShadow: `1px 1px 0 ${WOOD}`, animation: `snug-sparkle .9s ${k * 0.08}s both` }}>✦</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5 }} aria-hidden>
        {shops.map((s, n) => <span key={s.id} style={{ width: n === i ? 16 : 7, height: 7, background: s.id === wearing ? '#f2c230' : n === i ? '#fff1d2' : 'rgba(255,241,210,0.35)', transition: 'width .2s' }} />)}
      </div>
      <button onClick={tryOn} disabled={busy || (wearing === shop.id && step === 'idle')} style={{ padding: 3, background: WOOD, clipPath: CP, opacity: busy ? 0.5 : 1 }}>
        <span style={{ display: 'block', padding: '6px 16px', background: '#a8743f', clipPath: CP, color: '#fff1d2', fontSize: 14, fontWeight: 800, textShadow: `2px 2px 0 ${WOOD}` }}>
          {wearing === shop.id && step === 'idle' ? `wearing ${shop.name} ✓` : `try it on at ${shop.name}`}
        </span>
      </button>
    </div>
  );
}
