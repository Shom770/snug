'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Avatar } from './CharacterPanel';
import { OnTop, type PageCtx } from './World';
import type { Outfit } from '../lib/types';
import { itemSprite, sprite } from '../lib/engine';

export interface MaisonPiece { id: string; kind: string; name: string; base: string; acc: string | null; fx: string[] }

const icon = itemSprite as (kind: string, av: Avatar) => string;
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const FONT = "'Rethink Sans', sans-serif", INK = '#1c1a28', TAG = '#f3efe6', TAG_INK = '#23302a';
const TAG_CP = 'polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%,0 14px)';
const GREEN = '#2f4a3e', FLUTE = '#2a4237', DEEP = '#23372e', PILLAR = '#3a5a4b', BRASS = '#c9a55a', BRASS_D = '#9c7f3e', BRASS_L = '#e3c98a';
const GLASS = '#1f2b27', MARBLE = '#e8e4dc', STONE = '#cfc8bb';

// the shop, in its own pixels (scaled to fit the page; the street is the bottom four rows)
const SW = 100, SH = 94;
const R = {
  frieze: [18, 28, 64, 8], window: [10, 38, 58, 46], rail: 45, shelves: [70, 83], door: [77, 44, 14, 42], crest: [50, 13, 5],
  pilasters: [3, 70, 92], lanterns: [[72, 50], [94, 50]],
} as const;
const PEAK = (x: number) => 20 - Math.round(14 * Math.sqrt(Math.max(0, 1 - ((x - 50) / 22) ** 2))); // the pediment's curve
const IN_X = [R.window[0] + 3, R.window[0] + R.window[2] - 3] as const; // the window's inside, left to right
const slotX = (i: number, n: number) => IN_X[0] + (IN_X[1] - IN_X[0]) * (i + 0.5) / n;

/** The shop, pixel by pixel and outlined like snug: a stone plinth, deep green fluted walls between pilasters with brass
 * capitals, a cornice with dentils, a curved pediment with a brass monogram crest and urn finials either side, a frieze
 * for the name, one grand arched window with brass filigree (a brass rail under the arch, two glass shelves with marble
 * pedestals below), an arched glass door under a fanlight, brass lanterns on the pilasters. */
function drawShop(): string {
  const cv = document.createElement('canvas');
  cv.width = SW; cv.height = SH;
  const g = cv.getContext('2d')!, r = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  /** An arched opening: rows of its width, the top rounded over `rise` rows. */
  const arch = (x: number, y: number, w: number, h: number, rise: number, c: string) => {
    for (let j = 0; j < h; j++) { const half = j < rise ? (w / 2) * Math.sqrt(Math.max(0, 1 - ((rise - j) / rise) ** 2)) : w / 2; const x0 = Math.round(x + w / 2 - half); r(x0, y + j, Math.round(x + w / 2 + half) - x0, 1, c); }
  };
  // the pediment, rising over the cornice in a curve, edged in brass
  for (let x = 27; x <= 73; x++) { const y = PEAK(x); r(x, y - 1, 1, 22 - y, INK); }
  for (let x = 28; x <= 72; x++) { const y = PEAK(x); r(x, y, 1, 21 - y, GREEN); r(x, y + 1, 1, 1, BRASS); }
  // the crest: a brass ring, a monogram S, little brass leaves
  { const [cx, cy, rad] = R.crest;
    for (let y = -rad - 1; y <= rad + 1; y++) for (let x = -rad - 1; x <= rad + 1; x++) { const d = Math.hypot(x, y); if (d <= rad + 0.6) r(cx + x, cy + y, 1, 1, d > rad - 0.4 ? BRASS : DEEP); }
    [' ##', '#  ', ' # ', '  #', '## '].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') r(cx - 1 + i, cy - 2 + j, 1, 1, BRASS_L); }));
    [[-8, 1], [-7, -1], [-9, 3], [7, -1], [8, 1], [9, 3]].forEach(([dx, dy]) => r(cx + dx, cy + dy, 1, 1, BRASS)); }
  // the cornice: a deep band, a brass line, dentils
  r(0, 19, SW, 7, INK); r(1, 20, SW - 2, 4, DEEP); r(1, 21, SW - 2, 1, BRASS);
  for (let x = 1; x < SW - 1; x += 2) r(x, 24, 1, 1, BRASS_D);
  // urn finials on the shoulders
  [7, 92].forEach(x => { r(x - 2, 17, 5, 2, INK); r(x - 2, 13, 5, 4, INK); r(x - 1, 14, 3, 3, BRASS); r(x - 1, 17, 3, 1, BRASS_D); r(x, 11, 1, 2, BRASS_L); r(x - 1, 12, 3, 1, BRASS); });
  // the walls, fluted
  r(2, 26, 96, 60, INK); r(3, 26, 94, 59, GREEN);
  for (let x = 6; x < 96; x += 3) r(x, 37, 1, 48, FLUTE);
  // the frieze for the name
  { const [x, y, w, h] = R.frieze; r(x - 1, y - 1, w + 2, h + 2, BRASS_D); r(x, y, w, h, DEEP); r(x, y, w, 1, '#2b4237'); }
  // pilasters: a lighter green, a fluting line, brass capitals and bases
  R.pilasters.forEach(x => { r(x - 1, 36, 7, 50, INK); r(x, 37, 5, 48, PILLAR); r(x + 2, 40, 1, 42, FLUTE); r(x - 1, 36, 7, 3, BRASS); r(x - 1, 38, 7, 1, BRASS_D); r(x - 1, 82, 7, 3, BRASS_D); r(x - 1, 82, 7, 1, BRASS); });
  // the window: brass and ink round an arch, dark glass lit softly from the top, filigree in the upper corners
  { const [x, y, w, h] = R.window;
    arch(x - 2, y - 2, w + 4, h + 3, 10, INK); arch(x - 1, y - 1, w + 2, h + 2, 9, BRASS); arch(x, y, w, h, 8, GLASS);
    for (let j = 0; j < 10; j++) arch(x, y + j, w, 1, 8 - j > 0 ? 8 - j : 1, `rgba(255,236,200,${0.12 - j * 0.011})`);
    [[x + 3, 1], [x + w - 4, -1]].forEach(([fx, d]) => { [[0, 9], [1, 8], [2, 8], [3, 9], [3, 10], [2, 11], [1, 11], [1, 10]].forEach(([dx, dy]) => r(fx + dx * d, y + dy, 1, 1, BRASS)); });
    r(IN_X[0], R.rail, IN_X[1] - IN_X[0], 1, BRASS_L); r(IN_X[0], R.rail + 1, IN_X[1] - IN_X[0], 1, BRASS_D); r(IN_X[0] - 1, R.rail - 1, 1, 3, BRASS); r(IN_X[1], R.rail - 1, 1, 3, BRASS);
    R.shelves.forEach((sy, si) => { r(x + 2, sy, w - 4, 1, '#9fb0aa'); r(x + 2, sy + 1, w - 4, 1, '#55665f');
      const n = si ? 2 : 3; for (let i = 0; i < n; i++) { const px = Math.round(slotX(i, n)); r(px - 4, sy - 4, 8, 4, INK); r(px - 3, sy - 4, 6, 4, MARBLE); r(px - 3, sy - 4, 6, 1, '#ffffff'); r(px + 1, sy - 3, 1, 3, '#d3cec4'); } }); }
  // the door: arched glass in a brass frame, a long bar handle, and a fanlight over it
  { const [x, y, w, h] = R.door, cx = x + w / 2;
    for (let j = -8; j <= 0; j++) for (let i = -8; i <= 8; i++) { const d = Math.hypot(i, j); if (d <= 8) r(Math.round(cx + i - 0.5), y - 2 + j, 1, 1, d > 7 ? INK : d > 6 ? BRASS : (Math.round(Math.atan2(j, i) * 4) % 2 ? GLASS : BRASS_D)); }
    arch(x - 2, y - 1, w + 4, h + 1, 3, INK); arch(x - 1, y, w + 2, h, 2, BRASS); arch(x + 1, y + 2, w - 2, h - 4, 1, GLASS);
    r(x + 3, y + 4, 1, 8, '#33443e'); r(x + w - 4, y + 14, 1, 14, BRASS_L); r(x + w - 5, y + 14, 1, 14, BRASS_D); }
  // the lanterns' brackets and frames (their glow is lit on top)
  R.lanterns.forEach(([x, y]) => { r(x - 1, y - 3, 1, 3, INK); r(x - 2, y - 1, 5, 8, INK); r(x - 1, y, 3, 6, BRASS); r(x, y + 1, 1, 4, '#fff2c8'); r(x - 1, y - 2, 3, 1, BRASS_D); });
  // the plinth and the street
  r(0, 85, SW, 5, INK); r(1, 86, SW - 2, 3, STONE); r(1, 86, SW - 2, 1, '#e3ddd2');
  r(0, SH - 4, SW, 4, '#cfc9be'); r(0, SH - 4, SW, 1, '#e3ded4'); for (let x = 8; x < SW; x += 16) r(x, SH - 3, 1, 3, '#b8b1a4');
  return cv.toDataURL();
}

/** The name in brass on the frieze, lettered at three times the shop's resolution so it comes out a little chunky. */
function drawName(): string {
  const F = 3, cv = document.createElement('canvas');
  cv.width = SW * F; cv.height = SH * F;
  const g = cv.getContext('2d')!, [x, y, w, h] = R.frieze;
  g.scale(F, F); g.font = "800 6px 'Rethink Sans', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#141e19'; g.fillText('maison snugé', x + w / 2 + 0.3, y + h / 2 + 0.6);
  g.fillStyle = BRASS_L; g.fillText('maison snugé', x + w / 2, y + h / 2 + 0.3);
  return cv.toDataURL();
}

/** A piece's special finish, if it has one. */
const finishOf = (it: MaisonPiece) => it.fx.find(f => f === 'holo' || f === 'sequin' || f === 'metallic');
const OUTER = ['coat', 'light', 'hoodie', 'rain'], TOPS = ['tank', 'tee', 'long', 'sweater'], EXTRA = ['bag', 'hat', 'glasses', 'chain', 'headphones'];
/** Snug trying a piece on: just that piece changes, everything else stays as it was. A coat or jacket goes over the
 * top, a top goes on as the top, a scarf round the neck; a hat or glasses take the place of the day's beanie or
 * sunglasses so they show. */
function tryOn(it: MaisonPiece, today: Outfit | undefined, avatar: Avatar): string {
  const base: Outfit = today ?? { top: 'tee', outer: 'none', bottom: 'pants', acc: [] };
  let o: Outfit = base;
  if (EXTRA.includes(it.kind)) o = { ...base, acc: base.acc.filter(a => !(it.kind === 'hat' && a === 'beanie') && !(it.kind === 'glasses' && a === 'sunglasses')) };
  else if (OUTER.includes(it.kind)) o = { ...base, outer: it.kind as Outfit['outer'] };
  else if (TOPS.includes(it.kind)) o = { ...base, top: it.kind as Outfit['top'] };
  else if (it.kind !== 'shoe' && !base.acc.includes(it.kind as Outfit['acc'][number])) o = { ...base, acc: [...base.acc, it.kind as Outfit['acc'][number]] };
  // a puddle day keeps its rain boots on while trying things
  return draw(o, 'happy', 'stand', { ...avatar, wet: !!base.boots, wearing: { ...((avatar as { wearing?: Record<string, string> }).wearing ?? {}), [it.kind]: it.id } } as Avatar);
}

const layout = (c: PageCtx) => {
  const phone = c.pw < 760, shopW = Math.min(phone ? c.pw * 0.9 : 580, 175 * c.u), s = shopW / SW;
  const shopX = phone ? c.pw - shopW - c.pw * 0.03 : c.pw * 0.5 - shopW * 0.4;
  return { s, shopW, shopX, shopY: c.ground + 3 * c.u - (SH - 2) * s };
};
/** Where snug stands at the boutique (its sprite's left edge): at the door, so the window stays in view. */
export const boutiqueSnugAt = (c: PageCtx) => { const { shopX, s } = layout(c); return Math.round(shopX + (R.door[0] + R.door[2] / 2) * s - 23 * c.u); };


/**
 * maison snugé, the boutique at the end of snug's street, for anyone. Each week: one of each extra snug grabs on some
 * days (a bag, a hat, glasses, a chain, headphones) and three statement pieces from the season's capsule (fur in winter,
 * cashmere in autumn...). The pieces hang under the window's arch; the extras sit on pedestals below.
 * Tap one: its tag hangs from it, try it on snug, take it home.
 */
export default function Boutique({ ctx, pieces, extras, season, avatar, today, owned, onTake }: {
  ctx: PageCtx; pieces: MaisonPiece[]; extras: MaisonPiece[]; season: string; avatar: Avatar; today?: Outfit; owned: Set<string>; onTake: (it: MaisonPiece) => void;
}) {
  const [sel, setSel] = useState<MaisonPiece | null>(null);
  const [trying, setTrying] = useState<string | null>(null);
  const { s: k, shopW, shopX, shopY } = layout(ctx);
  const shop = useMemo(drawShop, []);
  // the shop's picture, decoded (a cached one may already be by the time this runs)
  const shopImg = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (shopImg.current?.complete && shopImg.current.naturalWidth) setLoaded(true); }, []);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => { let live = true; document.fonts.ready.then(() => { if (live) setName(drawName()); }); return () => { live = false; }; }, []);
  const all = [...pieces, ...extras];
  // walking away: whatever was being tried goes back on the rail
  useEffect(() => { if (!ctx.arrived) { setSel(null); setTrying(null); } }, [ctx.arrived]);
  useEffect(() => { const it = all.find(p => p.id === trying); ctx.setSnug(it ? tryOn(it, today, avatar) : null); }, [trying]); // eslint-disable-line react-hooks/exhaustive-deps

  // where each piece is: the capsule pieces hang on padded hangers from the rail, the extras sit on the pedestals
  const spots = all.map((it, n) => {
    if (n < pieces.length) {
      const w = Math.min(70, 12 * k), cx = shopX + slotX(n, pieces.length) * k, top = shopY + R.rail * k - w * 0.08;
      return { it, hung: true, n, w, cx, x: cx - w / 2, top, bottom: top + w * 1.02 };
    }
    const i = n - pieces.length, row = i < 3 ? 0 : 1, m = row ? extras.length - 3 : Math.min(3, extras.length), w = Math.min(58, 10 * k);
    const cx = shopX + slotX(row ? i - 3 : i, m) * k, top = shopY + (R.shelves[row] - 4) * k - w * 24 / 28 + k * 0.6;
    return { it, hung: false, n, w, cx, x: cx - w / 2, top, bottom: top + w * 24 / 28 };
  });
  const spot = sel ? spots.find(p => p.it.id === sel.id) : null, mine = !!sel && owned.has(sel.id);
  // the tag hangs down to the grass below snug's feet, so whatever snug's trying on stays in full view
  const tag = spot && (() => { const w = Math.min(232, ctx.pw - 24); return { w, x: Math.max(12, Math.min(ctx.pw - w - 12, spot.cx - w / 2)), y: Math.max(spot.bottom + 16, ctx.ground + 8) }; })();
  const at = (x: number, y: number) => ({ left: shopX + x * k, top: shopY + y * k });

  return (
    <div data-boutique style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <style>{`@keyframes maison-glow{0%,100%{opacity:.75}50%{opacity:1}}
        @keyframes maison-holo{from{filter:hue-rotate(0deg) drop-shadow(0 2px 1px rgba(0,0,0,0.4))}to{filter:hue-rotate(360deg) drop-shadow(0 2px 1px rgba(0,0,0,0.4))}}
        @keyframes maison-glint{0%,70%,100%{filter:brightness(1) drop-shadow(0 2px 1px rgba(0,0,0,0.4))}82%{filter:brightness(1.4) drop-shadow(0 0 4px rgba(255,248,220,0.9))}}
        @keyframes maison-twinkle{0%,100%{opacity:0;scale:.4}50%{opacity:1;scale:1}}
        @keyframes maison-sway{0%,100%{rotate:-1.2deg}50%{rotate:1.2deg}}
        @keyframes maison-drop{0%{translate:0 -40px;rotate:-10deg;opacity:0}55%{translate:0 5px;rotate:4deg;opacity:1}78%{rotate:-2deg}100%{translate:0 0;rotate:0deg}}`}</style>
      <img ref={shopImg} src={shop} alt="" onLoad={() => setLoaded(true)} style={{ position: 'absolute', left: shopX, top: shopY, width: shopW, height: SH * k, imageRendering: 'pixelated', opacity: loaded ? 1 : 0 }} />
      {/* everything in and on the shop shows once the shop itself has (a phone draws the little clothes first otherwise) */}
      <div style={{ position: 'absolute', inset: 0, opacity: loaded && name ? 1 : 0, transition: 'opacity .25s', pointerEvents: loaded && name ? undefined : 'none' }}>
      {name && <img src={name} alt="maison snugé" style={{ position: 'absolute', left: shopX, top: shopY, width: shopW, height: SH * k, imageRendering: 'pixelated', pointerEvents: 'none' }} />}
      {/* the lanterns, glowing */}
      {R.lanterns.map(([x, y], i) => <span key={i} aria-hidden style={{ position: 'absolute', ...at(x - 3, y - 2), width: 7 * k, height: 9 * k, background: 'radial-gradient(closest-side, rgba(255,226,160,0.55), rgba(255,226,160,0))', pointerEvents: 'none', animation: `maison-glow 3.6s ${i * 0.8}s ease-in-out infinite` }} />)}
      {spots.map(({ it, hung, n, w, x, top, cx }) => {
        const on = sel?.id === it.id;
        return (
          <div key={it.id}>
            <span aria-hidden style={{ position: 'absolute', left: cx - w * 0.7, top: top - w * 0.25, width: w * 1.4, height: w * 1.3, background: 'radial-gradient(closest-side, rgba(255,232,200,0.3), rgba(255,232,200,0))', pointerEvents: 'none', animation: `maison-glow 4s ${n * 0.4}s ease-in-out infinite` }} />
            <button onClick={() => { setSel(on ? null : it); if (on) setTrying(null); }} aria-label={it.name}
              style={{ position: 'absolute', left: x, top, width: w, transformOrigin: '50% 0', animation: hung ? `maison-sway ${3 + (n % 2) * 0.4}s ${n * 0.3}s ease-in-out infinite` : undefined, zIndex: on ? 2 : 1 }}>
              {/* a padded hanger for the capsule pieces */}
              {hung && (
                <svg viewBox="0 0 12 6" width={w * 0.5} height={w * 0.25} shapeRendering="crispEdges" aria-hidden style={{ display: 'block', margin: '0 auto' }}>
                  <rect x="5" y="0" width="2" height="1" fill={BRASS} /><rect x="6" y="1" width="1" height="2" fill={BRASS} /><rect x="1" y="3" width="10" height="2" fill={MARBLE} /><rect x="1" y="3" width="10" height="1" fill="#ffffff" />
                </svg>
              )}
              <img src={icon(it.kind, { ...avatar, wardrobe: { [it.kind]: [{ id: it.id }] } })} alt="" style={{ display: 'block', width: w, height: w * 24 / 28, marginTop: hung ? -w * 0.06 : 0, imageRendering: 'pixelated', filter: on ? 'drop-shadow(0 0 3px #fff6e6)' : 'drop-shadow(0 2px 1px rgba(0,0,0,0.4))',
                // the special finishes come alive in the window: iridescence drifting through its colours, sequins and metal glinting
                animation: finishOf(it) === 'holo' ? `maison-holo 5s ${n * 0.3}s linear infinite` : finishOf(it) ? `maison-glint 2.6s ${n * 0.4}s ease-in-out infinite` : undefined }} />
              {finishOf(it) && [[-0.1, 0.1], [0.95, 0.25], [0.3, 0.85]].map(([fx, fy], i) => (
                <svg key={i} viewBox="0 0 3 3" width={Math.max(5, w * 0.12)} height={Math.max(5, w * 0.12)} shapeRendering="crispEdges" aria-hidden style={{ position: 'absolute', left: fx * w, top: fy * w * 0.86, pointerEvents: 'none', animation: `maison-twinkle 1.8s ${(n * 0.37 + i * 0.6) % 1.8}s ease-in-out infinite` }}>
                  <rect x="1" y="0" width="1" height="3" fill="#fffbea" /><rect x="0" y="1" width="3" height="1" fill="#fffbea" />
                </svg>
              ))}
              {owned.has(it.id) && <span style={{ position: 'absolute', right: -4, top: hung ? w * 0.25 : -6, padding: '0 4px', background: TAG, color: TAG_INK, fontSize: 8.5, fontWeight: 800, clipPath: 'polygon(4px 0,100% 0,100% 100%,4px 100%,0 50%)' }}>yours</span>}
            </button>
          </div>
        );
      })}

      {/* a piece up close: its tag, hanging from it on a brass thread (on top of snug) */}
      {sel && spot && tag && (
        <OnTop>
          <svg aria-hidden width={ctx.pw} height={ctx.ph} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
            <line x1={spot.cx} y1={spot.bottom - 2} x2={tag.x + tag.w / 2} y2={tag.y + 8} stroke={BRASS} strokeWidth={1.5} />
          </svg>
          <div key={sel.id} style={{ position: 'absolute', left: tag.x, top: tag.y, width: tag.w, transformOrigin: '50% 0', animation: 'maison-drop .55s cubic-bezier(.3,.7,.4,1) both' }}>
            <div style={{ position: 'relative', padding: '18px 14px 12px', background: TAG, color: TAG_INK, clipPath: TAG_CP, filter: 'drop-shadow(0 4px 0 rgba(20,30,26,0.35))' }}>
              <span aria-hidden style={{ position: 'absolute', left: 'calc(50% - 4px)', top: 4, width: 8, height: 8, borderRadius: '50%', background: BRASS, boxShadow: `inset 1px 1px 0 ${BRASS_D}` }} />
              <button onClick={() => { setSel(null); setTrying(null); }} aria-label="put it back" style={{ position: 'absolute', right: 10, top: 6, fontSize: 21, lineHeight: 1, fontWeight: 800, color: TAG_INK, opacity: 0.55 }}>×</button>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, opacity: 0.6 }}>MAISON SNUGÉ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <img src={icon(sel.kind, { ...avatar, wardrobe: { [sel.kind]: [{ id: sel.id }] } })} alt="" style={{ width: 70, height: 60, imageRendering: 'pixelated', flex: 'none' }} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>{sel.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, marginTop: 3 }}>{season}, limited time</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => setTrying(t => (t === sel.id ? null : sel.id))} style={{ flex: 1, minWidth: 0, padding: '7px 4px', background: trying === sel.id ? GREEN : 'rgba(35,48,42,0.1)', color: trying === sel.id ? TAG : TAG_INK, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{trying === sel.id ? 'take it off' : 'try it on'}</button>
                <button onClick={() => { if (!mine) onTake(sel); }} disabled={mine} style={{ flex: 1, minWidth: 0, padding: '7px 4px', background: mine ? 'transparent' : GREEN, color: mine ? TAG_INK : TAG, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: mine ? 'inset 0 0 0 2px rgba(35,48,42,0.25)' : `0 2px 0 ${INK}` }}>{mine ? "it's yours ✓" : 'take it home'}</button>
              </div>
            </div>
          </div>
        </OnTop>
      )}
      </div>
    </div>
  );
}
