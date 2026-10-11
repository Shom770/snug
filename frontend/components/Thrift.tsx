'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Avatar } from './CharacterPanel';
import { OnTop, type PageCtx } from './World';
import type { Outfit } from '../lib/types';
import { itemSprite, sprite } from '../lib/engine';

export interface ThriftTop { id: string; kind: string; name: string; base: string; acc: string | null; fx: string[]; thrift: { theme: string } }

const icon = itemSprite as (kind: string, av: Avatar) => string;
const draw = sprite as (o: Outfit, mood: string, pose: string, av: Avatar) => string;
const FONT = "'Rethink Sans', sans-serif", PIXEL = "'Pixelify Sans', 'Rethink Sans', sans-serif", INK = '#1c1a28', TAG = '#f6e8c6', TAG_INK = '#3b2a2a';
// a paper price tag: corners clipped at the top, where its string goes through
const TAG_CP = 'polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%,0 14px)';
// the shop, in its own pixels (scaled to fit the page; the street is the bottom four rows): a little storefront with a
// curved top, quiet colours, and fairy lights across the front
const SW = 100, SH = 84, BASE = 13; // the facade's shoulders; the arch rises from them to the top row
const R = { door: [8, 36, 17, 44], glass: [10, 39, 13, 15], window: [31, 35, 64, 36], rails: [38, 56], valance: [29, 31, 68] } as const;
const WALL = '#a9b79d', WALL_LINE = '#9cab90', TRIM = '#efe8da', GLASS = '#3a4652', DOOR = '#b86a50';
const top = (x: number) => (x < 18 || x > 81 ? BASE : Math.round(BASE - 11 * Math.sin(Math.PI * (x - 18) / 63))); // the curved top edge
const archY = (x: number) => BASE - 11 * Math.sin(Math.PI * Math.min(63, Math.max(0, x - 18)) / 63);
/** A line following the arch from x0 to x1, `dy` below its edge (the name is painted along one, the banner another). */
const archLine = (x0: number, x1: number, dy: number) => 'M ' + Array.from({ length: 31 }, (_, i) => { const x = x0 + (x1 - x0) * i / 30; return `${x.toFixed(2)} ${(archY(x) + dy).toFixed(2)}`; }).join(' L ');
const BANNER = [29, 71], CLOCK = [16, 27.5, 5]; // the banner's ends; the clock over the door: centre and radius
/** The fairy lights: two swags of warm little bulbs across the front, over the window (the clock has the wall over the door). */
const LIGHTS = (() => {
  const hooks = [34, 66, 97], out: [number, number][] = [];
  for (let i = 0; i < 2; i++) for (let k = 0; k < 7; k++) { const t = k / 7, x = hooks[i] + (hooks[i + 1] - hooks[i]) * t; out.push([Math.round(x), Math.round(24 + 4 * Math.sin(Math.PI * t))]); }
  return out;
})();

/** The name along the arch and the ribbon banner under it, drawn into a canvas at three times the shop's resolution
 * (so the letters come out a little chunky when it's scaled up), each letter turned to follow the curve. */
function drawLettering(theme: string): string {
  const F = 3, cv = document.createElement('canvas');
  cv.width = SW * F; cv.height = SH * F;
  const g = cv.getContext('2d')!;
  g.scale(F, F);
  const along = (x0: number, x1: number, dy: number) => Array.from({ length: 61 }, (_, i) => { const x = x0 + (x1 - x0) * i / 60; return [x, archY(x) + dy] as const; });
  const stroke = (pts: readonly (readonly [number, number])[], w: number, c: string) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineWidth = w; g.strokeStyle = c; g.lineJoin = 'round'; g.stroke(); };
  /** Letters along a curve, centred, each turned to the curve's slope where it sits. */
  const write = (text: string, pts: readonly (readonly [number, number])[], size: number, weight: number, fill: string, edge?: string) => {
    g.font = `${weight} ${size}px 'Rethink Sans', sans-serif`;
    const seg = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1])), len = seg.reduce((a, b) => a + b, 0);
    const widths = [...text].map(ch => g.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
    let s = (len - total) / 2;
    [...text].forEach((ch, n) => {
      let at = s + widths[n] / 2, i = 0;
      while (i < seg.length - 1 && at > seg[i]) { at -= seg[i]; i++; }
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], t = at / seg[i];
      g.save(); g.translate(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); g.rotate(Math.atan2(y1 - y0, x1 - x0));
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      if (edge) { g.lineWidth = 0.8; g.strokeStyle = edge; g.lineJoin = 'round'; g.strokeText(ch, 0, 0); }
      g.fillStyle = fill; g.fillText(ch, 0, 0); g.restore();
      s += widths[n];
    });
  };
  write('hand-me-snugs', along(20, 80, 9.6), 7.4, 800, '#3f4a3b', 'rgba(239,232,218,0.6)');
  // the ribbon: notched tails, the band, a highlight along its top
  [[BANNER[0], -1], [BANNER[1], 1]].forEach(([x, d]) => {
    const y = archY(x) + 13.5;
    g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x + d * 4, y - 1); g.lineTo(x + d * 2.6, y + 1.2); g.lineTo(x + d * 4, y + 3.4); g.lineTo(x, y + 2.4); g.closePath();
    g.fillStyle = '#9c5640'; g.fill(); g.lineWidth = 0.5; g.strokeStyle = INK; g.stroke();
  });
  stroke(along(BANNER[0], BANNER[1], 13.5), 5.4, INK); stroke(along(BANNER[0], BANNER[1], 13.5), 4.4, '#b86a50'); stroke(along(BANNER[0], BANNER[1], 11.9), 0.6, '#c97e64');
  return cv.toDataURL();
}

/** The shop, pixel by pixel and outlined like snug: a sage facade with a soft arch on top and the name painted on it,
 * fairy-light wire swagged across, a terracotta door, a big display window under a little scalloped valance with two
 * rails for this week's tops, planters, the street. */
function drawShop(): string {
  const cv = document.createElement('canvas');
  cv.width = SW; cv.height = SH;
  const g = cv.getContext('2d')!, r = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // the facade: its curved top edged in cream coping, plain plaster with faint courses
  for (let x = 1; x < SW - 1; x++) { const y = top(x); r(x, y - 1, 1, SH - 4 - y + 1, INK); }
  for (let x = 2; x < SW - 2; x++) { const y = top(x); r(x, y, 1, SH - 5 - y, WALL); r(x, y, 1, 2, TRIM); r(x, y + 2, 1, 1, '#c9c0ad'); }
  for (let y = 18; y < SH - 6; y += 5) for (let x = 2; x < SW - 2; x++) if (y > top(x) + 3) r(x, y, 1, 1, WALL_LINE);
  // the fairy lights' wire (the bulbs twinkle on top)
  LIGHTS.forEach(([x, y], i) => { const n = LIGHTS[i + 1]; if (n && Math.abs(n[0] - x) < 6) for (let k = 0; k <= n[0] - x; k++) r(x + k, Math.round(y + (n[1] - y) * k / Math.max(1, n[0] - x)), 1, 1, '#4a4a40'); });
  [34, 66, 97].forEach(x => r(x - 1, 23, 2, 2, INK));
  // the door: terracotta, a glass top, a brass knob, a step
  { const [x, y, w, h] = R.door; r(x - 1, y - 1, w + 2, h + 1, INK); r(x, y, w, h, DOOR); r(x + 1, y, 1, h, '#c97e64'); r(x + w - 2, y, 1, h, '#9c5640');
    const [gx, gy, gw, gh] = R.glass; r(gx - 1, gy - 1, gw + 2, gh + 2, INK); r(gx, gy, gw, gh, GLASS); r(gx + 1, gy + 1, 1, 5, '#4e5b68');
    r(x + 2, y + 24, w - 4, 1, '#9c5640'); r(x + 2, y + 34, w - 4, 1, '#9c5640'); r(x + w - 4, y + 26, 2, 2, '#d9b45a'); r(x - 2, SH - 5, w + 4, 1, '#9a948a'); }
  // the valance over the window: a plain terracotta band with a scalloped edge
  { const [x, y, w] = R.valance; r(x - 1, y - 1, w + 2, 4, INK); r(x, y, w, 2, DOOR); r(x, y, w, 1, '#c97e64');
    for (let i = x; i < x + w; i += 4) { r(i, y + 2, 4, 1, DOOR); r(i + 1, y + 3, 2, 1, DOOR); r(i + 1, y + 4, 2, 1, INK); r(i, y + 3, 1, 1, INK); r(i + 3, y + 3, 1, 1, INK); } }
  // the display window: trim, dark glass, two rails, a faint reflection, a sill, planters with greenery below
  { const [x, y, w, h] = R.window; r(x - 1, y - 1, w + 2, h + 2, INK); r(x, y, w, h, TRIM); r(x + 2, y + 2, w - 4, h - 4, GLASS);
    R.rails.forEach(ry => { r(x + 3, ry, w - 6, 1, '#8c8f98'); r(x + 3, ry + 1, w - 6, 1, '#5e636c'); });
    for (let i = 0; i < 6; i++) { r(x + w - 14 + i, y + 3 + i, 1, 1, '#4e5b68'); r(x + w - 10 + i, y + 3 + i, 1, 1, '#4e5b68'); }
    r(x - 2, y + h, w + 4, 2, TRIM); r(x - 2, y + h + 2, w + 4, 1, INK);
    r(x, y + h + 3, w, 5, INK); r(x + 1, y + h + 4, w - 2, 4, '#8a6a4e'); r(x + 1, y + h + 4, w - 2, 1, '#9c7a5c');
    for (let i = x + 2; i < x + w - 2; i += 3) { r(i, y + h + 2, 2, 2, i % 2 ? '#6f9a5c' : '#5f8a4c'); if (i % 9 === 0) r(i, y + h + 1, 1, 1, '#efe8da'); } }
  // the street
  r(0, SH - 4, SW, 4, '#cfc6b5'); r(0, SH - 4, SW, 1, '#e3dccd'); for (let x = 8; x < SW; x += 16) r(x, SH - 3, 1, 3, '#b8ae9c');
  return cv.toDataURL();
}

/** Snug trying a piece on: just that piece changes (a top goes on as the top, a hoodie over it), everything else stays
 * as it was. */
function tryOn(it: ThriftTop, today: Outfit | undefined, avatar: Avatar): string {
  const base: Outfit = today ?? { top: 'tee', outer: 'none', bottom: 'pants', acc: [] };
  const o: Outfit = it.kind === 'hoodie' ? { ...base, outer: 'hoodie' } : { ...base, top: it.kind as Outfit['top'] };
  return draw(o, 'happy', 'stand', { ...avatar, wearing: { ...((avatar as { wearing?: Record<string, string> }).wearing ?? {}), [it.kind]: it.id } } as Avatar);
}

const layout = (c: PageCtx) => {
  const phone = c.pw < 760, shopW = Math.min(phone ? c.pw * 0.88 : 560, 170 * c.u), s = shopW / SW;
  const shopX = phone ? c.pw - shopW - c.pw * 0.03 : c.pw * 0.5 - shopW * 0.32;
  return { s, shopW, shopX, shopY: c.ground + 3 * c.u - (SH - 2) * s };
};
/** Where snug stands at the thrift shop (its sprite's left edge): just left of it, by the door (on a narrow phone, a
 * little in front of the door, so it stays on screen). */
export const thriftSnugAt = (c: PageCtx) => Math.round(Math.max(-9 * c.u, layout(c).shopX - 33 * c.u)); // never off the edge of a phone

/**
 * The thrift shop, a little way along snug's world: a quiet storefront with this week's tops hanging in the window,
 * made up fresh each Monday for the season where you are. Tap one to see it close up, try it on snug, take it home.
 */
export default function Thrift({ ctx, rack, theme, nextDays, avatar, today, owned, wind, onTake }: {
  ctx: PageCtx; rack: ThriftTop[]; theme: string; nextDays: number; avatar: Avatar; today?: Outfit; owned: Set<string>; wind?: number; onTake: (it: ThriftTop) => void;
}) {
  const [sel, setSel] = useState<ThriftTop | null>(null);
  const [trying, setTrying] = useState<string | null>(null);
  const { s: k, shopW, shopX, shopY } = layout(ctx);
  const shop = useMemo(drawShop, []);
  // the lettering waits for the font, so the canvas doesn't letter it in a fallback
  const [lettering, setLettering] = useState<string | null>(null);
  useEffect(() => { let live = true; document.fonts.ready.then(() => { if (live) setLettering(drawLettering(theme)); }); return () => { live = false; }; }, [theme]);
  const at = (x: number, y: number) => ({ left: shopX + x * k, top: shopY + y * k });
  // walking away: whatever was being tried goes back on the rail
  useEffect(() => { if (!ctx.arrived) { setSel(null); setTrying(null); } }, [ctx.arrived]);
  useEffect(() => { ctx.setSnug(trying ? tryOn(rack.find(r => r.id === trying)!, today, avatar) : null); }, [trying]); // eslint-disable-line react-hooks/exhaustive-deps
  const sway = `${Math.max(1, Math.min(3, (wind ?? 5) / 6))}deg`; // indoors: barely a breath from the door
  const rows = [rack.slice(0, 5), rack.slice(5)], [wx, , ww] = R.window, inX = shopX + (wx + 3) * k, inW = (ww - 6) * k;
  const railY = R.rails.map(y => shopY + y * k), topW = Math.min(76, inW / 4.75); // a full rail: the tops just a touch wider than their spacing
  const days = `${nextDays} day${nextDays === 1 ? '' : 's'}`;
  const sel_ = sel && rack.find(r => r.id === sel.id), mine = !!sel_ && owned.has(sel_.id);
  // the chosen top's tag hangs just below it, its string running from the top's hem down to the tag's hole
  const tag = (() => {
    const at = sel_ ? rack.indexOf(sel_) : -1;
    if (at < 0) return null;
    const ri = at < 5 ? 0 : 1, fromX = inX + (inW / 5) * ((at % 5) + 0.5), fromY = railY[ri] + topW * 0.95, w = Math.min(232, ctx.pw - 24);
    return { fromX, fromY, x: Math.max(12, Math.min(ctx.pw - w - 12, fromX - w / 2)), y: fromY + 16, w };
  })();

  return (
    <div data-thrift style={{ position: 'absolute', inset: 0, fontFamily: FONT }}>
      <style>{`@keyframes thrift-sway{0%,100%{rotate:calc(var(--sw) * -1)}50%{rotate:var(--sw)}}
        @keyframes thrift-twinkle{0%,100%{opacity:1}50%{opacity:.55}}
        @keyframes thrift-swing{0%,100%{rotate:-4deg}50%{rotate:4deg}}
        @keyframes thrift-drop{0%{translate:0 -60px;rotate:-14deg;opacity:0}55%{translate:0 6px;rotate:5deg;opacity:1}78%{rotate:-2deg}100%{translate:0 0;rotate:0deg}}`}</style>
      <img src={shop} alt="" style={{ position: 'absolute', left: shopX, top: shopY, width: shopW, height: SH * k, imageRendering: 'pixelated' }} />
      {/* the name along the arch and the week's theme on its ribbon, lettered at low resolution so they're as chunky as the rest */}
      {lettering && <img src={lettering} alt="" style={{ position: 'absolute', left: shopX, top: shopY, width: shopW, height: SH * k, imageRendering: 'pixelated', pointerEvents: 'none' }} />}
      {/* the theme on the ribbon, in pixel letters (small enough that they need to be sharp to read) */}
      <svg viewBox={`0 0 ${SW} ${SH}`} width={shopW} height={SH * k} aria-hidden style={{ position: 'absolute', left: shopX, top: shopY, overflow: 'visible', pointerEvents: 'none' }}>
        <path id="thrift-banner" d={archLine(BANNER[0] - 6, BANNER[1] + 6, 14.8)} fill="none" />
        <text fontFamily={PIXEL} fontWeight={700} fontSize={3.5} fill={TRIM} letterSpacing={0.15}>
          <textPath href="#thrift-banner" startOffset="50%" textAnchor="middle">{theme} drop</textPath>
        </text>
      </svg>
      {/* a clock hung on a pin over the door, swinging a little: how many days until the next drop */}
      <span aria-hidden style={{ position: 'absolute', ...at(CLOCK[0] - 0.6, CLOCK[1] - 6.9), width: 1.2 * k, height: 1.2 * k, background: '#5a5d66', boxShadow: `0 0 0 ${k * 0.3}px ${INK}`, zIndex: 1 }} />
      <svg viewBox="-7 -7 14 14" width={14 * k} height={14 * k} aria-label={`${days} until the next drop`} style={{ position: 'absolute', ...at(CLOCK[0] - 7, CLOCK[1] - 7), transformOrigin: '50% 2%', animation: 'thrift-swing 3.4s ease-in-out infinite' }}>
        <line x1={0} y1={-6.7} x2={-2.2} y2={-5.2} stroke={INK} strokeWidth={0.35} /><line x1={0} y1={-6.7} x2={2.2} y2={-5.2} stroke={INK} strokeWidth={0.35} />
        <circle r={CLOCK[2] + 0.7} fill={INK} /><circle r={CLOCK[2]} fill={TRIM} /><circle r={CLOCK[2] - 0.5} fill="none" stroke="#d6cab5" strokeWidth={0.4} />
        {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return <rect key={i} x={Math.cos(a) * (CLOCK[2] - 0.9) - 0.3} y={Math.sin(a) * (CLOCK[2] - 0.9) - 0.3} width={0.6} height={0.6} fill={i < 7 - nextDays ? '#c9c0ad' : '#b86a50'} />; })}
        <text y={1.2} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={4.6} fill="#3f4a3b">{nextDays}</text>
        <text y={3.1} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={1.25} letterSpacing={0.1} fill="#3f4a3b" opacity={0.75}>{nextDays === 1 ? 'DAY LEFT' : 'DAYS LEFT'}</text>
      </svg>
      {/* fairy lights: little glass bulbs on the wire, each glowing in its own time */}
      {LIGHTS.map(([x, y], i) => (
        <svg key={i} viewBox="0 0 3 5" width={1.8 * k} height={3 * k} shapeRendering="crispEdges" aria-hidden
          style={{ position: 'absolute', ...at(x - 0.9, y), filter: `drop-shadow(0 0 ${1.6 * k}px rgba(255,206,110,0.8))`, animation: `thrift-twinkle ${2.2 + (i * 37 % 13) / 10}s ${(i * 53 % 17) / 10}s ease-in-out infinite` }}>
          <rect x="0.5" y="0" width="2" height="1" fill="#4a4a40" /><rect x="0" y="1" width="3" height="3" fill="#ffd77a" /><rect x="1" y="4" width="1" height="1" fill="#ffd77a" />
          <rect x="0" y="1" width="1" height="1" fill="#fff6d6" /><rect x="2" y="3" width="1" height="1" fill="#f0b850" />
        </svg>
      ))}
      {/* a paper "open" card hanging in the door, in pixel letters */}
      <span aria-hidden style={{ position: 'absolute', ...at(R.glass[0] + 1.5, R.glass[1] + 5), width: (R.glass[2] - 3) * k, padding: `${k * 0.5}px 0`, textAlign: 'center', background: TRIM, color: '#b86a50', fontFamily: PIXEL, fontSize: Math.max(9, k * 2.7), fontWeight: 700, lineHeight: 1, boxShadow: `0 ${k * 0.4}px 0 rgba(0,0,0,0.25)`, rotate: '-3deg' }}>open</span>
      {rows.map((row, ri) => row.map((it, i) => {
        const n = ri * 5 + i, x = inX + (inW / 5) * (i + 0.5) - topW / 2, yours = owned.has(it.id), on = sel_?.id === it.id;
        return (
          <button key={it.id} onClick={() => { setSel(on ? null : it); if (on) setTrying(null); }} aria-label={it.name}
            style={{ position: 'absolute', left: x, top: railY[ri] - topW * 0.14, width: topW, transformOrigin: '50% 0', ['--sw' as string]: sway, animation: `thrift-sway ${2.4 + (n % 3) * 0.3}s ${n * 0.17}s ease-in-out infinite`, zIndex: on ? 2 : 1 }}>
            {/* the hanger's hook and shoulders */}
            <svg viewBox="0 0 12 6" width={topW * 0.5} height={topW * 0.25} shapeRendering="crispEdges" aria-hidden style={{ display: 'block', margin: '0 auto' }}>
              <rect x="5" y="0" width="2" height="1" fill="#3a3a40" /><rect x="6" y="1" width="1" height="2" fill="#3a3a40" /><rect x="2" y="3" width="8" height="1" fill="#3a3a40" /><rect x="0" y="4" width="12" height="1" fill="#3a3a40" />
            </svg>
            <img src={icon(it.kind, { ...avatar, wardrobe: { [it.kind]: [{ id: it.id }] } })} alt="" style={{ display: 'block', width: topW, height: topW * 24 / 28, marginTop: -topW * 0.06, imageRendering: 'pixelated', filter: on ? 'drop-shadow(0 0 3px #fff6c8)' : 'drop-shadow(0 2px 1px rgba(0,0,0,0.3))' }} />
            {yours && <span style={{ position: 'absolute', right: -4, top: topW * 0.25, padding: '0 4px', background: TAG, color: TAG_INK, fontSize: 8.5, fontWeight: 800, clipPath: 'polygon(4px 0,100% 0,100% 100%,4px 100%,0 50%)' }}>yours</span>}
          </button>
        );
      }))}

      {/* a top up close: its paper tag, hanging from it on a string */}
      {sel_ && tag && (
        <OnTop>
          <svg aria-hidden width={ctx.pw} height={ctx.ph} style={{ position: 'absolute', left: 0, top: 0, zIndex: 4, pointerEvents: 'none', overflow: 'visible' }}>
            <line x1={tag.fromX} y1={tag.fromY} x2={tag.x + tag.w / 2} y2={tag.y + 8} stroke="#d8c29a" strokeWidth={1.5} />
          </svg>
          <div key={sel_.id} style={{ position: 'absolute', left: tag.x, top: tag.y, width: tag.w, zIndex: 4, transformOrigin: '50% 0', animation: 'thrift-drop .55s cubic-bezier(.3,.7,.4,1) both' }}>
          <div style={{ position: 'relative', padding: '18px 14px 12px', background: TAG, color: TAG_INK, clipPath: TAG_CP, filter: 'drop-shadow(0 4px 0 rgba(58,31,12,0.35))' }}>
            <span aria-hidden style={{ position: 'absolute', left: 'calc(50% - 4px)', top: 4, width: 8, height: 8, borderRadius: '50%', background: '#a8743f', boxShadow: 'inset 1px 1px 0 #6e4a28' }} />
            <button onClick={() => { setSel(null); setTrying(null); }} aria-label="put it back" style={{ position: 'absolute', right: 10, top: 6, fontSize: 21, lineHeight: 1, fontWeight: 800, color: TAG_INK, opacity: 0.55 }}>×</button>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, opacity: 0.6 }}>{sel_.thrift.theme.toUpperCase()} DROP</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <img src={icon(sel_.kind, { ...avatar, wardrobe: { [sel_.kind]: [{ id: sel_.id }] } })} alt="" style={{ width: 70, height: 60, imageRendering: 'pixelated', flex: 'none' }} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>{sel_.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, marginTop: 3 }}>limited time</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setTrying(t => (t === sel_.id ? null : sel_.id))} style={{ flex: 1, minWidth: 0, padding: '7px 4px', background: trying === sel_.id ? '#3b2a2a' : 'rgba(59,42,42,0.12)', color: trying === sel_.id ? TAG : TAG_INK, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{trying === sel_.id ? 'take it off' : 'try it on'}</button>
              <button onClick={() => { if (!mine) onTake(sel_); }} disabled={mine} style={{ flex: 1, minWidth: 0, padding: '7px 4px', background: mine ? 'transparent' : '#b0453a', color: mine ? TAG_INK : '#fff6e2', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: mine ? 'inset 0 0 0 2px rgba(59,42,42,0.25)' : '0 2px 0 #6e2a22' }}>{mine ? "it's yours ✓" : 'take it home'}</button>
            </div>
          </div>
          </div>
        </OnTop>
      )}
    </div>
  );
}
